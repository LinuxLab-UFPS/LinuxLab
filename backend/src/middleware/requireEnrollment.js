const { AppError } = require("../lib/errors")

function requireEnrollment(req, _res, next) {
  if (req.user?.role === "student" && req.user?.hasEnrollment === false) {
    return next(new AppError("Debes estar matriculado en un grupo de laboratorio para acceder a este recurso", 403, "FORBIDDEN"))
  }
  next()
}

module.exports = requireEnrollment
