const onlineGraderUrl = 'https://koyo-lms.onrender.com/gradeOnline'
const fileGraderUrl = 'https://koyo-lms.onrender.com/grade'

const axios = require('axios')

const { Assessment } = require('../models/assessment')
const Course = require('../models/course')
const Submission = require('../models/submissions')

const getPdfUrl = (files) => {
  for (const file of files) {
    const index = file.url.lastIndexOf('.')
    const baseFileUrl = ''
    if (file.url.slice(index + 1) === 'pdf')
      return file.url.slice(file.url.indexOf(baseFileUrl) + baseFileUrl.length)
  }
  return ''
}

const autoGrade = async function (courseId, assessmentId) {
  try {
    const submissions = await Submission.find({
      assessment: assessmentId,
      submittedAt: { $exists: true }
    })
      .populate('answers.originQuestion')
      .populate('assessment')
      .exec()

    const assessment = await Assessment.findById(assessmentId)
      .populate('questions')
      .exec()

    let questionData = []
    for (const question of assessment.questions) {
      questionData.push(question.toObject())
    }

    for (const sub of submissions) {
      let result
      if (sub.assessment.submissionType === 'online') {
        let questions_arr = []
        for (const answer of sub.answers) {
          questions_arr.push(answer.studentAnswer)
        }
        const graderInput = { modelAns: { data: questionData }, questions_arr }

        result = await axios.post(onlineGraderUrl, graderInput)
      } else if (sub.assessment.submissionType === 'written') {
        const graderInput = {
          modelAns: { data: questionData },
          studentAns: getPdfUrl(sub.files)
        }

        result = await axios.post(fileGraderUrl, graderInput)
      }

      sub.answers = result.data[0]
      sub.autoGradingStatus = 'Graded'
      await sub.save()
    }

    // Handling auto-grading completion
    console.log('Auto-grading completed successfully.')

  } catch (err) {
    console.error('Error auto-grading submissions:', err)

    // Handling errors and updating submission statuses
    await Submission.updateMany(
      { assessment: assessmentId, submittedAt: { $exists: true } },
      { autoGradingStatus: 'error' },
      { omitUndefined: true }
    )
  }
}

module.exports = { autoGrade }
