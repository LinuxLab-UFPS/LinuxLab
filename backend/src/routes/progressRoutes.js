const express = require("express")
const requireRoles = require("../middleware/requireRoles")
const progressController = require("../controllers/progressController")

const router = express.Router()

router.use(requireRoles("student"))

router.get("/mine", progressController.getMyProgress)
// OJO: /mine/lessons debe declararse antes de nada que capture /mine/...
router.get("/mine/lessons", progressController.getMyReadLessons)
router.post("/lesson-read", progressController.markLessonRead)

module.exports = router