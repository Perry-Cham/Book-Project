const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  userId:{type: mongoose.Schema.Types.ObjectId, ref: "User"},
  type:String,
  hasStreak:Boolean,
  streakLength:Number,
  numberOfBooks:Number,
  duration:Number,
  progress:Number,
  booksRead:Array,
  startDate:Date,
  endDate:Date,
  complete:Boolean
})

const Goals = mongoose.model('Goal', schema)

module.exports = Goals;