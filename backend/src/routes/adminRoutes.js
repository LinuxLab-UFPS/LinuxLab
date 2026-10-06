const express = require("express")
const requireRoles = require("../middleware/requireRoles")
const adminMiddleware = requireRoles("admin")
const adminController = require("../controllers/adminController")
const teacherRequestController = require("../controllers/teacherRequestController")

const router = express.Router()

router.get("/docentes", adminMiddleware, adminController.listTeachers)
router.get("/docentes/provisioning-jobs", adminMiddleware, adminController.listTeacherProvisioningJobs)
router.get("/docentes/solicitudes", adminMiddleware, teacherRequestController.list)
router.get("/docentes/solicitudes/count", adminMiddleware, teacherRequestController.count)
router.post("/docentes/solicitudes/:id/aprobar", adminMiddleware, teacherRequestController.approve)
router.post("/docentes/solicitudes/:id/rechazar", adminMiddleware, teacherRequestController.reject)
router.post("/docentes", adminMiddleware, adminController.registerTeacher)
router.post("/docentes/:id/invite", adminMiddleware, adminController.resendTeacherInvite)
router.patch("/docentes/:id", adminMiddleware, adminController.toggleTeacherStatus)
router.post("/linux-accounts/reconcile", adminMiddleware, adminController.reconcileAll)

router.get("/environment", adminMiddleware, adminController.environmentSnapshot)
router.post("/environment/requeue", adminMiddleware, adminController.requeueFailed)
router.post("/environment/account", adminMiddleware, adminController.ensureOwnAccount)

module.exports = router
