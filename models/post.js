const mongoose = require('mongoose');
const { generateRandomID } = require('../utils');

const replySchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  replies: [replySchema],
});

const postSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: generateRandomID,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  imageUrl: { type: String }, // Store the image URL
  comments: [commentSchema],
  hearts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

// Define a virtual property to calculate the time ago
postSchema.virtual('timeAgo').get(function () {
  const now = new Date();
  const createdAt = this.createdAt;
  const timeDifference = now - createdAt;
  const secondsAgo = Math.floor(timeDifference / 1000);

  const oneDay = 24 * 60 * 60;
  const oneWeek = oneDay * 7;
  const oneMonth = oneDay * 30.44; // Approximation for an average month
  const oneYear = oneDay * 365; // Approximation for an average year

  if (secondsAgo < 60) {
    return `${secondsAgo} second${secondsAgo !== 1 ? 's' : ''} ago`;
  } else if (secondsAgo < oneDay) {
    const minutesAgo = Math.floor(secondsAgo / 60);
    return `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
  } else if (secondsAgo < oneWeek) {
    const hoursAgo = Math.floor(secondsAgo / (60 * 60));
    return `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
  } else if (secondsAgo < oneMonth) {
    const daysAgo = Math.floor(secondsAgo / oneDay);
    return `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
  } else if (secondsAgo < oneYear) {
    const weeksAgo = Math.floor(secondsAgo / oneWeek);
    return `${weeksAgo} week${weeksAgo !== 1 ? 's' : ''} ago`;
  } else {
    const yearsAgo = Math.floor(secondsAgo / oneYear);
    return `${yearsAgo} year${yearsAgo !== 1 ? 's' : ''} ago`;
  }
});


// Export the Post model
module.exports = mongoose.model('Post', postSchema);
