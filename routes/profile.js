const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/users');
const multer = require('multer'); // For handling file uploads
const mongoose = require('mongoose');
const { Readable } = require('stream');

// Multer configuration for profile picture and banner upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to get the authenticated user's information (profile settings)
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password'); // Excluding the password field
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      name: user.username,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      profileBanner: user.profileBanner, // Include the profileBanner field
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'An error occurred while fetching user profile' });
  }
});

// Route to update profile settings
router.post('/settings', authMiddleware, upload.fields([{ name: 'avatar' }, { name: 'banner' }]), async (req, res) => {
  try {
    let user = req.user;

    if (!(user instanceof User)) {
      const foundUser = await User.findById(req.user._id);
      if (!foundUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      user = foundUser;
    }

    if (req.files['avatar']) {
      const base64Image = req.files['avatar'][0].buffer.toString('base64');
      user.profilePicture = base64Image;
    }

    if (req.body.newBio) {
      user.bio = req.body.newBio;
    }

    // Update the user's profile banner if a new one was uploaded
    if (req.files['banner']) {
      const base64Banner = req.files['banner'][0].buffer.toString('base64');
      user.profileBanner = base64Banner;
    }

    await user.save();

    res.status(200).json({ message: 'Profile settings updated successfully' });
  } catch (error) {
    console.error('Profile settings update error:', error);
    res.status(500).json({ message: 'An error occurred during profile settings update' });
  }
});

const defaultImageURL = 'https://mediashare.ink/file/65401d8dc40b62307de5c546'; // URL of the default image
const defaultBannerURL = 'https://example.com/default-banner.png'; // URL of the default banner image

// Route to get the user's profile picture
router.get('/:userid/image', async (req, res) => {
  try {
    const userId = req.params.userid;
    const user = await User.findById(userId);

    if (!user || !user.profilePicture) {
      // If the user or the profilePicture field is not found, send the default image
      return res.redirect(defaultImageURL);
    }

    res.contentType('image/png');
    res.end(Buffer.from(user.profilePicture, 'base64'));
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    res.status(500).json({ message: 'An error occurred while fetching profile picture' });
  }
});

// Route to get the user's profile banner
router.get('/:userid/banner', async (req, res) => {
  try {
    const userId = req.params.userid;
    const user = await User.findById(userId);

    if (!user || !user.profileBanner) {
      // If the user or the profileBanner field is not found, send the default banner image
      return res.redirect(defaultBannerURL);
    }

    res.contentType('image/png');
    res.end(Buffer.from(user.profileBanner, 'base64'));
  } catch (error) {
    console.error('Error fetching profile banner:', error);
    res.status(500).json({ message: 'An error occurred while fetching profile banner' });
  }
});

module.exports = router;
