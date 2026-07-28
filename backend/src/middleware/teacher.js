const authMiddleware = require("./auth")

function teacherMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    const role = req.user?.role
    if (role !== "teacher" && role !== "admin") {
      return res.status(403).json({ error: "Forbidden: teacher or admin role required" })
    }
    next()
  })
}

module.exports = teacherMiddleware
