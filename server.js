const express = require('express');
const mongoose = require("mongoose");
require('dotenv').config()
const Books = require("./models/book-model")
const App = express(); 
const port = 3000;

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Mongoose is connected")
})

App.listen(port, () => {
  console.log("The server is listening on port" + port)
})