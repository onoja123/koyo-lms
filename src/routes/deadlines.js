const express = require('express')
const auth = require('../middleware/auth')
const deadlineRouter = express.Router()

const {
  getDeadLines,
  getDeadLinesCalendar
} = require('../controller/courseController')

deadlineRouter.get('/', auth, getDeadLines)
deadlineRouter.get('/calendar', auth, getDeadLinesCalendar)

module.exports = deadlineRouter
