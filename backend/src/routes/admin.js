const express = require("express")
const adminMiddleware = require("../middleware/admin")
const adminController = require("../controllers/adminController")

const router = express.Router()

router.get("/docentes", adminMiddleware, adminController.listTeachers)
router.post("/docentes", adminMiddleware, adminController.registerTeacher)
router.patch("/docentes/:id", adminMiddleware, adminController.toggleTeacherStatus)
router.post("/linux-accounts/reconcile", adminMiddleware, adminController.reconcileAll)

router.get("/environment", adminMiddleware, adminController.environmentSnapshot)
router.post("/environment/requeue", adminMiddleware, adminController.requeueFailed)
router.post("/environment/account", adminMiddleware, adminController.ensureOwnAccount)

module.exports = router
