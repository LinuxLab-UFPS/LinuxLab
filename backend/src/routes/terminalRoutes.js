const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const containerService = require("../services/containerService")
const asyncHandler = require("../utils/asyncHandler")

const router = express.Router()

router.post(
  "/reset",
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json(await containerService.resetTerminal(req.user.id))
  }),
)

module.exports = router
