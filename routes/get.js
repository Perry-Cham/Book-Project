const express = require('express')
const { addDays, addWeeks, addMonths, differenceInDays, differenceInWeeks } = require('date-fns')
const Books = require("../models/book-model")
const Users = require("../models/user-model")
const Goals = require("../models/goal-model")

const router = express.Router()

router.get('/allBooks', async (req, res) => {
  try {
    const books = await Books.find();

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
router.get('/getsession', async (req, res) => {
  const id = req.session.userId;
  const user = await Users.findOne({ _id: id });
  if (id && user) {
    res.send({ "name": user.name })
  } else {
    res.status(404).json({ "message": "session not found" })
  }
})
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.status(200).json({ "message": "session destroyed successfully" })
})

router.get('/getsavedbooks', async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.session.userId }).populate('savedBooks')
    if (user) {
      res.status(200).json(user.savedBooks)

    }
  } catch (err) {
    console.error(err)
  }
})
router.get('/getcurrentbooks', async (req, res) => {
  try {
    const books = await Users.findOne({ _id: req.session.userId }, { currentBooks: 1, _id: 0 })
    res.status(200).json(books)
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})
router.get('/getgoal', async (req, res) => {
  try {
    const goal = await Goals.findOne({ userId: req.session.userId });
    const user = await Users.findOne({ _id: req.session.userId }, { currentBooks: 1, _id: 0 });
    const currentBooks = user.currentBooks;
    let daysLeft = differenceInDays(goal.endDate, new Date());
    const data = {
      goal: goal,
      currentBooks: currentBooks,
      daysLeft: daysLeft
    }
    if (goal.complete) {
      res.status(200).json(data)
      console.log(data.goal)
      await Users.updateOne({ _id: req.session.userId }, { $pull: { goals: goal._id } })
      await Goals.deleteOne({ userId: req.session.userId })
      return;
    }
    res.status(200).json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "Internal Server Error" })
  }
})
router.get('/gethistory', async (req, res) => {
  try{
const user = Users.findOne({_id:req.session.id},{history:1})
 const {history} = user;
 user.history && res.status(200).json(history)
  }catch (err) {
    console.error(err)
    res.status(500).json({ "message": "Internal Server Error" })
  }
 
})
//Post Routes
module.exports = router;