const { Assessment } = require('../models/assessment')
const Submission = require('../models/submissions')
const GradesSummary = require('../models/gradesSummary')

const getAllSubmissions = async (request, response) => {
  try {
    const { courseId, assessmentId } = request.params

    const assessmentData = await Assessment.findById(assessmentId).orFail()

    const result = await Submission.find({
      course: courseId,
      assessment: assessmentId,
      submittedAt: { $exists: true }
    })
      .populate('student', 'photo name')
      .populate('assessment', 'dueDate')
      .populate('answers.originQuestion')
      .exec()

    return response.json({ assessment: assessmentData, submissions: result })
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const getOneSubmission = async (request, response) => {
  try {
    const { courseId, assessmentId, studentId } = request.params;

    let result = await Submission.findOne({
      course: courseId,
      assessment: assessmentId,
      student: studentId
    });

    if (!result) {
      result = await Submission.create({
        course: courseId,
        assessment: assessmentId,
        student: studentId
      });
    }

    result = await Submission.findById(result._id)

      .populate({
        path: 'assessment',
        populate: { path: 'questions', select: '-ans' }
      })
      .populate('student', 'photo name')
      .exec();

    if (result.assessment.type === 'Exam') {
      result.numberOfExamJoins = result.numberOfExamJoins + 1;
      await result.save();
    }

    return response.json(result);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal Server Error' });
  }
};


// const createSubmission = async (request, response) => {
//   try {
//     const result = await Submission.create(request.body)

//     // await result
//     //   .populate({
//     //     path: 'assessment',
//     //     populate: { path: 'questions', select: '-ans' }
//     //   })
//     //   .populate('student', 'photo name')
//     //   .execPopulate()

//     return response.json(result)
//   } catch (err) {
//     console.log(err)
//     response.status(400).json({ error: err.message || err.toString() })
//   }
// }

const createSubmission = async (request, response) => {
  try {
    const result = await Submission.create(request.body);

    // After creating the submission, if there are fields referencing other documents,
    // you can populate them after querying the document
    const populatedResult = await Submission.findById(result._id)
      .populate({
        path: 'assessment',
        populate: { path: 'questions', select: '-ans' }
      })
      .populate('student', 'photo name');

    return response.json(populatedResult);
  } catch (err) {
    console.log(err);
    response.status(400).json({ error: err.message || err.toString() });
  }
};


const updateSubmission = async (request, response) => {
  try {
    const { courseId, assessmentId, studentId } = request.params;

    // Find and update the submission
    let result = await Submission.findOneAndUpdate(
      {
        course: courseId,
        assessment: assessmentId,
        student: studentId
      },
      {
        ...request.body,
        submittedAt: Date.now()
      },
      { new: true, omitUndefined: true }
    ).orFail();


    result = await Submission.findById(result._id)
      .populate({
        path: 'assessment',
        populate: { path: 'questions', select: '-ans' }
      })
      .populate('student', 'photo name')
      .exec();

    return response.json(result);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal Server Error' });
  }
};


const gradeSubmission = async (request, response) => {
  try {
    const { courseId, assessmentId, studentId } = request.params

    const assessmentData = await Assessment.findById(assessmentId).orFail()

    await Submission.findOneAndUpdate(
      {
        course: courseId,
        assessment: assessmentId,
        student: studentId
      },
      { ...request.body, gradedAt: Date.now(), gradedBy: request.user.id },
      { new: true, omitUndefined: true }
    ).orFail()

    const result = await Submission.find({
      course: courseId,
      assessment: assessmentId,
      submittedAt: { $exists: true }
    })
      .populate('student', 'photo name')
      .populate('assessment', 'dueDate')
      .populate('answers.originQuestion')
      .exec()

    await GradesSummary.updateOrCreate(
      courseId,
      studentId,
      assessmentId,
      assessmentData,
      request.body.score
    )

    return response.json({ assessment: assessmentData, submissions: result })
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const getGradesGradeBook = async (request, response) => {
  try {
    const { courseId } = request.params

    let result = await Submission.find(
      {
        course: courseId
      },
      'course score gradedAt gradedBy submittedAt'
    )
      .populate(
        'assessment',
        'type title maxScore weight closeAt openAt dueDate'
      )
      .populate('student', 'photo name')


    result = result.filter((submission) => submission.submittedAt)

    return response.json(result)
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const deleteAllSubmissions = async (request, response) => {
  try {
    await Submission.deleteMany({})
    return response.status(204).end()
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

module.exports = {
  getAllSubmissions,
  getOneSubmission,
  createSubmission,
  updateSubmission,
  gradeSubmission,
  getGradesGradeBook,
  deleteAllSubmissions
}