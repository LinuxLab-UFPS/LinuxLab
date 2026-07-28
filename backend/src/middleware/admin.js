const authMiddleware = require("./auth")

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: admin role required" })
    }
    next()
  })
}

module.exports = adminMiddleware
