const mongoose = require('mongoose');
const env = require('./config'); // Assuming you have a config file for environment variables

// Define the Medal schema with default values
const medalSchema = new mongoose.Schema({
    platinum: {
        type: Number,
        default: 0
    },
    gold: {
        type: Number,
        default: 0
    },
    silver: {
        type: Number,
        default: 0
    },
    bronze: {
        type: Number,
        default: 0
    }
});

// Define the User schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String, // Store the hashed password
    collegeName: String,
    collegeState: String,
    collegeCity: String,
    phoneNumber: String,
    branch: String,
    year: Number,
    linkedin: String,
    posts: String,
    address: String,
    ideas: String,
    why: String,
    referral: String,
    points: Number,
    coins: {
        type: Number,
        default: 0
    },
    medals: {
        platinum: {
            type: Number,
            default: 0
        },
        gold: {
            type: Number,
            default: 0
        },
        silver: {
            type: Number,
            default: 0
        },
        bronze: {
            type: Number,
            default: 0
        }
    }
});

// Connect to MongoDB
const url = env('DATABASE_URL');
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000 // Set timeout to 30 seconds
}).then(() => {
  console.log("MongoDB connected");
}).catch((err) => {
  console.error("Error connecting to MongoDB:", err);
});

const User = mongoose.model('User', userSchema);
const Medal = mongoose.model('Medal', medalSchema);

module.exports = {
    User,
    Medal
};
