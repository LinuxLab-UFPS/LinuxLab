const express = require("express")
const enrollmentService = require("../services/enrollmentService")
const authService = require("../services/authService")
const config = require("../config/env")
const { registerSelfStudentSchema, setStudentCodeSchema } = require("../dtos/authDtos")
const { serializeUser } = require("../dtos/userDtos")
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
// existe la crea; si existe sin código, lo actualiza. Acepta también el nombre,
// que el formulario de "Completar información" manda junto al código.
//
// La sesión se vuelve a firmar con el usuario ya completo: el payload del JWT
// lleva el código (y el nombre), y es justo lo que la puerta de "Completar
// información" lee en el layout para decidir si bloquea. Sin esta re-emisión,
// quien acababa de completar el formulario seguiría viéndolo hasta reloguear.
router.post(
  "/me/code",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { code, name } = parseOrThrow(setStudentCodeSchema, req.body ?? {})
    await enrollmentService.setSelfStudentCode({ userId: req.user.id, code, name })
    const freshUser = await authService.getSessionUser(req.user.id)
    res.cookie(config.jwt.cookieName, authService.signSession(freshUser), config.jwt.cookie)
    res.json({ user: serializeUser(freshUser) })
  }),
)

module.exports = router
