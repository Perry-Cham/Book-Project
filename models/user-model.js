const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  name:String,
  password:String,
  savedBooks:[{type: mongoose.Schema.Types.ObjectId, ref: 'Book'}],
  currentBooks:[
    {
    title:String,
    cover:String || null,
    pageCount:Number,
    page:Number,
    mainBook:{type: mongoose.Schema.Types.ObjectId, ref: "Book"},
    fileType:String,
    epubcfi:String,
    progress:Number,
    file: {
        provider: { type: String },
        bucket: { type: String },    
        key: { type: String },            
        url: { type: String },      
        contentType: { type: String },
        size: { type: Number },
        etag: { type: String },    
        uploadedAt: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed } 
      }
    }
    ],
  readBooks:[{type: mongoose.Schema.Types.ObjectId, ref: 'Book'}],
  history:Array,
  goals:[{type: mongoose.Schema.Types.ObjectId, ref: 'Goal'}],
})

const Users = mongoose.model('User', schema)

module.exports = Users;
