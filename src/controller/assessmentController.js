const { Assessment, Exam, Assignment } = require('../models/assessment')
const { Question } = require('../models/assessmentsQuestions')
const Submission = require('../models/submissions')

const schedule = require('node-schedule')

const { autoGrade } = require('../../src/helper/autoGradingJob')
const { default: axios } = require('axios')

const { checkplagiarismJob } = require('../../src/helper/plagarismJob')
const { DateTime } = require('luxon')
const Course = require('../models/course')
const Notification = require('../models/notification')

const autoGraderUrl = 'https://koyo-lms.onrender.com/gradeOnline'

const getAllAssessments = async (request, response) => {
  try {
    const { courseId } = request.params
    const filter = request.query.filter
    const assetments = await Assessment.find({ course: courseId })
      .populate('questions', '-ans')
      .exec()

    let result = assetments
    if (filter)
      result = assetments.filter((Assessment) => Assessment.type === filter)

    // for student there will be function to check if there is a submission for assessment and return alreadySubmited: true and (optional)probably get grades too
    // for the instructor should be virtual to check all submission for that exam that are still not graded
    // https://mongoosejs.com/docs/populate.html#count here for virtual

    return response.json(result)
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const getOneAssessment = async (request, response) => {
  try {
    const { courseId, id } = request.params

    const assetment = await Assessment.find({
      course: courseId,
      _id: id
    })

      .populate('questions')

    return response.json(assetment)
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const createAssessment = async (request, response) => {
  try {
    const { questions, ...assessment } = request.body

    const questionsIds = []
    if (questions) {
      for (const question of questions) {
        const newQuestion = await Question.create(question)
        questionsIds.push(newQuestion.id)
      }
    }
    const result = await Assessment.create({
      ...assessment,
      questions: questionsIds
    })

    // Remove the populate() call since it's not needed for an array of IDs.

    return response.json(result)
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}


const queuePlagarismjob = async (request, response) => {
  try {
    const { courseId, assessmentId } = request.params

    await Submission.updateMany(
      {
        course: courseId,
        assessment: assessmentId,
        submittedAt: { $exists: true }
      },
      { plagarismStatus: 'processing' },
      { omitUndefined: true }
    )

    const date = DateTime.now().plus({ seconds: 5 }).toJSDate()

    const job = schedule.scheduleJob(
      date,
      checkplagiarismJob.bind(null, courseId, assessmentId)
    )

    const assessmentData = await Assessment.findById(assessmentId).orFail()
    const result = await Submission.find({
      course: courseId,
      assessment: assessmentId,
      submittedAt: { $exists: true }
    })
      .populate('student', 'photo name')
      .populate('answers.originQuestion')
      .populate('assessment', 'dueDate')
      .exec()

    return response.json({ assessment: assessmentData, submissions: result })
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const queueAutoGrade = async (request, response) => {
  try {
    const { courseId, assessmentId } = request.params;

    // Update submission statuses to 'processing'
    await Submission.updateMany(
      { assessment: assessmentId, submittedAt: { $exists: true } },
      { autoGradingStatus: 'processing' }
    );

    // Schedule auto-grading job
    const date = DateTime.now().plus({ seconds: 5 }).toJSDate();
    const job = schedule.scheduleJob(date, () => {
      autoGrade(courseId, assessmentId)
        .then(() => {
          // Fetch updated assessment and submissions data after grading
          return Promise.all([
            Assessment.findById(assessmentId).orFail(),
            Submission.find({
              course: courseId,
              assessment: assessmentId,
              submittedAt: { $exists: true }
            })
            .populate('student', 'photo name')
            .populate('answers.originQuestion')
            .populate('assessment', 'dueDate')
            .exec()
          ]);
        })
        .then(([assessmentData, submissions]) => {
          response.json({ assessment: assessmentData, submissions });
        })
        .catch(err => {
          console.error('Error processing auto-grading:', err);
          response.status(400).json({ error: err.message || err.toString() });
        });
    });

  } catch (err) {
    console.error('Error queuing auto-grade:', err);
    response.status(400).json({ error: err.message || err.toString() });
  }
};

const deleteAssessment = async (request, response) => {
  try {
    const { courseId, id } = request.params

    const assessment = await Assessment.findByIdAndDelete(id)

    if (!assessment) {
      return response.status(404).json({ error: 'Assessment not found' })
    }

    await Submission.deleteMany({ assessment: id, course: courseId })

    // Use bulk delete operation to delete questions related to the assessment
    await Question.deleteMany({ _id: { $in: assessment.questions } })

    return response.status(204).end()
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const deleteAllAssessments = async (request, response) => {
  try {
    await Assessment.deleteMany({})


    return response.status(204).end()
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const deleteAllQuestions = async (request, response) => {
  try {
    await Question.deleteMany({})

    return response.status(204).end()
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

module.exports = {
  getAllAssessments,
  getOneAssessment,
  createAssessment,
  deleteAssessment,
  deleteAllAssessments,
  deleteAllQuestions,
  queuePlagarismjob,
  queueAutoGrade
}
