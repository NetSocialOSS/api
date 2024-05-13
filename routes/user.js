const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const cors = require('cors'); // Import the cors package
const authMiddleware = require('../middleware/auth'); // Import the auth middleware
const dotenv = require('dotenv');
let nextUserId = 1; // Initialize with the next available user ID

// Load environment variables from .env file
dotenv.config();
const config = require('../config.json'); // Update the path to your config.json file

// Route to get the authenticated user's information
router.get('/user', authMiddleware, (req, res) => {
  // Determine if the user is an admin based on their username
  const isAdmin = config.users.admin.includes(req.user.username);

  // Return the authenticated user's information, including the user_id (_id) and admin status
  const userData = {
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    createdAt: req.user.createdAt,
    bio: req.user.bio,
    profilePicture: req.user.profilePicture || null, // Return null if profilePicture is not available
    admin: isAdmin,
  };

  res.json(userData);
});

// Define a route to get user JSON data by user id
router.get('/user/:userid', async (req, res) => {
  const userId = req.params.userid;

  try {
    // Find the user by their userid
    const user = await User.findOne({ userid: userId });
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return the user JSON data
    res.json(user);
  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({ message: 'An error occurred while getting user data' });
  }
});





// POST /api/signup - Create a new user account
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the username or email is already registered
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already in use' });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance with the manually generated userid
    const newUser = new User({
      userid: nextUserId,
      username,
      email,
      password: hashedPassword,
    });

    nextUserId++; // Increment the user ID for the next user

    // Save the new user to the database
    await newUser.save();

    // Respond with success message or any other data you want to include in the response
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'An error occurred during signup' });
  }
});


// POST /api/login - Login user
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    
    try {
      // Check if the user exists in the database with either email or username
      const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Compare the provided password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Generate a JSON Web Token (JWT) to authenticate the user
      const token = jwt.sign({ userId: user._id }, '0cb8cb62ff090ef56f95e1c9048d7f5308c588aaff0363a34549d2e576df7c9b', { expiresIn: '1h' });
     
      // Send the token in the response as a cookie
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 3600000, // 1 hour (milliseconds)
    secure: process.env.NODE_ENV === 'production', // Set to true in production
    sameSite: 'strict', // Adjust as needed based on your requirements
  });
      // Send the token in the response
      res.json({ token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'An error occurred during login' });
    }
  });


  // POST /api/logout - Logout user
router.post('/logout', (req, res) => {
  try {
    // Clear the token cookie to log the user out
    res.clearCookie('token');

    // Send a success message
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'An error occurred during logout' });
  }
});

  
module.exports = router;
