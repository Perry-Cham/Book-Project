const express = require('express');
const axios = require('axios')
const session = require('express-session');
const mongoose = require("mongoose");
const sessionStore = require("connect-mongo")
const cors = require('cors')
require('dotenv').config()
const App = express();
const port = process.env.PORT;
const { addDays, addWeeks, addMonths, differenceInDays, differenceInWeeks } = require('date-fns')
const gRouter = require('./routes/get')
const pRouter = require('./routes/post')
const dRouter = require('./routes/delete')

const origins = ["http://localhost:5173", "https://ps-books.netlify.app"]
App.use(cors({
  origin: function (origin, callback) {
    if (!origin || origins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Origin not allowed'))
    }
  },
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
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : undefined,
  }
}));

App.use('/', gRouter)
App.use('/', pRouter)
App.use('/', dRouter)

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Mongoose is connected")
})

App.listen(port,"0.0.0.0", () => {
  console.log("The server is listening on port" + port)
})





