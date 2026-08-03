const express = require("express")
const teacherMiddleware = require("../middleware/teacher")
const groupController = require("../controllers/groupController")

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

module.exports = router
