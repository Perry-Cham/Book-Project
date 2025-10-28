const express = require('express');
const { addDays, addWeeks, addMonths, differenceInDays, differenceInWeeks, startOfWeek, endOfWeek, isSameWeek, format } = require('date-fns')
const axios = require('axios')
const Books = require("../models/book-model")
const Users = require("../models/user-model")
const Goals = require("../models/goal-model")
const StudyInfo = require("../models/study-model")
const { expressjwt: expressJwt } = require('express-jwt');
const jwt = require('jsonwebtoken')
const auth = expressJwt({
  secret: process.env.JWT_KEY,
  algorithms: ['HS256'],
});

const router = express.Router()

router.post('/signup', async (req, res) => {
  const user = req.body;
  const nuser = new Users(user)
  await nuser.save()
 const token = jwt.sign({ userId: nuser._id }, process.env.JWT_KEY, { expiresIn: '72h' })

  res.status(200).json({ "message": "user has been created", "token": token })
})

router.post('/signin', async (req, res) => {
  const user = req.body;
  try {
    const nuser = await Users.findOne({ name: user.name })
    if (user.password == nuser.password) {
     const token = jwt.sign({ userId: nuser._id }, process.env.JWT_KEY, { expiresIn: '1h' })

      res.status(200).json({
        "message": "user has been authenticated",
        "name": nuser.name,
        "token": token
      })
    } else {
      res.send(400).json({ "message": "invalid credentials" })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})
router.post('/saveBook/:id',auth, async (req, res) => {
  const id = req.params.id;
  const userId = req.auth.userId;
  const user = await Users.findOne({ _id: userId })
  try {

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

router.post('/setcurrentbook',auth, async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.auth.userId })
    await Users.updateOne({ _id: req.auth.userId }, { $addToSet: { currentBooks: req.body } })
    await Users.updateOne({ _id: req.auth.userId }, { $pull: { savedBooks: req.body.mainBook } })
    res.status(200).json({ "message": "The operation completed successfully", "name": req.body.title })
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})
router.post('/setcurrentpage',auth, async (req, res) => {
  try {
    const Books = await Users.findOne({ _id: req.auth.userId }, { currentBooks: 1, _id: 0 })
    const book = Books.currentBooks.find((b) => b._id == req.body.id)
    let diffInPages = Math.abs(req.body.pageCount - book.page);
    const historyEntry = {
      date: new Date(),
      numberOfPages: diffInPages
    }
    await Users.updateOne({ _id: req.auth.userId, "currentBooks._id": req.body.id }, {
      $set: { "currentBooks.$.page": req.body.pageCount }
    })
    //Push the number of pages read snd the date to history array on the users object
    readingHistory(req.auth.userId, historyEntry)

    //If the current page is equal to the page count remove the book from the current books and upend it to the goal if available
    if (req.body.pageCount == book.pageCount) {
      await Users.updateOne({ _id: req.auth.userId }, { $pull: { currentBooks: { _id: book._id } } })
      let goalData = await Users.findOne({ _id: req.auth.userId }, { goals: 1 }).populate("goals")
      if (goalData.goals.length > 0) {
        let goal = goalData.goals.find(g => g.type == "Reading")
        await Goals.updateOne({ _id: goal._id },
          { $push: { booksRead: book } }
        )

        //If the nunber of books read in the goals document is equal to the numberOfBooks i.e the users reading target delete the goal from the goals collection and the users goals array
        goalData = await Users.findOne({ _id: req.auth.userId }, { goals: 1 }).populate("goals")
        goal = goalData.goals.find(g => g.type == "Reading")
        if (goal.booksRead.length === goal.numberOfBooks) {
          await Goals.updateOne({ _id: goal._id }, { $set: { complete: true } })
        }
      }
    }
    res.status(200).json({ "message": "The operation completed successfully", "title": book.title, "page": book.page })
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "internal server error" })
  }
})

router.post('/setgoal',auth, async (req, res) => {
  try {
    const startDate = new Date();
    let endDate;
    console.log(req.body, startDate)
    if (req.body.unit == "day") {
      endDate = addDays(startDate, parseInt(req.body.duration))
    }
    else {
      endDate = addWeeks(startDate, parseInt(req.body.duration))
    }
    const goal = {
      userId: req.auth.userId,
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
    const goal2 = await Goals.findOne({ userId: req.auth.userId })
    const user = await Users.updateOne({ _id: req.auth.userId }, { $addToSet: { goals: goal2._id } })

    res.status(200).json({ "message": "The operation completed successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "Internal Server Error" })
  }
})

router.post('/addcustombook',auth, async (req, res) => {
  const { title, author, pageCount } = req.body;

  if (!title || !author || !pageCount) {
    return res.status(400).json({ message: 'Title, author, and page count are required' });
  }
  console.log(req.body)
  try {
    // Fetch book data from Open Library API
    const query = `title:${encodeURIComponent(title)} author:${encodeURIComponent(author)}`;
    const response = await axios.get(`https://openlibrary.org/search.json?q=${query}&limit=1&fields=title,author_name,cover_i`);
    console.log(response.data)
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
      cover: coverUrl, // New field for cover URL; add to your frontend <img> tags
      // Add other fields if needed, e.g., mainBook: null for custom books
    };
    // Add to user's currentBooks
    console.log(newBook)
    await Users.updateOne({ _id: req.auth.userId }, { $addToSet: { currentBooks: newBook } });

    res.status(200).json({ message: 'Custom book added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//This Function calculates reading history
async function readingHistory(userId, his) {
  try {
    // Get user with history
    const user = await Users.findOne({ _id: userId });
    if (!user.history) {
      user.history = [];
      await user.save();
    }

    // Check if we need to reset for a new week
    const now = new Date();
    if (user.history.length > 0) {
      const lastEntryDate = new Date(user.history[user.history.length - 1].date);

      // Compare if the current date is in a different week than the last entry
      if (!isSameWeek(now, lastEntryDate, { weekStartsOn: 0 })) { // 0 = Sunday
        // Reset history for new week
        await Users.updateOne({ _id: userId }, { $set: { history: [] } });
      }
    }

    // Check for existing entry for today
    let existingEntryIndex = -1;
    const todayFormatted = format(now, 'yyyy-MM-dd');

    for (let i = 0; i < user.history.length; i++) {
      const entryDate = format(new Date(user.history[i].date), 'yyyy-MM-dd');
      if (entryDate === todayFormatted) {
        existingEntryIndex = i;
        break;
      }
    }

    if (existingEntryIndex >= 0) {
      // Update existing entry
      const updatedPages = user.history[existingEntryIndex].numberOfPages + his.numberOfPages;
      await Users.updateOne(
        { _id: userId, "history._id": user.history[existingEntryIndex]._id },
        { $set: { "history.$.numberOfPages": updatedPages } }
      );
    } else {
      // Add new entry
      await Users.updateOne(
        { _id: userId },
        { $push: { history: his } }
      );
    }
  } catch (err) {
    console.error("Error in readingHistory:", err);
    throw err;
  }
}

//Routes to to do with studying functionality
router.post('/settimetable', async (req, res) => {
  try {
    const checkOldTimetable = await StudyInfo.findOne({ userId: req.auth.userId })
    if (checkOldTimetable.timetable.length > 0) { return res.status(500).json({ "message": "Timetable already exists" }) } else {
      if (!checkOldTimetable) {
        const data = new StudyInfo({
          userId: req.auth.userId,
          timetable: req.body
        })
        await data.save()
      } else {
        checkOldTimetable.timetable = req.body
        await checkOldTimetable.save()
      }
      res.status(200).json({ "message": "The operation completed successfully" })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ "message": "Internal Server Error" })
  }
})
router.post('/setstudygoal', async (req, res) => {
  console.log(req.body)
  try {
    await StudyInfo.updateOne({ userId: req.auth.userId }, { $addToSet: { goals: req.body } })
    res.status(200).json({ "message": "The operation completed successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ "message": "Internal Server Error" })
  }
})
module.exports = router;