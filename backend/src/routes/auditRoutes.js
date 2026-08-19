const express = require("express")
const requireRoles = require("../middleware/requireRoles")
const auditController = require("../controllers/auditController")

const router = express.Router()

router.use(requireRoles("admin", "teacher"))

router.get("/", auditController.listAuditEvents)
router.get("/groups/:id/recent", auditController.listGroupAuditEvents)

module.exports = router
