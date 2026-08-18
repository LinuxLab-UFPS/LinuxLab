const studentActivityService = require("../services/studentActivityService")
const asyncHandler = require("../utils/asyncHandler")

const getStudentActivityDetail = asyncHandler(async (req, res) => {
  const { id, activityId, studentId } = req.params
  const result = await studentActivityService.getStudentActivityDetail(
    id,
    activityId,
    studentId,
    req.user.id,
    req.user.role,
  )
  res.json(result)
})

module.exports = { getStudentActivityDetail }
