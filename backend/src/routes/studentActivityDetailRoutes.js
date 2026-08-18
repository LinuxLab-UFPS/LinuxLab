const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const controller = require("../controllers/studentActivityDetailController")

const router = express.Router({ mergeParams: true })

router.get("/", authMiddleware, controller.getStudentActivityDetail)

module.exports = router
