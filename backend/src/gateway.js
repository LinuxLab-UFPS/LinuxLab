const { WebSocketServer } = require("ws")
const wsAuth = require("./middleware/wsAuth")
const prisma = require("../prisma/client")
const linuxContainerService = require("./services/linuxContainerService")
const enrollmentService = require("./services/enrollmentService")

function setupGateway(server) {
  const wss = new WebSocketServer({ server, path: "/terminal" })

  wss.on("connection", async (ws, request) => {
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

    let stream
    try {
      stream = await linuxContainerService.openPtySession(user.linuxAccount.linux_username)
    } catch (err) {
      ws.close(4001, `Container error: ${err.message}`)
      return
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

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === "input") {
          stream.write(msg.data)
        } else if (msg.type === "resize") {
          stream.setWindow(msg.rows, msg.cols, 0, 0)
        }
      } catch {
        // skip invalid messages
      }
    })

    ws.on("close", () => {
      if (stream) stream.destroy()
    })
  })
}

module.exports = setupGateway
