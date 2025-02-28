const express = require('express')
const db = require('./config/database')
const path = require('path')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const cors = require('cors')
const app = express()
const globalHandler = require('./controller/error.controller');
try {
  require('dotenv').config();
} catch (error) {
  console.error('Error loading .env file:', error);
}



const user = require('./routes/user')
const assignment = require('./routes/Assignment')
const article = require('./routes/article')
const course = require('./routes/course')
const courseModule = require('./routes/courseModule')
const courseModuleItem = require('./routes/courseModuleItem')
const discussionsRouter = require('./routes/Discussions')

// const notification = require('./routes/notification')
const lectureRouter = require('./routes/lecture')
const AnnouncementsRouter = require('./routes/announcement')
const assessmentRouter = require('./routes/assessment')
const SubmissionRouter = require('./routes/submissions')
const gradeBookRouter = require('./routes/gradeBook')
const enrollmentRouter = require('./routes/enrollment')
const deadlineRouter = require('./routes/deadlines')
const achievementsRouter = require('./routes/achievementsRouter')
const adminRoute = require('./routes/adminRouter')

app.use(globalHandler);

// const auth = require('./middleware/auth')

const fileUpload = require('express-fileupload')



mongoose
  .connect('mongodb+srv://onoja123:Gabriella12@cluster0.vrc59cx.mongodb.net/judaz?retryWrites=true&w=majority',{
  })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })
const publicDirectoryPath = path.join(__dirname, './view')

app.use(express.static(publicDirectoryPath))

app.use('/course-file', express.static('course-file'))
app.use(cors({
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  origin: '*',
  credentials: true,
}));

app.use(express.json())
app.use('/users', user)
app.use('/discussions', discussionsRouter)
app.use('/announcements', AnnouncementsRouter)
app.use('/courses', course)
app.use('/assignment', assignment)

app.use('/article', article)
// app.use('/notification', notification)
app.use('/deadlines', deadlineRouter)
app.use('/:courseId/', gradeBookRouter)
app.use('/:courseId/assessments', assessmentRouter)
app.use('/:courseId/enrollments', enrollmentRouter)
app.use('/:courseId/assessments/:assessmentId/submissions', SubmissionRouter)
app.use('/courses/:courseId/modules', courseModule)
app.use('/courses/:courseId/modules/:moduleId/module-item', courseModuleItem)
app.use('/courses/:courseId/lectures', lectureRouter)
app.use('/achievements', achievementsRouter)
app.use('/admin', adminRoute)


app.get("/", (req, res) => {
  res.status(200).send({
      success: true,
      data: `Server Live${process.env.PORT === "production" ? "" : ` - ${process.env.PORT}`}`,
  });
});

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log('Server is running on port ' + port)
})

module.exports = app; 