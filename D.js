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
  price: {
    type: Number,
    required: true,
    min: 0, // No negative prices
  },
  genre: {
    type: String,
    required: true,
    trim: true,
  },
  sypnosis: {
    type: String,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
    min: 1, // book must have at least 1 page
  },
  publishedDate: {
    type: String, // could also be Date, but your example uses "1918"
    required: true,
  },
});
let data = JSON.parse(fs.readFileSync('data.json'))

// Create Model
const Book = mongoose.model("Book", bookSchema);
Book.insertMany(data.Books).then(() => console.log("Books inserted successfully")).catch((err) => console.error(err))
