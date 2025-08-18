const mongoose = require("mongoose");
const Books = mongoose.model("Book", new mongoose.Schema({}), "Book_List");

module.exports = Books;