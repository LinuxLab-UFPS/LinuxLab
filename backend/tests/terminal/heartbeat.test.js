const { startHeartbeat, stopHeartbeat, HEARTBEAT_INTERVAL_MS } = require("../../src/gateway/heartbeat")

function makeClient(isAlive) {
  return { isAlive, ping: jest.fn(), terminate: jest.fn() }
}

describe("RNF-08 — cierre de sesiones de terminal inactivas", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test("termina a los clientes que no respondieron al ping anterior", () => {
    const muerto = makeClient(false)
    const vivo = makeClient(true)
    const wss = { clients: [muerto, vivo] }

    const interval = startHeartbeat(wss)
    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS)

    expect(muerto.terminate).toHaveBeenCalledTimes(1)
    expect(muerto.ping).not.toHaveBeenCalled()
    expect(vivo.ping).toHaveBeenCalledTimes(1)
    expect(vivo.isAlive).toBe(false)

    stopHeartbeat(interval)
  })

  test("un cliente que no responde en el siguiente ciclo tambien se termina", () => {
    const cliente = makeClient(true)
    const wss = { clients: [cliente] }

    const interval = startHeartbeat(wss)
    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS)
    expect(cliente.terminate).not.toHaveBeenCalled()

    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS)
    expect(cliente.terminate).toHaveBeenCalledTimes(1)

    stopHeartbeat(interval)
  })

  test("stopHeartbeat detiene el latido", () => {
    const cliente = makeClient(true)
    const wss = { clients: [cliente] }

    const interval = startHeartbeat(wss)
    stopHeartbeat(interval)
    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 3)

    expect(cliente.ping).not.toHaveBeenCalled()
  })
})
