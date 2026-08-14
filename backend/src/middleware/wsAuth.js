const jwt = require("jsonwebtoken")
const config = require("../config/env")

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
  const token = cookies[config.jwt.cookieName]

  if (!token) {
    return { error: "Unauthorized: session not found" }
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    return { user: decoded }
  } catch {
    return { error: "Unauthorized: invalid or expired session" }
  }
}

module.exports = wsAuth
