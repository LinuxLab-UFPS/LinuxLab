const { WebSocketServer } = require("ws")
const wsAuth = require("./wsAuthMiddleware")
const prisma = require("../../prisma/client")
const containerService = require("../services/containerService")
const enrollmentService = require("../services/enrollmentService")

function setupGateway(server) {
  const wss = new WebSocketServer({ server, path: "/terminal" })

  wss.on("connection", async (ws, request) => {
    // El navegador manda el tamaño en cuanto abre el socket, pero abrir la PTY
    // pasa por la base y por SSH. Sin escuchar desde ya, ese primer mensaje
    // llegaba antes de que existiera el manejador y se perdía: la PTY se
    // quedaba con su tamaño por defecto mientras la pantalla tenía otro, y
    // cualquier programa que dibuje por posición (vi, top) salía descuadrado.
    let stream = null
    let pending = null

    const applySize = (size) => {
      if (!size) return
      if (stream) stream.setWindow(size.rows, size.cols, 0, 0)
      else pending = size
    }

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === "input") {
          if (stream) stream.write(msg.data)
        } else if (msg.type === "resize") {
          applySize({ rows: msg.rows, cols: msg.cols })
        }
      } catch {
        // skip invalid messages
      }
    })

    const auth = wsAuth(request)
    if (auth.error) {
      ws.close(4001, auth.error)
      return
    }

    let user
    try {
      user = await prisma.user.findUnique({
        where: { id: auth.user.id },
        include: { linuxAccount: true },
      })
    } catch (err) {
      ws.close(1011, `Database error: ${err.message}`)
      return
    }

    if (!user || !user.linuxAccount?.linux_username) {
      ws.close(4001, "No linux account configured")
      return
    }

    // El estudiante pierde la terminal en cuanto se archiva su grupo: su
    // usuario se elimina del entorno y la sesion JWT (7 dias) puede seguir
    // viva, asi que la puerta de entrada a la consola tambien valida.
    if (user.role === "student" && !(await enrollmentService.hasActiveEnrollment(user.id))) {
      ws.close(4001, "No te encuentras registrado en ningún grupo de laboratorio")
      return
    }

    try {
      stream = await containerService.openPtySession(user.linuxAccount.linux_username)
    } catch (err) {
      ws.close(4001, `Container error: ${err.message}`)
      return
    }

    // El tamaño que llegó mientras se abría la sesión.
    if (pending) {
      stream.setWindow(pending.rows, pending.cols, 0, 0)
      pending = null
    }

    stream.on("data", (data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "output", data: data.toString() }))
      }
    })

    stream.on("end", () => {
      ws.send(JSON.stringify({ type: "exit", code: 0 }))
      ws.close()
    })

    stream.on("error", () => {
      ws.close(4001, "Stream error")
    })

    ws.on("close", () => {
      if (stream) stream.destroy()
    })
  })
}

module.exports = setupGateway
