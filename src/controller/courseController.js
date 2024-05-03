const { default: axios } = require('axios')
const Achievement = require('../models/achievement')
const Course = require('../models/course')
const Grades = require('../models/gradesSummary')
const User = require('../models/user')
const mongoose = require('mongoose')

const getAllCourses = async (req, res) => {
  try {
    const user = req.user
    const filter = req.query.filter

    // getCoursesWithPrivilege func populates users
    const courses = await Course.getCoursesWithPrivilege(user._id)

    console.log(courses)

    let result = courses
    if (filter) result = courses.filter((course) => course.status === filter)

    return res.json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
}

const getOneCourse = async (req, res) => {
  try {
    const { courseId } = req.params

    const result = await Course.findOne({ _id: courseId })

    return res.json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
}

const createCourse = async (req, res) => {
  try {
    const { courseName, description, image } = req.body;

    if (!courseName)
      return res.status(400).json({ error: 'missing courseName' });

    const user = req.user;

    let course = new Course({
      name: courseName,
      description: description || '',
      createdBy: user._id,
      image: image || undefined
    });

    // Check if course is not created (unlikely, but just in case)
    if (!course)
      return res.status(500).json({ error: 'Failed to create course' });

    // Enroll user in the course
    course.enroll(user._id, user.role);
    course = await course.save();

    // Update user's enrollments
    user.enrollments.push(course._id);
    await user.save();

    // Get updated list of courses with user's privileges
    const result = await Course.getCoursesWithPrivilege(user._id);

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);

    // If course is created but there's an error, delete the created course
    if (course) {
      await Course.findByIdAndDelete(course._id);
    }

    // Handle error response
    return res.status(400).json({ error: err.message || err.toString() });
  }
};


const updateCourse = async (req, res) => {
  const courseId = req.params.courseId
  const { name, description, image, status, backgroundColor } = req.body

  try {
    const course = {
      name: name,
      description: description,
      image: image,
      status: status,
      backgroundColor: backgroundColor
    }

    const result = await Course.findByIdAndUpdate(courseId, course, {
      new: true,
      omitUndefined: true
    }).orFail()

    await result
      .populate(
        'enrollments.user createdBy',
        '_id name username email code photo'
      )
      .execPopulate()

    return res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
}

const enroll = async (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.body.userId;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).orFail().session(session);
    let course = await Course.findById(courseId).orFail().session(session);

    course = course.enroll(user._id, user.role);
    await course.save({ session });
    user.enrollments.push(courseId);
    await user.save({ session });

    //send to machine learning api

    const result = await Course.getCoursesWithPrivilege(userId).session(session);

    await session.commitTransaction();

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.status(400).json({ error: err.message || err.toString() });
  } finally {
    session.endSession();
  }
}

const unEnroll = async (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.body.userId;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).orFail().session(session);
    let course = await Course.findById(courseId).orFail().session(session);

    course = course.unEnroll(user._id);
    await course.save({ session });
    user.enrollments = user.enrollments.filter((e) => e.toString() !== courseId);
    await user.save({ session });

    //send to machine learning api

    const result = await Course.getCoursesWithPrivilege(userId).session(session);

    await session.commitTransaction();

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.status(400).json({ error: err.message || err.toString() });
  } finally {
    session.endSession();
  }
}

const getEnrollments = async (req, res) => {
  try {
    const courseId = req.params.courseId

    const course = await Course.findById(courseId)
      .populate('enrollments.user')
      .exec()

    return res.status(200).json(course.enrollments)
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
}

const updateEnrollment = async (req, res) => {
  try {
    const courseId = req.params.courseId
    const enrollmentId = req.body.enrollmentId

    const course = await Course.findById(courseId)
      .populate('enrollments.user')
      .exec()

    const enrollmentToUpdate = course.enrollments.id(enrollmentId)

    enrollmentToUpdate.enrolledAs = req.body.enrolledAs
    const result = await course.save()

    return res.status(200).json(result.enrollments)
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
}

const deleteCourse = async (req, res) => {
  const courseId = req.params.courseId

  try {
    let course = await Course.findById(courseId).orFail()

    for (const enrollment of course.enrollments) {
      const user = await User.findById(enrollment.user.toString()).orFail()

      user.enrollments = user.enrollments.filter(
        (e) => e.toString() !== courseId
      )
      await user.save()
    }
    await course.remove()

    return res.status(204).end()
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
}

const endCourse = async (req, res) => {
  const courseId = req.params.courseId

  try {
    const gradeRecords = await Grades.getGradesByUser(courseId)

    for (const studentGrade of gradeRecords) {
      const data = JSON.stringify({
        Student: studentGrade.studentName,
        Course: studentGrade.courseName,
        Grade: studentGrade.grade
      })

      const certificateUrl = axios
        .post('', {
          Student: studentGrade.studentName,
          Course: studentGrade.courseName,
          Grade: studentGrade.gradeLetter
        })
        .then((res) => {
          const newAchievement = new Achievement({
            ...studentGrade,
            certificate: res.data
          })
          newAchievement.save()
        })
        .catch((err) => console.log(err))
    }

    await Course.findByIdAndUpdate(
      courseId,
      { status: 'archived' },
      { omitUndefined: true }
    )

    return res.status(204).end()
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
}

const getDeadLines = async (req, res) => {
  try {
    const user = req.user

    let result = []
    for (const courseId of user.enrollments) {
      const courseDeadlines = await Course.getDeadLines(courseId)
      result = result.concat(courseDeadlines)
    }

    return res.json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
}

const getDeadLinesCalendar = async (req, res) => {
  try {
    const user = req.user

    let result = []
    for (const courseId of user.enrollments) {
      const courseDeadlines = await Course.getDeadLines(courseId)
      result = result.concat(courseDeadlines)
    }

    result = Course.formatCalendar(result)

    return res.json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
}

module.exports = {
  createCourse,
  getAllCourses,
  getOneCourse,
  enroll,
  unEnroll,
  deleteCourse,
  updateCourse,
  getEnrollments,
  updateEnrollment,
  getDeadLines,
  getDeadLinesCalendar,
  endCourse
}
