const express = require("express")
const config = require("../config/env")
const authMiddleware = require("../middleware/authMiddleware")
const authService = require("../services/authService")
const enrollmentService = require("../services/enrollmentService")
const { inviteTokenSchema } = require("../dtos/groupDtos")
const { parseOrThrow } = require("../dtos/common")
const asyncHandler = require("../utils/asyncHandler")

const router = express.Router()

/** Auth opcional: si hay sesión válida, adjunta req.user; si no, continúa. */
function optionalAuth(req, _res, next) {
  const token = req.cookies?.[config.jwt.cookieName]
  if (token) {
    try {
      req.user = authService.verifyToken(token)
    } catch {}
  }
  next()
}

router.get(
  "/group/:id/info",
  optionalAuth,
  asyncHandler(async (req, res) => {
    res.json(
      await enrollmentService.getGroupInfo({
        groupId: req.params.id,
        token: req.query.token || "",
        req,
      }),
    )
  }),
)

router.post(
  "/group/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { token } = parseOrThrow(inviteTokenSchema, req.body ?? {})
    const outcome = await enrollmentService.joinWithToken({
      groupId: req.params.id,
      token,
      user: req.user,
      req,
    })
    // La matricula cambia hasEnrollment; re-emitimos la cookie para que el
    // server (home, /inscripcion/pendiente) refleje el nuevo estado sin
    // obligar a reloguearse.
    if (outcome.enrolled) {
      const freshUser = await authService.getSessionUser(req.user.id)
      res.cookie(config.jwt.cookieName, authService.signSession(freshUser), config.jwt.cookie)
    }
    res.json(outcome)
  }),
)

module.exports = router