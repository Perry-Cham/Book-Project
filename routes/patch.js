const express = require("express");
const {
  addDays,
  addWeeks,
  addMonths,
  differenceInDays,
  differenceInWeeks,
  startOfWeek,
  endOfWeek,
  isSameWeek,
  format,
} = require("date-fns");
const axios = require("axios");
const multer = require("multer");
const Books = require("../models/book-model");
const Users = require("../models/user-model");
const Goals = require("../models/goal-model");
const StudyInfo = require("../models/study-model");
const router = express.Router();
const { GridFSBucket, ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const upload = multer({ storage: multer.memoryStorage() });
const jwt = require("jsonwebtoken");
const { expressjwt: expressJwt } = require("express-jwt");
const auth = expressJwt({
  secret: process.env.JWT_KEY,
  algorithms: ["HS256"],
});
function errorResponse(
  err,
  res,
  msg = "the operation could bot be completed",
  status = 500
) {
  console.log(err);
  res.status(status).json({ message: msg });
}
router.patch("/deletetimetable", auth, async (req, res) => {
  try {
    await StudyInfo.updateOne(
      { userId: req.auth.userId },
      { $set: { timetable: [] } }
    );
    res.status(200).json({ message: "the operation completed successfully" });
  } catch (err) {
    errorResponse(err, res);
  }
});
router.patch("/deletestudygoal", auth, async (req, res) => {
  try {
    await StudyInfo.updateOne(
      { userId: req.auth.userId },
      { $pull: { goals: { subject: req.body.subject } } }
    );
    res.status(200).json({ message: "the operation completed successfully" });
  } catch (err) {
    errorResponse(err, res);
  }
});
router.patch("/syncbooks", auth, upload.array("books"), async (req, res) => {
  try {
    const files = req.files;
    const booksData = JSON.parse(req.body.books);

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    if (files.length !== booksData.length) {
      return res
        .status(400)
        .json({ message: "Files and metadata count mismatch" });
    }

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: "books" });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const book = booksData[i];

      const uploadStream = bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
        metadata: {
          user: req.auth.userId,
          originalName: file.originalname,
        },
      });

      await uploadStream.end(file.buffer);

      // After upload is complete, assign the GridFS file ID
      book.file = {
        provider: "GridFs",
        bucket: "books",
        key: uploadStream.id.toString(),
        url: null,
        contentType: file.mimeType,
        size: file.size,
      };
      //  book.syncId = uploadStream.id.toString();
    }

    // Now save cleaned metadata to user's currentBooks
    for (const book of booksData) {
      console.log(book);
      const entry = { ...book };
      entry.title = entry.name || entry.filename;
      // Clean up unnecessary fields
      delete entry.filePath;
      entry.synced = true;
      delete entry.name;
      delete entry.filename;

      entry.title = entry.title || entry.originalname;

      if (entry.fileType === "epub") {
        delete entry.page;
        delete entry.totalPages;
      } else if (entry.fileType === "pdf") {
        entry.pageCount = entry.totalPages;
        delete entry.epubcfi;
        delete entry.totalPages;
      }

      await Users.findOneAndUpdate(
        { _id: req.auth.userId },
        { $addToSet: { currentBooks: entry } },
        { new: true }
      );
    }

    return res.status(200).json({
      message: "Books synced successfully",
      syncedCount: files.length,
    });
  } catch (err) {
    console.error("Error in /syncbooks:", err);
    return res.status(500).json({
      message: "Sync failed",
      error: err.message,
    });
  }
});
router.patch("/syncpages", auth, async (req, res) => {
  try {
    const { location, page, name, type, progress } = req.body;
    const userId = req.auth.userId;

    if (type === "epub") {
      await Users.updateOne(
        { _id: userId, "currentBooks.title": name },
        {
          $set: {
            "currentBooks.$.epubcfi": location,
            "currentBooks.$.progress": progress,
          },
        }
      );
    } else if (type === "pdf") {
      await Users.updateOne(
        { _id: userId, "currentBooks.title": name },
        {
          $set: {
            "currentBooks.$.page": page,
            "currentBooks.$.progress": progress,
          },
        }
      );
    }
    res.status(200).json({ message: "the operation completed successfully" });
  } catch (error) {
    errorResponse(err, res);
  }
});
router.patch("/completegoal", auth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await Users.findOne({ _id: req.auth.userId });
    const subject = await StudyInfo.findOneAndUpdate(
      { userId: req.auth.userId, "goals.subject": req.body.subject },
      { $set: { "goals.$.topics": req.body.topics } }
    );

    res.status(200).json({ message: "the operation completed successfully" });
  } catch (err) {
    errorResponse(err);
  }
});
router.patch("/addstudytopic", auth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const subject = req.body.subject;
    const topic = req.body.topic;

    const subjectEntry = await StudyInfo.findOne({
      userId: userId,
      "goals.subject": subject,
    });

    if (!subjectEntry) {
      return res
        .status(404)
        .json({ message: "Subject not found in user's goals" });
    }

    await StudyInfo.updateOne(
      { userId: userId, "goals.subject": subject },
      { $addToSet: { "goals.$.topics": { name: topic, completed: false } } }
    );
    res.status(200).json({ message: "the operation completed successfully" });
  } catch (err) {
    errorResponse(err, res);
  }
});
module.exports = router;
