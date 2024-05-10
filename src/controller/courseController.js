const { default: axios } = require('axios')
const Achievement = require('../models/achievement')
const Course  = require('../models/course')
const Grades = require('../models/gradesSummary')
const User = require('../models/user')

const getAllCourses = async (req, res) => {
  try {
    const user = req.user
    const filter = req.query.filter

    const courses = await Course.getCoursesWithPrivilege(user._id)

    console.log(courses)

    let result = courses
    if (filter) result = courses.filter((course) => course.status === filter)

    return res.json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
};

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
    const user = req.user;

    // Debugging console.log to check request body
    console.log('Request Body:', req.body);

    // Debugging console.log
    console.log('Creating Course:', req.body.courseName, req.body.description, req.user._id);

    // Check if courseName is defined
    if (!req.body.courseName) {
      console.log('courseName is undefined!');
      return res.status(400).json({ error: 'missing courseName' });
    }

    // Create a new Course object using provided // createCourse function
    const course = new Course({
      name: req.body.courseName,
      description: req.body.description,
      createdBy: req.user._id,
      image: req.body.image,
    });

    // Save the course
    await course.save();

    // Enroll user in the course
    course.enroll(user._id, user.role);

    // Update user's enrollments
    user.enrollments.push(course._id);
    await user.save();

    // Get updated list of courses with user's privileges
    const result = await Course.getCoursesWithPrivilege(user._id);

    // Send response
    return res.status(201).json(result);
  } catch (err) {
    // console.log(err);

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
    })

    await result
      .populate(
        'enrollments.user createdBy',
        '_id name username email code photo'
      )


    return res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message || err.toString() })
  }
}

const enroll = async (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.body.userId;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    // Find the course by ID
    let course = await Course.findById(courseId);

    // Ensure both user and course exist
    if (!user || !course) {
      return res.status(404).json({ error: 'User or course not found' });
    }

    // Check if the user is already enrolled in the course
    if (user.enrollments.includes(courseId)) {
      return res.status(400).json({ error: 'User is already enrolled in the course' });
    }

    // Enroll the user in the course and save changes
    course.enroll(user._id, user.role);
    await course.save();

    // Update user's enrollments and save changes
    user.enrollments.push(courseId);
    await user.save();

    // Retrieve updated course list with user's privileges
    const result = await Course.getCoursesWithPrivilege(userId);

    // Return the updated course list
    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message || err.toString() });
  }
};


const unEnroll = async (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.body.userId;

  try {
    const user = await User.findById(userId)
    let course = await Course.findById(courseId)

    if (!user || !course) {
      return res.status(404).json({ error: 'User or course not found' });
    }

    course = course.unEnroll(user._id);
    await course.save();


    user.enrollments = user.enrollments.filter((e) => e.toString() !== courseId);
    await user.save();

    const result = await Course.getCoursesWithPrivilege(userId)

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message || err.toString() });
  } 
}

const getEnrollments = async (req, res) => {
  try {
    const courseId = req.params.courseId

    const course = await Course.findById(courseId)
      .populate('enrollments.user')


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
  const courseId = req.params.courseId;

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(400).json({ error: 'Course not found.' });
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully.',
      data: null,
    });
  } catch (err) {
    console.error("Error deleting course:", err);
    return res.status(500).json({ error: "Could not delete course." });
  }
};



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

