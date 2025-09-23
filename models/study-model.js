const mongoose = require('mongoose');

const schema  = new mongoose.Schema({
  userId:{type: mongoose.Schema.Types.ObjectId, ref:'User'},
  timetable:Array,
  goals:Array
})
const StudyInfo = mongoose.model('StudyInfo',schema,'studies')
module.exports = StudyInfo