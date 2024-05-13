const jwt = require('jsonwebtoken');
const User = require('../models/users');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token; // Read the token from the cookie

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Verify the token asynchronously using the secret stored in the environment variable
    const decodedToken = await jwt.verify(token, '0cb8cb62ff090ef56f95e1c9048d7f5308c588aaff0363a34549d2e576df7c9b', { algorithms: ['HS256'] });

    // Get the user ID from the token
    const userId = decodedToken.userId;

    // Fetch the user from the database by ID and attach the user data to the request
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    // Attach the user data to the request for later use in the route handlers
    req.user = { 
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt // Include the createdAt field from the user document
    };

    // Continue with the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'An error occurred during authentication' });
  }
};

module.exports = authMiddleware;
