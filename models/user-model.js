const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  name:String,
  password:String,
  savedBooks:[{type: mongoose.Schema.Types.ObjectId, ref: 'Book'}],
  currentBooks:[
    {
    name:String,
    pageCount:Number,
    page:Number,
    mainBook:String,
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