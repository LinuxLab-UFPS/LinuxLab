const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const progressController = require("../controllers/progressController")

const router = express.Router()

router.get("/progress", authMiddleware, progressController.getProgress)
router.post("/lessons/:topicSlug/:subtopicId/view", authMiddleware, progressController.recordView)

module.exports = router
