const mongoose = require("mongoose");
require("dotenv").config();

function connectDB() {
  const MONGO_URI = process.env.MONGO_URI;
  mongoose.connect(MONGO_URI).then(() => {
    console.log("Connected to MongoDB");
  }).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

}

module.exports = connectDB;