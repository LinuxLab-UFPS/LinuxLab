const express = require("express")
const requireRoles = require("../middleware/requireRoles")
const teacherMiddleware = requireRoles("teacher", "admin")
const groupController = require("../controllers/groupController")
const activityController = require("../controllers/activityController")

const router = express.Router()

router.use(teacherMiddleware)

router.post("/", groupController.createGroup)
router.get("/", groupController.listGroups)
// Antes de /:id: "provisioning" no debe caer en el parametro de grupo.
router.get("/provisioning/status", groupController.teacherProvisioningStatus)
router.get("/:id", groupController.getGroup)
router.patch("/:id", groupController.updateGroup)
router.patch("/:id/archive", groupController.archiveGroup)
router.post("/:id/unarchive", groupController.unarchiveGroup)
router.post("/:id/finalize", groupController.finalizeGroup)
router.post("/:id/invite/rotate", groupController.rotateInvite)
router.delete("/:id", groupController.deleteGroup)

router.post("/:id/students", groupController.registerStudent)
router.post("/:id/students/csv", groupController.importCsv)
router.get("/:id/students", groupController.listStudents)
router.get("/:id/gradebook", groupController.getGradebook)
router.get("/:id/gradebook/students/:studentId", groupController.getStudentPerformance)
router.get("/:id/progress", groupController.getGroupProgress)
router.get("/:id/finalize/preview", groupController.finalizePreview)
router.get("/:id/certificates", groupController.listCertificates)
router.get("/:id/certificates/acta", groupController.actaPdf)
router.get("/:id/provisioning-jobs", groupController.listProvisioningJobs)
router.post("/:id/reconcile", groupController.reconcileGroup)

// Actividades del curso (docente)
router.get("/:id/activities", activityController.listGroupActivities)
router.post("/:id/activities", activityController.createGroupActivity)
router.get("/:id/activities/:activityId", activityController.getGroupActivity)
router.patch("/:id/activities/:activityId", activityController.updateGroupActivity)
// Habilitar/deshabilitar una actividad publicada (RF-GRP-10). "publish" es el
// inverso de "disable": la publicacion en si ocurre al crear (no hay borrador).
router.post("/:id/activities/:activityId/publish", activityController.enableGroupActivity)
router.post("/:id/activities/:activityId/disable", activityController.disableGroupActivity)
router.post("/:id/activities/:activityId/extend-due", activityController.extendGroupActivityDueDate)
router.get("/:id/activities/:activityId/submissions", activityController.getActivitySubmissions)
router.get("/:id/activities/:activityId/manual-submissions", activityController.getManualSubmissions)

module.exports = router
