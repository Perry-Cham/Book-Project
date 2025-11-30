const express = require('express')
const { addDays, addWeeks, addMonths, differenceInDays, differenceInWeeks } = require('date-fns')
const Books = require("../models/book-model")
const Users = require("../models/user-model")
const Goals = require("../models/goal-model")
const StudyInfo = require("../models/study-model")
const jwt = require('jsonwebtoken')
const { expressjwt: expressJwt } = require('express-jwt');
const auth = expressJwt({
  secret: process.env.JWT_KEY,
  algorithms: ['HS256'],
});
const router = express.Router()

router.get('/allBooks', async (req, res) => {
  try {
    const books = await Books.find();
checkGenre(books)
    res.json(books)
  }
  catch (err) {
    console.error(err)
    res.send(502)
  }

})

router.get('/download/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const book = await Books.findOne({ _id: id });

    res.json(book)
  }
  catch (err) {
    console.error(err)
    res.send(502)
  }

})
router.get('/downloadcurrent/:id',auth,async(req,res)=>{
  try{
    const book = Users.findOne({_id:req.auth.id, currentBooks._id: req.params.id},{currentBooks:1, _id:0})
    
  }catch(err){
    console.error(err)
    res.status(404).json({ "message": `session has not been found` })
  }
})
router.get('/getsession',auth, async (req, res) => {
  const id = req.auth.userId;
  const user = await Users.findOne({ _id: id });
  if (id && user) {
    res.send({ "name": user.name })
  } else {
    res.status(404).json({ "message": `session has not been found` })
  }
})
router.get('/logout', (req, res) => {
  req.auth.destroy()
  res.status(200).json({ "message": "session destroyed successfully" })
})

router.get('/getsavedbooks',auth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await Users.findOne({ _id: userId }).populate('savedBooks')
    if (user) {
      res.status(200).json(user.savedBooks)

    }
  } catch (err) {
    console.error(err)
  }
})
router.get('/getcurrentbooks',auth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const books = await Users.findOne({ _id: userId }, { currentBooks: 1, _id: 0 })
    res.status(200).json(books)
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})
router.get('/getgoal',auth, async (req, res) => {
  try {
    const goal = await Goals.findOne({ userId: req.auth.userId });
    if(goal){
      const user = await Users.findOne({ _id: req.auth.userId }, { currentBooks: 1, _id: 0 });
    const currentBooks = user.currentBooks;
    console.log(goal)
    let daysLeft = differenceInDays(goal.endDate, new Date());
    const data = {
      goal: goal,
      currentBooks: currentBooks,
      daysLeft: daysLeft
    }
    if (goal.complete) {
      res.status(200).json(data)
      console.log(data.goal)
      await Users.updateOne({ _id: req.auth.userId }, { $pull: { goals: goal._id } })
      await Goals.deleteOne({ userId: req.auth.userId })
      return;
    }
    res.status(200).json(data)
    }else{
      
    }
    
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "Internal Server Error" })
  }
})
router.get('/gethistory',auth, async (req, res) => {
  try{
const user = await Users.findOne({_id:req.auth.userId},{history:1})
console.log(req.auth)
 if(user.history && user) res.status(200).json(user.history)
  }catch (err) {
    console.error(err)
    res.status(500).json({ "message": "Internal Server Error" })
  }
 
})
//Routes to do with studying or study functions 
router.get('/gettimetable',auth, async(req,res) =>{
  try{
    const timetable = await StudyInfo.findOne({userId:req.auth.userId},{timetable:1,_id:0})
    if(timetable){
      res.status(200).json([...timetable.timetable])
    }else{
      res.status(404).json({"message":"User does not have a study timetable"})
    }
  }catch(err){
    console.error(err)
    res.status(404).json({"message":"User does not have a study timetable"})
  }
})
router.get('/getstudygoal',auth, async(req,res) =>{
  try{
    const studyGoal = await StudyInfo.findOne({userId:req.auth.userId},{goals:1,_id:0})
    if(studyGoal && studyGoal.goals.length > 0){
      res.status(200).json([...studyGoal.goals])
    }else{
      res.status(404).json({"message":"User does not have a study timetable"})
    }
  }catch(err){
    console.error(err)
    res.status(404).json({"message":"User does not have a study timetable"})
  }
})
function checkGenre(data){
  const Data = data
  const genres = []
  for (let Book of data){
    Book = Book.toObject()
      const genre = genres.find(b => b.genre === Book.genre)
      if(genre){
        genre.bookCount++
      }else{
        const entry = {genre: Book.genre, bookCount:1}
        genres.push(entry)
      }
  }
  console.log(genres)
}
module.exports = router;