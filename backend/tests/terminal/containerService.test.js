jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

const mockSsh = {
  execCommand: jest.fn(),
  createExecStream: jest.fn(),
}
jest.mock("../../src/services/sshService", () => mockSsh)

const prisma = require("../../prisma/client")
const containerService = require("../../src/services/containerService")

/** Respuestas SSH por defecto: el entorno existe y el home pertenece al usuario. */
function sshExitoso(command) {
  if (command.includes("getent group")) return { code: 0, stdout: "", stderr: "" }
  if (command.includes("stat -c %u")) return { code: 0, stdout: "1001\n", stderr: "" }
  if (command.includes("id -u")) return { code: 0, stdout: "1001\n", stderr: "" }
  if (command.includes("id -nG")) return { code: 0, stdout: "grp_abc\n", stderr: "" }
  return { code: 0, stdout: "", stderr: "" }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSsh.execCommand.mockImplementation(async (command) => sshExitoso(command))
})

describe("RNF-03/RNF-07 — aislamiento y limites del entorno Linux", () => {
  test("createStudent crea el usuario en el grupo Unix con el home endurecido", async () => {
    await containerService.createStudent("docente01", "G-0001", "grp_abc", "estudiante01")

    const comandos = mockSsh.execCommand.mock.calls.map((c) => c[0])
    const alta = comandos.find((c) => c.includes("useradd"))
    expect(alta).toBeDefined()
    expect(alta).toContain("usermod -aG grp_abc estudiante01")
    expect(alta).toContain("chmod 2700")
    expect(alta).toContain("/home/docente01/grupos/G-0001/estudiante01")
  })

  test("createStudent aplica cuota de disco y techos de cgroup por estudiante", async () => {
    await containerService.createStudent("docente01", "G-0001", "grp_abc", "estudiante01")

    const comandos = mockSsh.execCommand.mock.calls.map((c) => c[0])
    const endurecimiento = comandos.find((c) => c.includes("cpu.max"))
    expect(endurecimiento).toBeDefined()
    expect(endurecimiento).toContain("memory.high")
    expect(endurecimiento).toContain("memory.max")
    expect(endurecimiento).toContain("10000 100000")
    expect(endurecimiento).toContain("32M")
    expect(endurecimiento).toContain("64M")
    expect(endurecimiento).toContain("setquota -u estudiante01 0 20480 0 3000 /home")
  })

  test("createStudent aborta si el grupo Unix del curso no existe", async () => {
    mockSsh.execCommand.mockImplementation(async (command) => {
      if (command.includes("getent group")) return { code: 1, stdout: "", stderr: "" }
      return sshExitoso(command)
    })

    await expect(
      containerService.createStudent("docente01", "G-0001", "grp_abc", "estudiante01"),
    ).rejects.toThrow(/grupo Unix grp_abc no existe/)

    const comandos = mockSsh.execCommand.mock.calls.map((c) => c[0])
    expect(comandos.some((c) => c.includes("useradd"))).toBe(false)
  })

  test("openPtySession lanza el shell del estudiante con nice y su (sin privilegios)", async () => {
    mockSsh.createExecStream.mockReturnValue({})

    await containerService.openPtySession("estudiante01")

    const [command] = mockSsh.createExecStream.mock.calls[0]
    expect(command).toContain("exec nice -n 10 su - estudiante01")
    expect(command).not.toMatch(/exec[^']*sudo/)
  })

  test("provisionStudentAccount marca linux_provisioned solo tras verificar el entorno", async () => {
    prisma.linuxAccount.update.mockResolvedValue({})

    await containerService.provisionStudentAccount(
      "user-1",
      "estudiante01",
      "docente01",
      "G-0001",
      "grp_abc",
    )

    expect(prisma.linuxAccount.update).toHaveBeenCalledWith({
      where: { user_id: "user-1" },
      data: { linux_provisioned: true },
    })
  })

  test("provisionStudentAccount falla y no marca la cuenta si el home es ajeno", async () => {
    mockSsh.execCommand.mockImplementation(async (command) => {
      if (command.includes("stat -c %u")) return { code: 0, stdout: "9999\n", stderr: "" }
      return sshExitoso(command)
    })

    await expect(
      containerService.provisionStudentAccount(
        "user-1",
        "estudiante01",
        "docente01",
        "G-0001",
        "grp_abc",
      ),
    ).rejects.toThrow(/home of estudiante01 is not owned/)

    expect(prisma.linuxAccount.update).not.toHaveBeenCalled()
  })
})

describe("RNF-07 — reset de terminal y validacion del nombre de cuenta", () => {
  test("resetTerminal mata los procesos del usuario", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      linuxAccount: { linux_username: "estudiante01" },
    })

    const res = await containerService.resetTerminal("user-1")

    expect(res).toEqual({ ok: true })
    expect(mockSsh.execCommand).toHaveBeenCalledWith(
      expect.stringContaining("pkill -u estudiante01"),
    )
  })

  test("resetTerminal rechaza un nombre de cuenta con caracteres inyectables", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      linuxAccount: { linux_username: "est; rm -rf /" },
    })

    await expect(containerService.resetTerminal("user-1")).rejects.toMatchObject({ statusCode: 500 })
    expect(mockSsh.execCommand).not.toHaveBeenCalled()
  })
})
