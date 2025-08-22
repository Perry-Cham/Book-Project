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
  origin:"http://localhost:5173",
  credentials:"true"
}))
App.use(express.urlencoded({extended:true}))
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
  const nuser = await Users.findOne({name: user.name})
  if(user.password == nuser.password){
    res.status(200).json({"message":"user has been authenticated"})}else{
      res.status(400)
    }
  }catch(err){
    console.error(err)
    res.status(400)
  }

})
