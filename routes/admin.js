const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db');

const app = express.Router();


const secretKey = process.env.secretKey;

app.use(bodyParser.json());
app.use(cors());

app.get('/api/users', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from headers
  try {
    const decoded = jwt.verify(token, secretKey);
    const adminIdFromToken = decoded._id;

    if (adminIdFromToken !== process.env.ADMIN_ID) {
      return res.status(403).json({ message: 'Forbidden: Invalid admin ID' });
    }

    const usersWithoutPasswords = await User.find()
      .populate('medals')
      .select('-password');

    res.json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.get('/api/users/coins-medals', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from headers
  try {
      if (!token) return res.status(403).json({ message: 'No token provided' });

      const decoded = jwt.verify(token, secretKey);
      const adminIdFromToken = decoded._id;

      if (adminIdFromToken !== process.env.ADMIN_ID) {
          return res.status(403).json({ message: 'Forbidden: Invalid admin ID' });
      }

      // Fetch users and select only coins and medals fields
      const users = await User.find()
          .select('coins medals'); // Select only the required fields

      // Format the response
      const formattedUsers = users.map(user => ({
          userId: user._id,
          coins: user.coins,
          medals: {
              platinum: user.medals.platinum,
              gold: user.medals.gold,
              silver: user.medals.silver,
              bronze: user.medals.bronze
          }
      }));

      res.json({ users: formattedUsers });
  } catch (error) {
      console.error('Error fetching coins and medals:', error);
      res.status(500).json({ message: 'Server error' });
  }
});


app.post('/change-points', async (req, res) => {
  const { token, userId, points } = req.body;
  console.log("Request Aali");
  try {

    // Verify token and extract admin ID
    const decoded = jwt.verify(token, secretKey);
    const adminIdFromToken = decoded._id;

    // Check if admin ID matches
    if (adminIdFromToken !== process.env.ADMIN_ID) {
      return res.status(403).json({ message: 'Forbidden: Invalid admin ID' });
    }

    // Find user by userId and update points
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.points += points;
    if (user.points < 0) {
      user.points = 0;
    }
    await user.save();

    res.status(200).json({ message: 'Points updated successfully', user });
  } catch (error) {
    console.error('Error changing points:', error);
    res.status(500).json({ message: 'Failed to change points' });
  }
});

app.post('/save-points', async (req, res) => {
  console.log("Request Save LA Aali");
  const { token, userId, points } = req.body;
  console.log(points);
  try {
    // Verify token and extract admin ID
    const decoded = jwt.verify(token, secretKey);
    const adminIdFromToken = decoded._id;

    // Check if admin ID matches
    if (adminIdFromToken !== process.env.ADMIN_ID) {
      return res.status(403).json({ message: 'Forbidden: Invalid admin ID' });
    }

    // Find user by userId and update points
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.points = points;
    if (user.points < 0) {
      user.points = 0;
    }
    await user.save();

    res.status(200).json({ message: 'Points updated successfully', user });
  } catch (error) {
    console.error('Error changing points:', error);
    res.status(500).json({ message: 'Failed to change points' });
  }
});


app.post('/reset-all-points', async (req, res) => {
  console.log("Request Reset All Points");

  const { token } = req.body;

  try {
    // Verify token and extract admin ID
    const decoded = jwt.verify(token, secretKey);
    const adminIdFromToken = decoded._id;

    // Check if admin ID matches
    if (adminIdFromToken !== process.env.ADMIN_ID) {
      return res.status(403).json({ message: 'Forbidden: Invalid admin ID' });
    }

    // Fetch the top 15 users
    const topUsers = await User.find()
      .sort({ points: -1 })
      .limit(15)
      .select('_id medals coins');

    // Define medal and points values
    const medalValues = {
      platinum: 100,
      gold: 80,
      silver: 60,
      bronze: 40
    };

    // Update medals, coins, and points for top 15 users
    const updates = topUsers.map((user, index) => {
      let medalType;
      let coinsToAdd = 0;

      if (index === 0) {
        medalType = 'platinum';
        coinsToAdd = 50; // Example coin value for platinum
      } else if (index <= 2) {
        medalType = 'gold';
        coinsToAdd = 30; // Example coin value for gold
      } else if (index <= 7) {
        medalType = 'silver';
        coinsToAdd = 20; // Example coin value for silver
      } else if (index <= 14) {
        medalType = 'bronze';
        coinsToAdd = 10; // Example coin value for bronze
      }
      console.log(coinsToAdd);
      return {
        updateOne: {
          filter: { _id: user._id },
          update: {
            $inc: {
              [`medals.${medalType}`]: 1, // Increment medal count
              points: medalValues[medalType], // Set points based on medal type
              coins: coinsToAdd // Increment coins based on medal type
            }
          }
        }
      };
    });

    // Perform bulk update
    await User.bulkWrite(updates);

    // Reset points for all users
    await User.updateMany({}, { $set: { points: 0 } });

    res.status(200).json({ message: 'Top users updated, coins incremented, and all points have been reset successfully' });
  } catch (error) {
    console.error('Error updating top users and resetting points:', error);
    res.status(500).json({ message: 'Failed to update top users and reset points' });
  }
});


module.exports = app;