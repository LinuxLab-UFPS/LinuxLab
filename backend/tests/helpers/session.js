/**
 * Construye la cookie de sesion para un usuario de prueba.
 * Firma un JWT real con el secreto del entorno de test, asi que
 * authMiddleware lo procesa sin mocks y cada suite prueba la
 * autorizacion de verdad. El require va dentro para no arrastrar
 * la cadena de mocks durante la carga del archivo.
 */
function sessionCookie(user) {
  const authService = require("../../src/services/authService")
  const token = authService.signSession({
    id: "user-1",
    email: "estudiante@ufps.edu.co",
    role: "student",
    name: "Estudiante",
    code: "1150001",
    hasEnrollment: false,
    ...user,
  })
  return `token=${token}`
}

module.exports = { sessionCookie }
