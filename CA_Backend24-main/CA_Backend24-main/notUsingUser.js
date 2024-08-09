const mongoose = require("mongoose");

// Define a schema for the user collection
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String, // Store the hashed password
  collegeName: String,
  collegeState: String,
  collegeCity: String,
  phoneNumber: String,
  branch:String,
  year:Number,
  linkedin:String,
  posts:String,
  address:String,
  ideas:String,
  why:String,
  refral:String,
  points: Number,
});

// Create a model for the "users" collection
const User = mongoose.model("User", userSchema);

module.exports = User; // Export the model
