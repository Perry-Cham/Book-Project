const express = require('express')
const Books = require("../models/book-model")
const Users = require("../models/user-model")
const Goals = require("../models/goal-model")
const Study = require("../models/study-model")
const router = express.Router()
const jwt = require('jsonwebtoken')
const { expressjwt: expressJwt } = require('express-jwt');
const auth = expressJwt({
  secret: process.env.JWT_KEY,
  algorithms: ['HS256'],
});

router.delete('/deleteuser',auth, async(req, res) => {
  try {
  await Users.deleteOne({_id:req.auth.userId})
  await Goals.deleteOne({userId:req.auth.userId})
  await Study.deleteOne({userId:req.auth.userId})   
  req.auth.destroy() 
  res.status(200).json({'message':'The user has been deleted successfully'})
  } catch (error) {
    console.error(error)
      res.status(500).json({'message':'Internal Server Error'})
  }
})
router.delete('/deletecurrent/:id',auth, async (req, res) => {
  const id = req.params.id;
  try {
    await Users.updateOne({ _id: req.auth.userId }, { $pull: { currentBooks: { _id: req.params.id } } })
    res.status(200).json({ "message": "The operation completed successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})
router.delete('/deletesaved/:id',auth, async (req, res) => {
  const id = req.params.id;
  try {
    await Users.updateOne({ _id: req.auth.userId }, { $pull: { savedBooks: req.params.id } })
    res.status(200).json({ "message": "The operation completed successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})
router.delete('/deletegoal/:id',auth, async (req, res) => {
  try {
    await Users.updateOne({ _id: req.auth.userId }, { $pull: { goals: req.params.id } })
    await Goals.deleteOne({ _id: req.params.id })
    res.status(200).json({ "message": "The operation completed successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})

module.exports = router;