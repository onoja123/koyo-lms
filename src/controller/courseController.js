const { default: axios } = require('axios')
const Achievement = require('../models/achievement')
const Course = require('../models/course')
const Grades = require('../models/gradesSummary')
const User = require('../models/user')


const getAllCourses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({ error: 'User not authenticated' });
    }

    const user = req.user;
    const filter = req.query.filter;

    // getCoursesWithPrivilege func populates users
    const courses = await Course.getCoursesWithPrivilege(user._id);

    console.log(courses);

    let result = courses;
    if (filter) result = courses.filter((course) => course.status === filter);

    return res.json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message || err.toString() });
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
  let course = null; 
  try {
    const { courseName, description, image } = req.body;

    if (!courseName)
      return res.status(400).json({ error: 'missing courseName' });

    const user = req.user;

    course = new Course({
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