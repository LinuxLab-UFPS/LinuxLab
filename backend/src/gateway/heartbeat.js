/**
 * Heartbeat del WebSocket: sin ping/pong, un cliente que se durmio (laptop
 * cerrada, NAT con timeout) deja la sesion PTY y su stream vivos para siempre.
 * Con el ping periodico, la sesion que no responde se cierra y libera la PTY.
 */

const HEARTBEAT_INTERVAL_MS = 30000
const HEARTBEAT_TIMEOUT_MS = 60000

function startHeartbeat(wss) {
  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        // No respondio al ping anterior: sesion muerta.
        ws.terminate()
        continue
      }
      ws.isAlive = false
      ws.ping()
    }
  }, HEARTBEAT_INTERVAL_MS)
  interval.unref()
  return interval
}

function stopHeartbeat(interval) {
  clearInterval(interval)
}

module.exports = { startHeartbeat, stopHeartbeat, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS }
