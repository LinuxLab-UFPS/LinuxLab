const certificateService = require("../services/certificateService")
const asyncHandler = require("../utils/asyncHandler")
const { sendPdf } = require("../utils/pdfResponse")

const verifyByCode = asyncHandler(async (req, res) => {
  res.json(await certificateService.resolveByCode(req.params.code))
})

const pdfByCode = asyncHandler(async (req, res) => {
  const { buffer, filename } = await certificateService.pdfByCode(req.params.code)
  sendPdf(res, buffer, filename)
})

const listMine = asyncHandler(async (req, res) => {
  res.json(await certificateService.listMine(req.user.id))
})

module.exports = { verifyByCode, pdfByCode, listMine }
