const { WebSocketServer } = require("ws")
const wsAuth = require("./wsAuthMiddleware")
const prisma = require("../../prisma/client")
const containerService = require("../services/containerService")
const enrollmentService = require("../services/enrollmentService")
const logger = require("../lib/logger")
const { startHeartbeat, stopHeartbeat } = require("./heartbeat")

const MAX_MESSAGE_BYTES = 64 * 1024
const MAX_MESSAGES_PER_SECOND = 30
const MAX_BUFFERED_BYTES = 8 * 1024 * 1024

function setupGateway(server) {
  const wss = new WebSocketServer({ server, path: "/terminal", maxPayload: MAX_MESSAGE_BYTES })
  const heartbeat = startHeartbeat(wss)
  wss.on("close", () => stopHeartbeat(heartbeat))

  wss.on("connection", (ws, request) => {
    ws.isAlive = true
    ws.on("pong", () => {
      ws.isAlive = true
    })
    ws.on("error", (err) => {
      logger.warn({ err }, "WebSocket error")
    })

    // El navegador manda el tamaño en cuanto abre el socket, pero abrir la PTY
    // pasa por la base y por SSH. Sin escuchar desde ya, ese primer mensaje
    // llegaba antes de que existiera el manejador y se perdía: la PTY se
    // quedaba con su tamaño por defecto mientras la pantalla tenía otro, y
    // cualquier programa que dibuje por posición (vi, top) salía descuadrado.
    let stream = null
    let pending = null
    let messageWindow = { count: 0, resetAt: Date.now() + 1000 }

    const applySize = (size) => {
      if (!size) return
      if (stream) stream.setWindow(size.rows, size.cols, 0, 0)
      else pending = size
    }

    ws.on("message", (raw) => {
      // Limites de abuso: un cliente no puede inundar el gateway ni mandar
      // payloads gigantes (input que iria a la PTY del contenedor).
      if (raw.length > MAX_MESSAGE_BYTES) {
        ws.close(1009, "Mensaje demasiado grande")
        return
      }
      const now = Date.now()
      if (now > messageWindow.resetAt) {
        messageWindow = { count: 0, resetAt: now + 1000 }
      }
      messageWindow.count += 1
      if (messageWindow.count > MAX_MESSAGES_PER_SECOND) {
        ws.close(1008, "Demasiados mensajes")
        return
      }

      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === "input") {
          if (stream) stream.write(msg.data)
        } else if (msg.type === "resize") {
          applySize({ rows: msg.rows, cols: msg.cols })
        }
      } catch {
        // mensajes invalidos se ignoran
      }
    })

    // Todo el flujo de apertura esta dentro de try/catch: un fallo de base o de
    // SSH aqui no puede tumbar el proceso (un rechazo async sin cazar derriba
    // el event loop de Node).
    let sessionUser = null
    const openSession = async () => {
      try {
        const auth = wsAuth(request)
        if (auth.error) {
          ws.close(4001, "Sesión no válida")
          return
        }

        const user = await prisma.user.findUnique({
          where: { id: auth.user.id },
          include: { linuxAccount: true },
        })

        if (!user?.linuxAccount?.linux_username) {
          ws.close(4001, "No tienes cuenta Linux configurada")
          return
        }

        // El estudiante pierde la terminal en cuanto se archiva su grupo: su
        // usuario se elimina del entorno y la sesion JWT (7 dias) puede seguir
        // viva, asi que la puerta de entrada a la consola tambien valida.
        if (user.role === "student" && !(await enrollmentService.hasActiveEnrollment(user.id))) {
          ws.close(4001, "No te encuentras registrado en ningún grupo de laboratorio")
          return
        }

        sessionUser = user
        stream = await containerService.openPtySession(user.linuxAccount.linux_username)
      } catch (err) {
        // El detalle interno (base, SSH) no llega al cliente: solo al log.
        logger.error({ err }, "Terminal session failed")
        try {
          ws.close(1011, "Error al abrir la sesión")
        } catch {
          // el socket pudo cerrarse mientras tanto
        }
        return
      }

      // El tamaño que llegó mientras se abría la sesión.
      if (pending) {
        stream.setWindow(pending.rows, pending.cols, 0, 0)
        pending = null
      }

      stream.on("data", (data) => {
        if (ws.readyState === ws.OPEN) {
          // Backpressure: si el cliente no consume (ventana minimizada, red
          // lenta), no acumular sin limite; se descarta la salida sobrante y
          // el stream del contenedor hace de valvula.
          if (ws.bufferedAmount > MAX_BUFFERED_BYTES) return
          ws.send(JSON.stringify({ type: "output", data: data.toString() }))
        }
      })

      stream.on("end", () => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "exit", code: 0 }))
          ws.close()
        }
      })

      stream.on("error", (err) => {
        logger.warn({ err, username: sessionUser?.linuxAccount?.linux_username }, "Terminal stream error")
        if (ws.readyState === ws.OPEN) ws.close(4001, "Error de la sesión")
      })

      logger.info({ userId: sessionUser.id, username: sessionUser.linuxAccount.linux_username }, "Terminal session opened")
    }
    openSession()

    ws.on("close", () => {
      logger.info("Terminal session closed")
      if (stream) stream.destroy()
    })
  })
}

module.exports = setupGateway
