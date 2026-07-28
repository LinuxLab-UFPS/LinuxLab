const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET

function parseCookies(request) {
  const cookies = {}
  const header = request.headers?.cookie
  if (!header) return cookies
  header.split(";").forEach((c) => {
    const [k, ...v] = c.trim().split("=")
    if (k) cookies[k] = v.join("=")
  })
  return cookies
}

function wsAuth(request) {
  const cookies = parseCookies(request)
  const token = cookies.token

  if (!token) {
    return { error: "Unauthorized: session not found" }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return { user: decoded }
  } catch {
    return { error: "Unauthorized: invalid or expired session" }
  }
}

module.exports = wsAuth
