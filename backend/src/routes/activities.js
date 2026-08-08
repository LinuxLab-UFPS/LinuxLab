const express = require("express")
const authMiddleware = require("../middleware/auth")
const requireRoles = require("../middleware/requireRoles")
const activityController = require("../controllers/activityController")

const router = express.Router()

// El estudiante sale de la sesion, nunca del cuerpo de la peticion: el cliente
// pide "evalua esta actividad", no "aprueba a este usuario".
router.get("/bank", requireRoles("teacher", "admin"), activityController.listBank)
router.get("/mine/status", authMiddleware, activityController.getMyStatus)
router.get("/:slug", authMiddleware, activityController.getActivity)
router.post("/:slug/check", authMiddleware, activityController.checkActivity)
router.post("/:slug/reset", authMiddleware, activityController.resetActivity)

module.exports = router
