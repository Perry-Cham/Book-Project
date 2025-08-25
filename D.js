const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs')
mongoose.connect(process.env.MONGO_URI).then(() => console.log("mongoose has connected successfully")).catch(err => console.error(err))

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  cover: {
    type: String, // URL of cover image
    required: true,
  },
  genre: {
    type: String,
    required: true,
    trim: true,
  },
  synopsis: {
    type: String,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
  },
  publishedDate: {
    type: String, // could also be Date, but your example uses "1918"
    required: true,
  },
});
let data = JSON.parse(fs.readFileSync('data.json'))

// Create Model
const Book = mongoose.model("Book", bookSchema, "books");

async function insert(){
  try{
 await Book.insertMany(data.Books)
 console.log("Books inserted successfully")
  }catch(err){
    console.error(err)
  }
  mongoose.disconnect();
}

insert();
