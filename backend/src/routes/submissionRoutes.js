const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const requireRoles = require("../middleware/requireRoles")
const submissionController = require("../controllers/submissionController")

const router = express.Router()

router.get("/:id", authMiddleware, submissionController.getSubmission)
router.get("/:id/files", authMiddleware, submissionController.getFileContent)
router.get("/:id/download", authMiddleware, submissionController.downloadSubmission)
router.patch(
  "/:id/grade",
  authMiddleware,
  requireRoles("teacher", "admin"),
  submissionController.gradeSubmission,
)

module.exports = router
