const express = require('express');
const { addDays, addWeeks, addMonths, differenceInDays, differenceInWeeks, startOfWeek, endOfWeek, isSameWeek, format } = require('date-fns')
const axios = require('axios')
const multer = require('multer')
const Books = require("../models/book-model")
const Users = require("../models/user-model")
const Goals = require("../models/goal-model")
const StudyInfo = require("../models/study-model")
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })
router.patch('/deletetimetable',async (req,res) => {
  try{
    await StudyInfo.updateOne({userId:req.session.userId},{$set : {timetable: []}})
    res.status(200).json({message:"the operation completed successfully"})
  }catch(err){
    console.log(err)
    res.status(500).json({message:"the operation could bot be completed"})
  }
})
router.patch('/deletestudygoal', async(req, res) => {
  console.log("Hello dev", req.body.subject)
  try{
    await StudyInfo.updateOne({userId:req.session.userId},{$pull : {goals : {subject: req.body.subject}}})
    res.status(200).json({message:"the operation completed successfully"})
  }catch(err){
    console.log(err)
    res.status(500).json({message:"the operation could bot be completed"})
  }
})
router.patch('/syncbooks', upload.array('books[]'), async (req, res) => {
  try {
    const files = req.files // Array of uploaded files
    const booksData = JSON.parse(req.body.books) // Book metadata
    
    console.log("Files received:", files?.length)
    console.log("Books data:", booksData)
    files.forEach((file, index) => console.log(file))


    res.status(200).json({ message: "Books synced successfully" })
  } catch (err) {
    console.error('Error in /syncbooks:', err)
    res.status(500).json({ message: "Operation failed", error: err.message })
  }
})
module.exports = router