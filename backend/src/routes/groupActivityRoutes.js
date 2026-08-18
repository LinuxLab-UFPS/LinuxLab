const express = require("express")
const rateLimit = require("express-rate-limit")
const authMiddleware = require("../middleware/authMiddleware")
const activityController = require("../controllers/activityController")

const router = express.Router()

// Misma proteccion que /api/activities/:slug/check: la comprobacion de una
// actividad de curso tambien ejecuta SSH contra el entorno.
const checkLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas evaluaciones, espera un momento", code: "TOO_MANY_REQUESTS" },
})

// El estudiante sale de la sesion, nunca del cuerpo de la peticion. `/mine`
// va ANTES de `/:id` para que "mine" no se coma el id.
router.get("/mine", authMiddleware, activityController.getMyGroupActivities)
router.get("/mine/grades", authMiddleware, activityController.getMyGrades)
router.get("/:id", authMiddleware, activityController.getGroupActivityForStudent)
router.post("/:id/check", authMiddleware, checkLimiter, activityController.checkGroupActivity)
router.post("/:id/submit", authMiddleware, activityController.submitGroupActivity)

module.exports = router
