const authMiddleware = require("./auth")
const { AuthorizationError } = require("../lib/errors")

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    authMiddleware(req, res, () => {
      if (!allowedRoles.includes(req.user?.role)) {
        return next(new AuthorizationError(`Se requiere uno de estos roles: ${allowedRoles.join(", ")}`))
      }
      next()
    })
  }
}

module.exports = requireRoles
