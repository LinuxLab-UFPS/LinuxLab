const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const preferenceService = require("../services/preferenceService")
const asyncHandler = require("../utils/asyncHandler")

const router = express.Router()

router.put(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json(await preferenceService.update(req.user.id, req.body))
  }),
)

module.exports = router
