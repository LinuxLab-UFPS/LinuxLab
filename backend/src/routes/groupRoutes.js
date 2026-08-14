const express = require("express")
const requireRoles = require("../middleware/requireRoles")
const teacherMiddleware = requireRoles("teacher", "admin")
const groupController = require("../controllers/groupController")
const activityController = require("../controllers/activityController")

const router = express.Router()

router.use(teacherMiddleware)

router.post("/", groupController.createGroup)
router.get("/", groupController.listGroups)
router.get("/:id", groupController.getGroup)
router.patch("/:id/archive", groupController.archiveGroup)
router.delete("/:id", groupController.deleteGroup)

router.post("/:id/students", groupController.registerStudent)
router.post("/:id/students/csv", groupController.importCsv)
router.get("/:id/students", groupController.listStudents)
router.get("/:id/provisioning-jobs", groupController.listProvisioningJobs)
router.post("/:id/reconcile", groupController.reconcileGroup)

// Actividades del curso (docente)
router.get("/:id/activities", activityController.listGroupActivities)
router.post("/:id/activities", activityController.createGroupActivity)
router.get("/:id/activities/:activityId", activityController.getGroupActivity)
router.patch("/:id/activities/:activityId", activityController.updateGroupActivity)

module.exports = router
