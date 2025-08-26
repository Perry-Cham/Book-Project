const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  name:String,
  password:String,
  savedBooks:[{type: mongoose.Schema.Types.ObjectId, ref: 'Book'}],
  currentBooks:[
    {
    title:String,
    cover:String,
    pageCount:Number,
    page:Number,
    mainBook:{type: mongoose.Schema.Types.ObjectId, ref: "Book"},
    history:[{
      date:Date,
      numberOfPages:Number
    }]
    }
    ],
  readBooks:[{type: mongoose.Schema.Types.ObjectId, ref: 'Book'}]
})

const Users = mongoose.model('User', schema)

module.exports = Users;
