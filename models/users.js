const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userid: {
    type: Number,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  profilePicture: {
    type: String,
  },
  profileBanner: {
    type: String,
  },
  bio: {
    type: String,
    default: '',
  },
  verified: {
    type: Boolean,
    default: false, // Set default value to false
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
