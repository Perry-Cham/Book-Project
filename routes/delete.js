const express = require('express')
const Books = require("../models/book-model")
const Users = require("../models/user-model")
const Goals = require("../models/goal-model")
const Study = require("../models/study-model")
const router = express.Router()

router.delete('/deleteuser', async(req, res) => {
  try {
  await Users.deleteOne({_id:req.session.userId})
  await Goals.deleteOne({userId:req.session.userId})
  await Study.deleteOne({userId:req.session.userId})   
  req.session.destroy() 
  res.status(200).json({'message':'The user has been deleted successfully'})
  } catch (error) {
    console.error(error)
      res.status(500).json({'message':'Internal Server Error'})
  }
})
router.delete('/deletecurrent/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await Users.updateOne({ _id: req.session.userId }, { $pull: { currentBooks: { _id: req.params.id } } })
    res.status(200).json({ "message": "The operation completed successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})
router.delete('/deletesaved/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await Users.updateOne({ _id: req.session.userId }, { $pull: { savedBooks: req.params.id } })
    res.status(200).json({ "message": "The operation completed successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})
router.delete('/deletegoal/:id', async (req, res) => {
  try {
    await Users.updateOne({ _id: req.session.userId }, { $pull: { goals: req.params.id } })
    await Goals.deleteOne({ _id: req.params.id })
    res.status(200).json({ "message": "The operation completed successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})

module.exports = router;