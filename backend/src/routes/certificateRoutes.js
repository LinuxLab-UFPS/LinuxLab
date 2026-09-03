const express = require("express")
const rateLimit = require("express-rate-limit")
const authMiddleware = require("../middleware/authMiddleware")
const certificateController = require("../controllers/certificateController")

const router = express.Router()

// La verificacion por codigo es publica: el limite contiene enumeracion
// fuerza-bruta de codigos sin sesion.
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas consultas, espera un momento", code: "TOO_MANY_REQUESTS" },
})

// "mine" va antes de /:code para que no se lo coma el parametro.
router.get("/mine", authMiddleware, certificateController.listMine)
router.get("/:code", publicLimiter, certificateController.verifyByCode)
router.get("/:code/pdf", publicLimiter, certificateController.pdfByCode)

module.exports = router
