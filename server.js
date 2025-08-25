const express = require('express');
const session = require('express-session');
const mongoose = require("mongoose");
const sessionStore = require("connect-mongo")
const cors = require('cors')
require('dotenv').config()
const Books = require("./models/book-model")
const Users = require("./models/user-model")
const App = express();
const port = 3000;


App.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))
App.use(express.urlencoded({ extended: true }))
App.use(express.json())
App.use(session({
  secret: process.env.SESSION_KEY || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 72,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }
}));
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Mongoose is connected")
})

App.listen(port, () => {
  console.log("The server is listening on port" + port)
})
App.get('/allBooks', async (req, res) => {
  try {
    const books = await Books.find();
    
    res.json(books)
  }
  catch (err) {
    console.error(err)
    res.send(502)
  }

})

App.get('/download/:id', async (req, res) => {
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
App.get('/getsession', async (req, res) => {
  const id = req.session.userId;
  const user = await Users.findOne({ _id: id });
  if (id && user) {
    res.send({ "name": user.name })
  } else {
    res.status(404).json({ "message": "session not found" })
  }
})
App.get('/logout', (req, res) => {
  req.session.destroy()
  res.status(200).json({ "message": "session destroyed successfully" })
})
App.post('/signup', async (req, res) => {
  const user = req.body;
  const nuser = new Users(user)
  await nuser.save()
  req.session.userId = nuser._id;
  
  res.status(200).json({ "message": "user has been created" })
})

App.get('/getsavedbooks',async (req, res) => {
  try{
 const user = await Users.findOne({_id:req.session.userId}).populate('savedBooks')
if(user){
  res.status(200).json(user.savedBooks)
  
}
  }catch (err){
    console.error(err)
  }
})
App.get('/getcurrentbooks', async (req, res) => {
  try{
   const books = await Users.findOne({_id:req.session.userId},{currentBooks:1, _id:0})
   res.status(200).json(books)
  }catch(err){
    console.error(err)
    res.status(500).json({"message":"internal server error"})
  }
})
App.post('/signin', async (req, res) => {
  const user = req.body;
  try {
    const nuser = await Users.findOne({ name: user.name })
    if (user.password == nuser.password) {
      if (user) req.session.userId = nuser._id;
      
      res.status(200).json({
        "message": "user has been authenticated",
        "name": nuser.name
      })
    } else {
      res.send(400).json({ "message": "invalid credentials" })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }

})
App.post('/saveBook/:id', async (req, res) => {
  const id = req.params.id;
  const userId = req.session.userId;
  const user = await Users.findOne({ _id: userId })
  try {
    const Book = await Users.findOne({
      _id: req.session.userId
    })
    
    try {
      if (user) {
        await Users.updateOne({ _id: userId }, { $addToSet: { savedBooks: id } })
        res.status(200).json({ "message": "book has been saved" })
      } else {
        
        res.status(500).json({
          "message": "Error finding user" })
      }

    } catch (err) {
      console.error(err)
      res.status(500).json({ "message": "internal server error" })
    }

  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})

App.post('/setcurrentbook',async (req, res) => {
try{
  const user = await Users.findOne({_id:req.session.userId})
  await Users.updateOne({_id:req.session.userId},{$addToSet:{currentBooks: req.body}})
  res.status(200).json({"message":"The operation completed successfully", "name": req.body.title})
}catch(err){
  console.error(err)
  res.status(500).json({"message":"internal server error"})
}
})
App.delete('/deletecurrent/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id)
  try{
   await Users.updateOne({_id:req.session.userId}, {$pull :{currentBooks: {_id: req.params.id}}})
   res.status(200).json({"message":"The operation completed successfully"})
  }catch(err){
    console.error(err)
    res.status(500).json({"message":"internal server error"})
  }
  
})
App.delete('/deletesaved/:id', async (req, res) => {
  const id = req.params.id;
  try{
   await Users.updateOne({_id:req.session.userId}, {$pull :{savedBooks: req.params.id}})
   res.status(200).json({"message":"The operation completed successfully"})
  }catch(err){
    console.error(err)
    res.status(500).json({"message":"internal server error"})
  }
  
})
