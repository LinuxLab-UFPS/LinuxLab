const express = require("express")
const authMiddleware = require("../middleware/auth")
const activityController = require("../controllers/activityController")

const router = express.Router()

// El estudiante sale de la sesion, nunca del cuerpo de la peticion. `/mine`
// va ANTES de `/:id` para que "mine" no se coma el id.
router.get("/mine", authMiddleware, activityController.getMyGroupActivities)
router.get("/:id", authMiddleware, activityController.getGroupActivityForStudent)
router.post("/:id/check", authMiddleware, activityController.checkGroupActivity)

module.exports = router
