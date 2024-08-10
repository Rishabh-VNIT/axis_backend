const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(cors());

const users = []; // In-memory array to store user data
const secretKey = 'your_secret_key'; // Replace with a secure secret key

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
    } = req.body;
  
    // Check if the email is already registered
    const existingUser = users.find((user) => user.email === email);
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
  
    const newUser = {
      name,
      email,
      password: hashedPassword,
      collegeName,
      collegeState,
      collegeCity,
      phoneNumber,
      points: 0, // You can initialize the points as needed
    };
  
    users.push(newUser);
    res.json({ message: 'Registration successful' });
  });
  
// User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if the email exists
  const user = users.find((user) => user.email === email);
  if (!user) {
    return res.status(400).json({ message: 'Email not found' });
  }

  // Verify the password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: 'Invalid password' });
  }

  // Create and return a JWT token
  const token = jwt.sign({ _id: user.email }, secretKey);
  res.header('auth-token', token).json({ token });
});

// Profile Retrieval (protected route)
app.get('/api/profile', (req, res) => {
  // Simulate user authentication using a middleware (for simplicity)
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const user = users.find((user) => user.email === decoded._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Exclude the password field from the response
    const { password, ...userData } = user;

    res.json({ user: userData });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});
// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  // Sort users by points in descending order and limit to the top 10
  const topUsers = users
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)
    .map((user) => {
      // Create an object with the desired fields (name, collegeName, points)
      const { name, collegeName, points } = user;
      return { name, collegeName, points };
    });

  res.json({ leaderboard: topUsers });
});

// Backend (Express.js) code to get a list of all users
app.get('/api/users', (req, res) => {
  // You should implement authentication to ensure that only admins can access this route
  
  // Return the list of all users (excluding the password field)
  const usersWithoutPasswords = users.map((user) => {
    const { password, ...userData } = user;
    return userData;
  });

  res.json({ users: usersWithoutPasswords });
});
// Backend (Express.js) code for adding points using email as identifier
app.put('/api/add-points/:userEmail', (req, res) => {
  const { userEmail } = req.params;
  const { points } = req.body;

  // Find the user by email (you should validate and authenticate the admin)
  const user = users.find((user) => user.email === userEmail);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Update the user's points
  user.points += parseInt(points, 10);

  // Respond with the updated user object
  res.json({ user });
});

// Backend (Express.js) code for deducting points using email as identifier
app.put('/api/deduct-points/:userEmail', (req, res) => {
  const { userEmail } = req.params;
  const { points } = req.body;

  // Find the user by email (you should validate and authenticate the admin)
  const user = users.find((user) => user.email === userEmail);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Ensure that the user has enough points to deduct
  if (user.points < parseInt(points, 10)) {
    return res.status(400).json({ message: 'Not enough points to deduct' });
  }

  // Update the user's points
  user.points -= parseInt(points, 10);

  // Respond with the updated user object
  res.json({ user });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJhIiwiaWF0IjoxNjk2NTY3NTA2fQ.mF6LL0sBbkdinLZGIizm0rL1fOReFJ3JcIy1-iFXxZU
