const submissionService = require("../services/submissionService")
const asyncHandler = require("../utils/asyncHandler")

const createSubmission = asyncHandler(async (req, res) => {
  const result = await submissionService.createSubmission(req.user.id, req.params.id)
  res.status(201).json(result)
})

const getSubmission = asyncHandler(async (req, res) => {
  const result = await submissionService.getSubmission(req.params.id, req.user.id, req.user.role)
  res.json(result)
})

const getFileContent = asyncHandler(async (req, res) => {
  const filePath = req.query.path
  if (!filePath) {
    return res.status(400).json({ error: "Se requiere el parámetro path" })
  }
  const content = await submissionService.getFileContent(
    req.params.id,
    filePath,
    req.user.id,
    req.user.role,
  )
  res.json({ path: filePath, content })
})

const downloadSubmission = asyncHandler(async (req, res) => {
  const url = await submissionService.getDownloadUrl(req.params.id, req.user.id, req.user.role)
  res.redirect(url)
})

const gradeSubmission = asyncHandler(async (req, res) => {
  const { score, feedback } = req.body
  const result = await submissionService.gradeSubmission(
    req.params.id,
    req.user.id,
    score,
    feedback,
  )
  res.json(result)
})

module.exports = {
  createSubmission,
  getSubmission,
  getFileContent,
  downloadSubmission,
  gradeSubmission,
}
