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

  wss.on("connection", (ws, request) => {    ws.isAlive = true
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
    //
    // El tamaño se recuerda, no solo se aplica: al reiniciar nace una PTY nueva
    // sin que el navegador vuelva a abrir el socket, asi que nadie lo repite.
    let stream = null
    let size = null
    let sessionUser = null
    let messageWindow = { count: 0, resetAt: Date.now() + 1000 }

    const applySize = (nuevo) => {
      if (!nuevo) return
      size = nuevo
      if (stream) stream.setWindow(nuevo.rows, nuevo.cols, 0, 0)
    }

    /**
     * Abre una PTY para el usuario y engancha su salida al socket.
     *
     * Cada manejador comprueba que su stream siga siendo el vigente: al
     * reiniciar, el anterior muere a proposito, y su `end` no puede anunciar
     * que la sesion termino ni cerrar el socket que va a usar el siguiente.
     */
    const abrirPty = async (username) => {
      const pty = await containerService.openPtySession(username)
      stream = pty
      if (size) pty.setWindow(size.rows, size.cols, 0, 0)

      pty.on("data", (data) => {
        if (stream !== pty || ws.readyState !== ws.OPEN) return
        // Backpressure: si el cliente no consume (ventana minimizada, red
        // lenta), no acumular sin limite; se descarta la salida sobrante y
        // el stream del contenedor hace de valvula.
        if (ws.bufferedAmount > MAX_BUFFERED_BYTES) return
        ws.send(JSON.stringify({ type: "output", data: data.toString() }))
      })

      pty.on("end", () => {
        if (stream !== pty || ws.readyState !== ws.OPEN) return
        ws.send(JSON.stringify({ type: "exit", code: 0 }))
        ws.close()
      })

      pty.on("error", (err) => {
        if (stream !== pty) return
        logger.warn({ err, username }, "Terminal stream error")
        if (ws.readyState === ws.OPEN) ws.close(4001, "Error de la sesión")
      })
    }

    /**
     * "Reset terminal", por el socket que ya esta abierto.
     *
     * Antes era un POST y una conexion nueva, y ahi estaba el fallo: el
     * navegador abria el socket nuevo mientras el viejo se cerraba y se quedaba
     * en NS_ERROR_NET_RESET —sin llegar a negociar— reintento tras reintento,
     * hasta rendirse. Sin reconexion no hay carrera que perder.
     *
     * Ademas el orden queda garantizado aqui dentro: primero mueren los
     * procesos del usuario, despues nace la PTY. Cuando lo repartian el cliente
     * y el servidor, la sesion nueva podia entrar a tiempo para el ultimo
     * barrido del `pkill`.
     */
    let reiniciando = false
    const reiniciar = async () => {
      if (reiniciando || !sessionUser) return
      reiniciando = true
      try {
        const anterior = stream
        stream = null
        if (anterior) anterior.destroy()

        await containerService.resetTerminal(sessionUser.id)
        if (ws.readyState !== ws.OPEN) return

        await abrirPty(sessionUser.linuxAccount.linux_username)
        if (ws.readyState !== ws.OPEN) {
          // Se fue mientras se abria: no dejar una PTY sin nadie al otro lado.
          if (stream) stream.destroy()
          stream = null
          return
        }

        ws.send(JSON.stringify({ type: "reset-ok" }))
        logger.info({ userId: sessionUser.id }, "Terminal reset")
      } catch (err) {
        logger.error({ err }, "Terminal reset failed")
        if (ws.readyState === ws.OPEN) ws.close(1011, "No se pudo reiniciar la sesión")
      } finally {
        reiniciando = false
      }
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
        } else if (msg.type === "reset") {
          reiniciar()
        }
      } catch {
        // mensajes invalidos se ignoran
      }
    })

    // Todo el flujo de apertura esta dentro de try/catch: un fallo de base o de
    // SSH aqui no puede tumbar el proceso (un rechazo async sin cazar derriba
    // el event loop de Node).
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
        await abrirPty(user.linuxAccount.linux_username)
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

      logger.info({ userId: sessionUser.id, username: sessionUser.linuxAccount.linux_username }, "Terminal session opened")
    }
    openSession()

    ws.on("close", () => {
      logger.info("Terminal session closed")
      if (stream) stream.destroy()
    })
  })

  /** Cierra el WebSocketServer y detiene el heartbeat (shutdown ordenado). */
  return function close() {
    stopHeartbeat(heartbeat)
    for (const client of wss.clients) client.terminate()
    wss.close()
  }
}

module.exports = setupGateway
