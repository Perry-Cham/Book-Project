const express = require('express');
const { addDays, addWeeks, addMonths, differenceInDays, differenceInWeeks, startOfWeek, endOfWeek, isSameWeek, format } = require('date-fns')
const axios = require('axios')
const Books = require("../models/book-model")
const Users = require("../models/user-model")
const Goals = require("../models/goal-model")
const StudyInfo = require("../models/study-model")
const router = express.Router()

router.patch('/deletetimetable',async (req,res) => {
  try{
    await StudyInfo.updateOne({userId:req.session.userId},{$set : {timetable: []}})
    res.status(200).json({message:"the operation completed successfully"})
  }catch(err){
    console.log(err)
    res.status(500).json({message:"the operation could bot be completed"})
  }
})

module.exports = router