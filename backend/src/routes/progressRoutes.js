const express = require("express")
const requireRoles = require("../middleware/requireRoles")
const progressController = require("../controllers/progressController")

const router = express.Router()

router.use(requireRoles("student"))

router.get("/mine", progressController.getMyProgress)
router.post("/lesson-read", progressController.markLessonRead)

module.exports = router