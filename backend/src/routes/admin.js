const express = require("express")
const adminMiddleware = require("../middleware/admin")
const adminController = require("../controllers/adminController")

const router = express.Router()

router.get("/docentes", adminMiddleware, adminController.listTeachers)
router.post("/docentes", adminMiddleware, adminController.registerTeacher)
router.patch("/docentes/:id", adminMiddleware, adminController.toggleTeacherStatus)

module.exports = router
