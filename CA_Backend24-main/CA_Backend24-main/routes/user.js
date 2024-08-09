const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Medal } = require('../db');

const app = express.Router();

app.use(bodyParser.json());
app.use(cors());

function generateReferralCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let code = '';
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    code += '-';
    for (let i = 0; i < 3; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    code += '-';
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    return code;
}

const secretKey = process.env.secretKey;

app.get('/v1', (req, res) => {
    res.json({
        msg: "Hello World"
    })
})

app.post('/api/register', async (req, res) => {
    console.log("LMAO");
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
        linkedin,
        posts,
        address,
        ideas,
        why,
        referral,
        points = 0
    } = req.body;

    const year = Number(req.body.year[0]);

    console.log(year);

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Password and confirm password do not match' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log("lmao");

        const referralCode = generateReferralCode();

        if (referral) {
            const referredUser = await User.findOne({ referral });
            if (referredUser) {
                referredUser.points += 10;
                await referredUser.save();
            }
        }

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
            referral: referralCode,
            points
        });

        // return res.json({
        //     data:{
        //         msg : "Lmao"
        //     }
        // })
        await newUser.save();

        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Email not found' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ message: 'Invalid password' });
            }

            const token = jwt.sign({ _id: user._id }, secretKey);
            res.header('auth-token', token).json({ token });
            return;
        } catch (error) {
            console.error('Error in user login:', error);
            res.status(500).json({ message: 'Failed to login' });
            return;
        }

        res.json({
            data: {
                message: 'Registration successful'
            }
        });

    } catch (error) {
        console.error('Error in user registration:', error);
        res.status(500).json({ message: 'Failed to register user' });
    }
});

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

        const token = jwt.sign({ _id: user._id }, secretKey);
        res.header('auth-token', token).json({ token });
    } catch (error) {
        console.error('Error in user login:', error);
        res.status(500).json({ message: 'Failed to login' });
    }
});

app.get('/api/profile', async (req, res) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        const user = await User.findOne({ _id: decoded._id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password, ...userData } = user.toObject();

        res.json({ user: userData });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

app.get('/api/profile-icon', async (req, res) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        const user = await User.findOne({ _id: decoded._id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // const { password, ...userData } = user.toObject();

        res.json({ user: user.name[0] });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const topUsers = await User.find()
            .sort({ points: -1 })
            .limit(15) // Change limit to 15
            .select('name collegeName points');

        res.json({ leaderboard: topUsers });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
});


app.get('/api/users', async (req, res) => {
    try {
        const usersWithoutPasswords = await User.find().select('-password');
        res.json({ users: usersWithoutPasswords });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

app.put('/api/edit-profile', async (req, res) => {
    const authToken = req.header('auth-token');

    if (!authToken) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(authToken, secretKey);
        const userId = decoded._id;

        const {
            collegeName,
            collegeState,
            collegeCity,
            branch,
            year,
            linkedin,
            posts,
            address,
            ideas,
            why
        } = req.body;

        const updateFields = {
            collegeName,
            collegeState,
            collegeCity,
            branch,
            year,
            linkedin,
            posts,
            address,
            ideas,
            why
        };

        Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

module.exports = app;
