const Course = require('../models/course')
const Assignment = require('../models/Assignments')
const { Assessment, Exam } = require('../models/assessment')
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
    const courseCount = await Course.countDocuments();
    response.json(courseCount);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal server error' });
  }
};

const getAllCourses = async (request, response) => {
  try {
    const courses = await Course.find();

    if (courses.length === 0) {
      return response.status(404).json({ error: 'No courses found' });
    }
    response.json(courses);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal server error' });
  }
};


const getOneCourse = async (request, response) => {
    try {
        const course = await Course.findById(request.params.id)

        if (course.length === 0) {
          return response.status(404).json({ error: 'No courses found' });
        }
        
        response.json(course)
    } catch (err) {
        console.log(err)
        response.status(400).json({ error: err.message || err.toString() })
    }
}


const getTotalUser = async (request, response) => {
  try {
    const userCount = await User.countDocuments();
    response.json(userCount);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal server error' });
  }
};

const getAllUsers = async (request, response) => {
  try {
    const users = await User.find();

    if (!users) {
      return response.status(404).json({ error: 'No user found' });
    }

    response.json(users);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal server error' });
  }
};

const getOneUser = async (request, response) => {
  try {
    const user = await User.findById(request.params.id);

    if (!user) {
      return response.status(404).json({ error: 'No user found' });
    }
    response.json(user);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal server error' });
  }
};


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
    const assignments = await Assignment.find();

    if (assignments.length === 0) {
      return response.status(404).json({ error: 'No assignments found' });
    }

    response.json(assignments);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal server error' });
  }
};


const getOneAssignment = async (request, response) => {
  try {
    const assignment = await Assignment.findById(request.params.id);

    if (!assignment) {
      return response.status(404).json({ error: 'No assignment found' });
    }

    response.json(assignment);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal server error' });
  }
};

const getTotalAssessment = async (request, response) => {
  try {
    const assessmentCount = await BaseModel.countDocuments({ _type: 'Assessment' });
    response.json(assessmentCount);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal server error' });
  }
};




const getAllAssessment= async (request, response) => {
    try {

      const assessment = await Assessment.find()

      if (!assessment) {
        return response.status(404).json({ error: 'No assessment found' });
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

        if (!assessment) {
          return response.status(404).json({ error: 'No assessment found' });
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
    const comments = await Comment.find().populate('user', 'username');

    if (!comments) {
      return response.status(404).json({ error: 'No comments found' });
    }

    response.json(comments);
  } catch (err) {
    console.log(err);
    response.status(400).json({ error: err.message || err.toString() });
  }
};

const getOneComment = async (request, response) => {
  try {
      const comment = await Comment.findById(request.params.id).populate('user', 'username');

    if (!comment) {
      return response.status(404).json({ error: 'No comment found' });
    }

      response.json(comment);
  } catch (err) {
      console.log(err);
      response.status(400).json({ error: err.message || err.toString() });
  }
};

const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    user.code = Date.now();
    await user.save();

    // Update user's email registration status
    await User.findOneAndUpdate({ code: user.code }, { isEmailRegistered: true }).exec();

    // Send token and user data in response
    createSendToken(user, 201, res);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern.email) {
      // Duplicate key error for email field
      return res.status(400).json({ error: "Email address is already in use." });
    }
    console.log("Error registering user:", error);
    res.status(500).send("Internal server error");
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
  