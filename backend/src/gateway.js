const { WebSocketServer } = require("ws")
const wsAuth = require("./middleware/wsAuth")
const prisma = require("../prisma/client")
const linuxContainerService = require("./services/linuxContainerService")

function setupGateway(server) {
  const wss = new WebSocketServer({ server, path: "/terminal" })

  wss.on("connection", async (ws, request) => {
    const auth = wsAuth(request)
    if (auth.error) {
      ws.close(4001, auth.error)
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: { linuxAccount: true },
    })
    if (!user || !user.linuxAccount?.linux_username) {
      ws.close(4001, "No linux account configured")
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
        if (msg.type === "input") stream.write(msg.data)
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
