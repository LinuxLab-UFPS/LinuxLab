const express = require("express")
const rateLimit = require("express-rate-limit")
const teacherRequestController = require("../controllers/teacherRequestController")

const router = express.Router()

// El formulario es publico: el limite frena a quien lo llene en bucle.
const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes, intente de nuevo más tarde", code: "TOO_MANY_REQUESTS" },
})

router.post("/", requestLimiter, teacherRequestController.create)

module.exports = router
