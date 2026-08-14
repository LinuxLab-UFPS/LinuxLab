const express = require("express")
const rateLimit = require("express-rate-limit")
const authMiddleware = require("../middleware/authMiddleware")
const requireRoles = require("../middleware/requireRoles")
const activityController = require("../controllers/activityController")

const router = express.Router()

// Evaluar y resetear ejecutan trabajo SSH contra el entorno por cada request:
// sin limite, un cliente podria saturar el contenedor con evaluaciones.
const evalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas evaluaciones, espera un momento", code: "TOO_MANY_REQUESTS" },
})

// El estudiante sale de la sesion, nunca del cuerpo de la peticion: el cliente
// pide "evalua esta actividad", no "aprueba a este usuario".
// El catalogo va ANTES de /:slug para que "catalog" no se coma el slug.
router.get("/catalog", requireRoles("teacher", "admin"), activityController.getCatalog)
router.get("/mine/status", authMiddleware, activityController.getMyStatus)
router.get("/:slug", authMiddleware, activityController.getActivity)
router.post("/:slug/check", authMiddleware, evalLimiter, activityController.checkActivity)
router.post("/:slug/reset", authMiddleware, evalLimiter, activityController.resetActivity)

module.exports = router
