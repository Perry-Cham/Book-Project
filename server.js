const express = require('express');
const axios = require('axios')
const session = require('express-session');
const mongoose = require("mongoose");
const sessionStore = require("connect-mongo")
const cors = require('cors')
const { addDays, addWeeks, addMonths, differenceInDays, differenceInWeeks } = require('date-fns')
require('dotenv').config()
const Books = require("./models/book-model")
const Users = require("./models/user-model")
const Goals = require("./models/goal-model")
const App = express();
const port = process.env.PORT;

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

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Mongoose is connected")})


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

  App.get('/getsavedbooks', async (req, res) => {
    try {
      const user = await Users.findOne({ _id: req.session.userId }).populate('savedBooks')
      if (user) {
        res.status(200).json(user.savedBooks)

      }
    } catch (err) {
      console.error(err)
    }
  })
  App.get('/getcurrentbooks', async (req, res) => {
    try {
      const books = await Users.findOne({ _id: req.session.userId }, { currentBooks: 1, _id: 0 })
      console.log(books)
      res.status(200).json(books)
    } catch (err) {
      console.error(err)
      res.status(500).json({ "message": "internal server error" })
    }
  })
  App.get('/getgoal', async (req, res) => {
    try {
      const goal = await Goals.findOne({ userId: req.session.userId });
      const user = await Users.findOne({ _id: req.session.userId }, { currentBooks: 1, _id: 0 });
      const currentBooks = user.currentBooks;
      let daysLeft = differenceInDays(goal.endDate, new Date());
      const data = {
        goal: goal,
        currentBooks: currentBooks,
        daysLeft: daysLeft
      }
      res.status(200).json(data)
    } catch (err) {
      console.error(err)
      res.status(500).json({ "message": "Internal Server Error" })
    }
  })
  //Post Routes
  App.post('/signup', async (req, res) => {
    const user = req.body;
    const nuser = new Users(user)
    await nuser.save()
    req.session.userId = nuser._id;

    res.status(200).json({ "message": "user has been created" })
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
            "message": "Error finding user"
          })
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

  App.post('/setcurrentbook', async (req, res) => {
    console.log(req.body)
    try {
      const user = await Users.findOne({ _id: req.session.userId })
      await Users.updateOne({ _id: req.session.userId }, { $addToSet: { currentBooks: req.body } })
      await Users.updateOne({ _id: req.session.userId }, { $pull: { savedBooks: req.body.mainBook } })
      res.status(200).json({ "message": "The operation completed successfully", "name": req.body.title })
    } catch (err) {
      console.error(err)
      res.status(500).json({ "message": "internal server error" })
    }
  })
  App.post('/setcurrentpage', async (req, res) => {
    try {
      const Books = await Users.findOne({ _id: req.session.userId }, { currentBooks: 1, _id: 0 })
      const book = Books.currentBooks.find((b) => b._id == req.body.id)
      let diffInPages = Math.abs(book.page - req.body.pageCount);
      const historyEntry = {
        date: new Date(),
        numberOfPages: Number(diffInPages)
      }
      await Users.updateOne({ _id: req.session.userId, "currentBooks._id": req.body.id }, {
        $set: { "currentBooks.$.page": req.body.pageCount },
        $push: { "currentBooks.$.history": historyEntry }
      })
      //If the current page is equal to the page count remove the book from the current books and append it to the goal if available
      console.log(req.body,req.body.pageCount === book.pageCount )
      if (req.body.pageCount === book.pageCount) {
        await Users.updateOne({ _id: req.session.userId }, { $pull: { currentBooks: { _id: book._id } } })
        const goalData = await Users.findOne({ _id: req.session.userid }, { goals: 1 }).populate("goals")
        const goal = goalData.goals.find(g => g.type == "Reading")
        await Goals.updateOne({ _id: goal._id },
          { $push: { booksRead: book } }
        )
      }
      res.status(200).json({ "message": "The operation completed successfully", "title": book.title, "page": book.page })
    } catch (err) {
      console.error(err)
      res.status(500).json({ "message": "internal server error" })
    }
    console.log(req.body)
  })
  App.post('/setgoal', async (req, res) => {
    console.log(req.body)
    try {
      const startDate = new Date();
      let endDate;
      if (req.body.unit == "day") {
        endDate = addDays(startDate, parseInt(req.body.duration))
      }
      else {
        endDate = addWeeks(startDate, parseInt(req.body.duration))
      }
      const goal = {
        userId: req.session.userId,
        type: "Reading",
        hasStreak: false,
        streakLength: 0,
        numberOfBooks: req.body.numberOfBooks,
        duration: req.body.duration,
        progress: 0,
        booksRead: [],
        startDate: startDate,
        endDate: endDate,
      }
      await Goals.insertOne(goal)
      const goal2 = await Goals.findOne({ userId: req.session.userId })
      const user = await Users.updateOne({ _id: req.session.userId }, { $addToSet: { goals: goal2._id } })

      res.status(200).json({ "message": "The operation completed successfully" })
    } catch (err) {
      console.error(err)
      res.status(500).json({ "message": "Internal Server Error" })
    }
  })
App.post('/addcustombook', async (req, res) => {
  const { title, author, pageCount } = req.body;
  if (!title || !author || !pageCount) {
    return res.status(400).json({ message: 'Title, author, and page count are required' });
  }

  try {
    // Fetch book data from Open Library API
    const query = `title:${encodeURIComponent(title)} author:${encodeURIComponent(author)}`;
    const response = await axios.get(`https://openlibrary.org/search.json?q=${query}&limit=1&fields=title,author_name,cover_i`);
    const docs = response.data.docs;

    let coverUrl = null;
    if (docs.length > 0 && docs[0].cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${docs[0].cover_i}-M.jpg`; // Medium size; use -S.jpg for small or -L.jpg for large
    } else {
      // Optional: Fallback to a placeholder image if no cover found
      coverUrl = 'https://example.com/placeholder-book-cover.jpg'; // Replace with your own URL
    }

    // Create new book object (match structure of your existing currentBooks items)
    const newBook = {
      title,
      author, // New field; add to your frontend display logic if needed
      pageCount: Number(pageCount),
      page: 0, // Starting page
      history: [], // Empty history array
      coverImage: coverUrl, // New field for cover URL; add to your frontend <img> tags
      // Add other fields if needed, e.g., mainBook: null for custom books
    };

    // Add to user's currentBooks
    await Users.updateOne({ _id: req.session.userId }, { $addToSet: { currentBooks: newBook } });

    res.status(200).json({ message: 'Custom book added successfully', book: newBook });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
  App.delete('/deletecurrent/:id', async (req, res) => {
    const id = req.params.id;
    try {
      await Users.updateOne({ _id: req.session.userId }, { $pull: { currentBooks: { _id: req.params.id } } })
      res.status(200).json({ "message": "The operation completed successfully" })
    } catch (err) {
      console.error(err)
      res.status(500).json({ "message": "internal server error" })
    }

  })
  App.delete('/deletesaved/:id', async (req, res) => {
    const id = req.params.id;
    console.log(req.session)
    try {
      await Users.updateOne({ _id: req.session.userId }, { $pull: { savedBooks: req.params.id } })
      res.status(200).json({ "message": "The operation completed successfully" })
    } catch (err) {
      console.error(err)
      res.status(500).json({ "message": "internal server error" })
    }
  })
  App.delete('/deletegoal/:id', async (req, res) => {
    try {
      await Users.updateOne({ _id: req.session.userId }, { $pull: { goals: req.params.id } })
      await Goals.deleteOne({ _id: req.params.id })
      res.status(200).json({ "message": "The operation completed successfully" })
    } catch (err) {
      console.error(err)
      res.status(500).json({ "message": "internal server error" })
    }
  })