const mongoose = require("mongoose");
const Books = mongoose.model("Book", new mongoose.Schema({}), "books");

module.exports = Books;