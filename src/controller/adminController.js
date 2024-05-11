const Course = require('../models/course')
const Assignment = require('../models/Assignments')
const Assessment = require('../models/assessment')
const Comment = require('../models/comment')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const JWT_SECRET_KEY = "mysecretkey";

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET_KEY, {
    expiresIn: "24h"
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
    httpOnly: true,
  };
  
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.status(statusCode)
     .cookie("jwt", token, cookieOptions)
     .json({
        success: true,
        token,
        data: {
          user
        }
     });
};


const getTotalCourse = async (request, response) => {
    try {
      const course = await Course.countDocuments()
      response.json(course)
    } catch (err) {
      console.log(err)
      response.status(400).json({ error: err.message || err.toString() })
    }
}

const getAllCourses = async (request, response) => {
    try {
      const course = await Course.find()
      
      response.json(course)
    } catch (err) {
      console.log(err)
      response.status(400).json({ error: err.message || err.toString() })
    }
}

const getOneCourse = async (request, response) => {
    try {
        const course = await Course.findById(request.params.id)
        response.json(course)
    } catch (err) {
        console.log(err)
        response.status(400).json({ error: err.message || err.toString() })
    }
}


const getTotalUser = async (request, response) => {
    try {
      const user = await User.countDocuments()
      response.json(user)
    } catch (err) {
      console.log(err)
      response.status(400).json({ error: err.message || err.toString() })
    }
}

const getAllUsers = async (request, response) => {
    try {
      const user = await User.find()
      response.json(user)
    } catch (err) {
      console.log(err)
      response.status(400).json({ error: err.message || err.toString() })
    }
}

const getOneUser = async (request, response) => {
    try {
        const user = await User.findById(request.params.id)
        response.json(user)
    } catch (err) {
        console.log(err)
        response.status(400).json({ error: err.message || err.toString() })
    }
}


const getTotalAssignment = async (request, response) => {
    try {
      const assignment = await Assignment.countDocuments()
      response.json(assignment)
    } catch (err) {
      console.log(err)
      response.status(400).json({ error: err.message || err.toString() })
    }
}

const getAllAssignments = async (request, response) => {
    try {
      const assignment = await Assignment.find()

      if(!assignment){
        response.status(404)({
          error: 'No assignment found',
        })
      }

      response.json(assignment)
    } catch (err) {
      console.log(err)
      response.status(400).json({ error: err.message || err.toString() })
    }
}

const getOneAssignment = async (request, response) => {
    try {
        const assignment = await Assignment.findById(request.params.id)

        if(!assignment){
          response.status(404)({
            error: 'No assignment found',
          })
        }
        response.json(assignment)
    } catch (err) {
        console.log(err)
        response.status(400).json({ error: err.message || err.toString() })
    }
}

const getTotalAssessment = async (request, response) => {
    try {
      const assessment = await Assessment.countDocuments()
      response.json(assessment)
    } catch (err) {
      console.log(err)
      response.status(400).json({ error: err.message || err.toString() })
    }
}

const getAllAssessment= async (request, response) => {
    try {
      const assessment = await Assessment.find()

      if(!assessment){
        response.status(404)({
          error: 'No assessment found',
        })
      }
      response.json(assessment)
    } catch (err) {
      console.log(err)
      response.status(400).json({ error: err.message || err.toString() })
    }
}

const getOneAssessment = async (request, response) => {
    try {
        const assessment = await Assessment.findById(request.params.id)

        if(!assessment){
          response.status(404)({
            error: 'No assessment found',
          })
        }
        response.json(assessment)
    } catch (err) {
        console.log(err)
        response.status(400).json({ error: err.message || err.toString() })
    }
}

const getTotalComment = async (request, response) => {
    try {
      const comment = await Comment.countDocuments()
      response.json(comment)
    } catch (err) {
      console.log(err)
      response.status(400).json({ error: err.message || err.toString() })
    }
}

const getAllComments = async (request, response) => {
    try {
      const comment = await Comment.find()

      if(!comment){
        response.status(404)({
          error: 'No comment found',
        })
      }
      response.json(comment)
    } catch (err) {
      console.log(err)
      response.status(400).json({ error: err.message || err.toString() })
    }
}

const getOneComment= async (request, response) => {
    try {
        const comment = await Comment.findById(request.params.id)

        if(!comment){
          response.status(404)({
            error: 'No comment found',
          })
        }

        response.json(comment)
    } catch (err) {
        console.log(err)
        response.status(400).json({ error: err.message || err.toString() })
    }
}

const createUser = async (req, res) => {
    try {
      const user = new User(req.body);
      user.code = Date.now();
      await user.save();
  
      console.log('token: ' + token);
  
      await User.findOneAndUpdate({ code: user.code }, { isEmailRegistered: true })
  
      createSendToken(user, 201, res);
    } catch (error) {
      console.log("Error registering user:", error);
      res.status(400).send(error);
    }
  };


module.exports = {
    getTotalCourse,
    getAllCourses,
    getOneCourse,
    getTotalUser,
    getAllUsers,
    getOneUser,
    getTotalAssignment,
    getAllAssignments,
    getOneAssignment,
    getTotalAssessment,
    getAllAssessment,
    getOneAssessment,
    getTotalComment,
    getAllComments,
    getOneComment,
    createUser
  }
  