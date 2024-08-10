const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const User = require("./User"); // Import the Mongoose model
const mongoose = require("mongoose");

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(cors());

// const users = []; // In-memory array to store user data
const secretKey = 'your_secret_key'; // Replace with a secure secret key

const uri="mongodb://ytvid:u9Gu!6DU-Q7jhxv@ac-ufe3dkr-shard-00-00.tz9m6g2.mongodb.net:27017,ac-ufe3dkr-shard-00-01.tz9m6g2.mongodb.net:27017,ac-ufe3dkr-shard-00-02.tz9m6g2.mongodb.net:27017/?ssl=true&replicaSet=atlas-y0bwob-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// User Registration
app.post('/api/register', async (req, res) => {
    const {
      name,
      email,
      password,
      confirmPassword,
      collegeName,
      collegeState,
      collegeCity,
      phoneNumber,
      branch,
      year,
      linkedin,
      posts,
      address,
      ideas,
      why,
      refral,
    } = req.body;
  
    try {
      // Check if the email is already registered
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
  
      // Check if password and confirm password match
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Password and confirm password do not match' });
      }
  
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create a new user instance
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        collegeName,
        collegeState,
        collegeCity,
        phoneNumber,
        branch,
        year,
        linkedin,
        posts,
        address,
        ideas,
        why,
        refral,
        points: 0, // You can initialize the points as needed
      });
  
      // Save the user to the MongoDB collection
      await newUser.save();
  
      res.json({ message: 'Registration successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

// User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ _id: user.email }, secretKey);
    res.header('auth-token', token).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Profile Retrieval (protected route)
app.get('/api/profile', async (req, res) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const user = await User.findOne({ email: decoded._id });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Exclude the password field from the response
    const { password, ...userData } = user;

    // console.log('Profile Data Sent:', userData); // Add this line to log the data

    res.json({ user: userData });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ points: -1 })
      .limit(10)
      .select('name collegeName points');
      
      res.json({ leaderboard: topUsers });
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

// Update User Profile
// app.put('/api/edit-profile', authenticateToken, async (req, res) => {
  app.put('/api/edit-profile', async (req, res) => {
    const token = req.header('auth-token');
    if (!token) {
      return res.status(401).json({ message: 'Access denied' });
    }
  
    try {
      const decoded = jwt.verify(token, secretKey);
      const user = await User.findOne({ email: decoded._id });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Update user fields using req.body
      Object.keys(req.body).forEach((key) => {
        if (key !== 'email' && key !== 'points' && key !== 'password') {
          user[key] = req.body[key];
        }
      });
  
      // Save the updated user profile
      await user.save();
  
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Profile update failed' });
    }
  });
  

  //
//   const { email } = req.user; // Extract the user's email from the token payload
//   console.log(email);
//   const updateFields = req.body; // Fields to update

//   try {
//     // Check if the user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Update user fields
//     Object.keys(updateFields).forEach((key) => {
//       if (key !== 'email') {
//         user[key] = updateFields[key];
//       }
//     });

//     // Save the updated user profile
//     await user.save();

//     res.json({ message: 'Profile updated successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Profile update failed' });
//   }
// });

// Backend (Express.js) code to get a list of all users
// app.get('/api/users', async (req, res) => {
  //   try {
    //     const usersWithoutPasswords = await User.find().select('-password');
    //     res.json({ users: usersWithoutPasswords });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error fetching users' });
//   }
// });


// Define the route for adding points
// app.put('/api/add-points/:userId', async (req, res) => {
//   const { userId } = req.params;
//   const { points } = req.body;

//   try {
//     // Find the user by their unique identifier (e.g., userId)
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Update the user's points
//     user.points += parseInt(points, 10);

//     // Save the user object with the updated points
//     await user.save();

//     res.json({ message: 'Points added successfully', user });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to add points' });
//   }
// });
// Define the route for deducting points
// app.put('/api/deduct-points/:userId', async (req, res) => {
//   const { userId } = req.params;
//   const { points } = req.body;

//   try {
//     // Find the user by their unique identifier (e.g., userId)
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Check if the user has enough points to deduct
//     if (user.points < parseInt(points, 10)) {
//       return res.status(400).json({ message: 'Not enough points to deduct' });
//     }

//     // Deduct points from the user
//     user.points -= parseInt(points, 10);

//     // Save the user object with the updated points
//     await user.save();

//     res.json({ message: 'Points deducted successfully', user });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to deduct points' });
//   }
// });


// Admin Login
// // Admin Login
// app.post('/api/adminlogin', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Use the Admin model to find an admin with the given email
//     const admin = await Admin.findOne({ email });
//     if (!admin) {
//       return res.status(400).json({ message: 'Email not found' });
//     }

//     const validPassword = await bcrypt.compare(password, admin.password);
//     if (!validPassword) {
//       return res.status(400).json({ message: 'Invalid password' });
//     }

//     // Create and return a JWT token for the admin
//     const token = jwt.sign({ email: admin.email }, 'your_secret_key');
//     res.header('auth-token', token).json({ token });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Admin login failed' });
//   }
// });


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJhIiwiaWF0IjoxNjk2NTY3NTA2fQ.mF6LL0sBbkdinLZGIizm0rL1fOReFJ3JcIy1-iFXxZU
