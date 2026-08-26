const express = require("express")
const enrollmentService = require("../services/enrollmentService")
const { registerSelfStudentSchema, setStudentCodeSchema } = require("../dtos/authDtos")
const { parseOrThrow } = require("../dtos/common")
const asyncHandler = require("../utils/asyncHandler")
const authMiddleware = require("../middleware/authMiddleware")

const router = express.Router()

// Registro propio de estudiante (vía formulario de la página de login). Crea la
// cuenta de usuario y la fila Student con su código. Es público porque el
// estudiante aún no tiene sesión en la plataforma.
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = parseOrThrow(registerSelfStudentSchema, req.body ?? {})
    await enrollmentService.registerSelfStudent(data)
    res.status(201).json({ message: "Cuenta de estudiante registrada." })
  }),
)

// Define el código del estudiante autenticado. Cubre el caso de quienes entran
// por Gmail (loginWithIdToken crea el User pero no la fila Student): si no
// existe la crea; si existe sin código, lo actualiza.
router.post(
  "/me/code",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { code } = parseOrThrow(setStudentCodeSchema, req.body ?? {})
    await enrollmentService.setSelfStudentCode({ userId: req.user.id, code })
    res.json({ message: "Código actualizado." })
  }),
)

module.exports = router
