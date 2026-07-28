const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET

function authMiddleware(req, res, next) {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: session not found" })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: "Unauthorized: invalid or expired session" })
  }
}

module.exports = authMiddleware
