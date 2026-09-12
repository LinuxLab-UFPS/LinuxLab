jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

const mockSsh = {
  execCommand: jest.fn(),
  createExecStream: jest.fn(),
}
jest.mock("../../src/services/sshService", () => mockSsh)

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

describe("CU06..CU10 — provisionamiento del estudiante en el grupo Unix del curso", () => {
  test("createStudent crea el usuario en el grupo Unix con el home endurecido", async () => {
    await containerService.createStudent("docente01", "G-0001", "grp_abc", "estudiante01")

    const comandos = mockSsh.execCommand.mock.calls.map((c) => c[0])
    const alta = comandos.find((c) => c.includes("useradd"))
    expect(alta).toBeDefined()
    expect(alta).toContain("usermod -aG grp_abc estudiante01")
    expect(alta).toContain("chmod 2700")
    expect(alta).toContain("/home/docente01/grupos/G-0001/estudiante01")
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
})
