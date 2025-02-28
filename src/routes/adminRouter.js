const express = require('express')
const auth = require('../middleware/auth')
const adminRouter = express.Router()

const {
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
} = require('../controller/adminController')


adminRouter.use(auth)


adminRouter.get('/totalcourses', getTotalCourse)

adminRouter.get('/allcourses', getAllCourses)

adminRouter.get('/onecourse/:id', getOneCourse, getOneCourse)

adminRouter.get('/totalusers', getTotalUser)

adminRouter.get('/allusers', getAllUsers)

adminRouter.get('/oneuser/:id',  getOneUser)

adminRouter.get('/totalassignment', getTotalAssignment)

adminRouter.get('/allassignment', getAllAssignments)

adminRouter.get('/oneassignment/:id', getOneAssignment)

adminRouter.get('/totalassessment', getTotalAssessment)

adminRouter.get('/allassessment', getAllAssessment)

adminRouter.get('/oneassessment/:id', getOneAssessment)

adminRouter.get('/totalcomment', getTotalComment)

adminRouter.get('/allcomments', getAllComments)

adminRouter.get('/onecomment/:id', getOneComment)


adminRouter.post('/create-user', createUser)


module.exports = adminRouter
