const express = require('express');
const { addDays, addWeeks, addMonths, differenceInDays, differenceInWeeks, startOfWeek, endOfWeek, isSameWeek, format } = require('date-fns')
const axios = require('axios')
const multer = require('multer')
const Books = require("../models/book-model")
const Users = require("../models/user-model")
const Goals = require("../models/goal-model")
const StudyInfo = require("../models/study-model")
const router = express.Router()
const mongoDB = require("mongodb")
const mongoose = require("mongoose")
const upload = multer({ storage: multer.memoryStorage() })
const jwt = require('jsonwebtoken')
const { expressjwt: expressJwt } = require('express-jwt');
const auth = expressJwt({
  secret: process.env.JWT_KEY,
  algorithms: ['HS256'],
});
function errorResponse(err, res, msg = "the operation could bot be completed", status = 500) {
  console.log(err)
  res.status(status).json({ message: msg })
}
router.patch('/deletetimetable', auth, async (req, res) => {
  try {
    await StudyInfo.updateOne({ userId: req.auth.userId }, { $set: { timetable: [] } })
    res.status(200).json({ message: "the operation completed successfully" })
  } catch (err) {
    errorResponse(err, res)
  }
})
router.patch('/deletestudygoal', auth, async (req, res) => {
  console.log("Hello dev", req.body.subject)
  try {
    await StudyInfo.updateOne({ userId: req.auth.userId }, { $pull: { goals: { subject: req.body.subject } } })
    res.status(200).json({ message: "the operation completed successfully" })
  } catch (err) {
    errorResponse(err, res)
  }
})
router.patch('/syncbooks', auth, upload.array('books'), async (req, res) => {
  try {
    const files = req.files // Array of uploaded files
    const booksData = JSON.parse(req.body.books) // Book metadata
    console.log(booksData)
    for (const book of booksData) {
      const entry = { ...book }
      delete entry.filePath
      delete entry.synced
      entry.title = entry.name || entry.filename;
      if (entry.fileType == 'epub') {
        delete entry.page
        delete entry.totalPages
      } else if (entry.fileType == 'pdf') {
        entry.pageCount = entry.totalPages
        delete entry.epubcfi
      }
      const test = await Users.findOneAndUpdate({ _id: req.auth.userId }, {
        $addToSet: {
          currentBooks: entry
        }
      })
    }


    res.status(200).json({ message: "Books synced successfully" })
  } catch (err) {
    console.error('Error in /syncbooks:', err)
    res.status(500).json({ message: "Operation failed", error: err.message })
  }
})
router.patch('/syncpages', auth, async (req, res) => {
  try {
    const { location, page, name, type, progress } = req.body
    const userId = req.auth.userId;
    console.log(req.body)
    if (type === "epub") {
      await Users.updateOne({ _id: userId, 'currentBooks.title': name }, {
        $set: {
          'currentBooks.$.epubcfi': location,
          'currentBooks.$.progress': progress
        }
      })
    } else if (type === "pdf") {
      await Users.updateOne({ _id: userId, 'currentBooks.title': name }, {
        $set: {
          'currentBooks.$.page': page,
          'currentBooks.$.progress': progress
        }
      })
    }
    res.status(200).json({ message: "the operation completed successfully" })
  } catch (error) {
    errorResponse(err, res)
  }
})
router.patch('/completegoal', auth, async (req, res) => {
  console.log(req.body, req.auth.userId)
  try {
    const userId = req.auth.userId
    const user = await Users.findOne({_id:req.auth.userId})
 const subject = await StudyInfo.findOneAndUpdate({ userId: req.auth.userId, 'goals.subject': req.body.subject }, { $set: { 'goals.$.topics': req.body.topics } })
    console.log(subject, user)
    res.status(200).json({ message: "the operation completed successfully" })
  } catch (err) {
    errorResponse(err)
  }
})
module.exports = router