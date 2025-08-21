const express = require('express');
const mongoose = require("mongoose");
const cors = require('cors')
require('dotenv').config()
const Books = require("./models/book-model")
const Users = require("./models/user-model")
const App = express(); 
const port = 3000;

App.use(cors({
  origin:"http://localhost:5173",
  credentials:"true"
}))
App.use(express.urlencoded({extended:true}))
App.use(express.json())
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Mongoose is connected")
})

App.listen(port, "0.0.0.0", () => {
  console.log("The server is listening on port" + port)
})
App.get('/allBooks',async (req, res) => {
try{  
  const books = await Books.find();
  res.json(books)
}
  catch(err){
    console.error(err)
    res.send(502)
  }
 
})

App.get('/download/:id',async (req, res) => {
  console.log('Hit')
try{  
  const id = req.params.id;
  const book = await Books.findOne({_id:id});
  console.log(book)
  res.json(book)
}
  catch(err){
    console.error(err)
    res.send(502)
  } 
 
})

App.post('/signup', (req, res) => {
  const user = req.body;
const nuser =  new Users(user)
  nuser.save().then(() => res.send(200))
})
App.post('/signin',async (req, res) => {
  
  const user = req.body;
  try{
  const nuser = await Users.find({username: user.username})
  if(user.password == nuser.password){
    console.log("it works")
    res.send(205)}
  }catch(err){
    console.error(err)
    res.send(400)
  }
  
})