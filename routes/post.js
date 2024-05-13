const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const ImgbbUploader = require('imgbb-uploader'); // Import the imgbb-uploader library
const Post = require('../models/post');
const User = require('../models/users');
const { generateRandomID } = require('../utils');
const axios = require('axios');
const config = require('../config.json'); // Update the path to your config.json file

// Configure multer for handling file uploads
const upload = multer();

// GET /api/posts - Get all posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username');

    // Add the 'timeAgo' property to each post
    const postsWithTimeAgo = posts.map((post) => ({
      ...post.toJSON(),
      timeAgo: post.timeAgo, // Access the virtual property
    }));

    res.json(postsWithTimeAgo);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});


// POST /api/posts - Create a new post
router.post('/posts', authMiddleware, upload.single('image'), async (req, res) => {
  const { title, content } = req.body;
  const imageFile = req.file;

  try {
    let imageUrl = null;
    if (imageFile) {
      // Convert the image file buffer to a base64 encoded string
      const imageBase64String = imageFile.buffer.toString('base64');

      // Upload the image to Imgbb using the imgbb-uploader library
      const imgbbResponse = await ImgbbUploader({
        apiKey: '2721e1a5c178ccfdbe66f9e0512fcd31', // Replace with your imgbb API key
        base64string: imageBase64String, // Use the 'base64string' key with the image data
      });

      if (imgbbResponse && imgbbResponse.url) {
        imageUrl = imgbbResponse.url; // Get the uploaded image URL from the response
      }
    }

    let snowflakeID;
    let isUnique = false;

    // Loop until a unique snowflakeID is generated
    while (!isUnique) {
      snowflakeID = generateRandomID();

      const existingPost = await Post.findOne({ _id: snowflakeID });
      if (!existingPost) {
        isUnique = true;
      }
    }

    const newPost = new Post({
      _id: snowflakeID,
      title,
      content,
      author: req.user._id,
      imageUrl, // Save the image URL in the database
    });

    await newPost.save();

    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});


// GET /api/posts/:snowflake - Get a single post by snowflake ID
router.get('/posts/:snowflake', async (req, res) => {
  const snowflake = req.params.snowflake;

  try {
    const post = await Post.findById(snowflake).populate('author', 'username createdAt bio email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Access the virtual property 'timeAgo' like a regular property
    const responseData = {
      _id: post._id,
      title: post.title,
      content: post.content,
      author: post.author,
      createdAt: post.createdAt,
      timeAgo: post.timeAgo, // Access the virtual property
      hearts: post.hearts,
      imageUrl: post.imageUrl ? `/api/posts/${post._id}/image` : null,
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});



// DELETE /api/posts/:snowflake - Delete a post by snowflake ID
router.delete('/posts/:snowflake', authMiddleware, async (req, res) => {
  const snowflake = req.params.snowflake;

  try {
    const post = await Post.findById(snowflake);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the logged-in user is an admin based on their username
    if (config.users.admin.includes(req.user.username) || post.author.toString() === req.user._id.toString()) {
      await Post.findByIdAndRemove(snowflake);
      return res.json({ message: 'Post deleted successfully' });
    } else {
      return res.status(403).json({ message: 'Unauthorized: You are not authorized to delete this post' });
    }
  } catch (error) {
    console.error('Post deletion error:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});



// GET /api/posts/:snowflake/image - Serve the image for a post
router.get('/posts/:snowflake/image', async (req, res) => {
  const snowflake = req.params.snowflake;

  try {
    const post = await Post.findById(snowflake);

    if (!post || !post.imageUrl) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // You can set the appropriate content type based on the image type returned by Imgbb
    // For example, if Imgbb returns image/jpeg, use res.contentType('image/jpeg').
    // Adjust the content type based on your image type.
    res.contentType('image/jpeg');

    // Fetch the image from Imgbb using the imageUrl
    const response = await axios.get(post.imageUrl, { responseType: 'arraybuffer' });
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Failed to fetch image' });
  }
});





// DELETE /api/posts/:snowflake - Delete a post by snowflake ID
router.delete('/posts/:snowflake', authMiddleware, async (req, res) => {
  const snowflake = req.params.snowflake;

  try {
    const post = await Post.findById(snowflake);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You are not the author of this post' });
    }

    await Post.findByIdAndRemove(snowflake);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Post deletion error:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// POST /api/posts/:snowflake/comments/:commentId/replies - Add a reply to a comment
router.post('/posts/:snowflake/comments/:commentId/replies', authMiddleware, async (req, res) => {
  const snowflake = req.params.snowflake;
  const commentId = req.params.commentId;
  const { content } = req.body;

  try {
    const post = await Post.findById(snowflake);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const newReply = {
      content,
      author: req.user._id,
    };

    comment.replies.push(newReply);
    await post.save();

    res.status(201).json(newReply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Failed to add reply' });
  }
});



// POST /api/posts/:snowflake/comments - Add a comment to a post
router.post('/posts/:snowflake/comments', authMiddleware, async (req, res) => {
  const snowflake = req.params.snowflake;
  const { content } = req.body;

  try {
    const post = await Post.findById(snowflake);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      content,
      author: req.user._id,
    };

    post.comments.push(newComment);
    await post.save();

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// POST /api/posts/:snowflake/heart - Add or remove heart to a post
router.post('/posts/:snowflake/heart', authMiddleware, async (req, res) => {
  const snowflake = req.params.snowflake;

  try {
    const post = await Post.findById(snowflake);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has already hearted the post
    const hasHearted = post.hearts.includes(req.user._id);

    if (!hasHearted) {
      // If the user has not hearted the post, add the user's ID to the hearts array
      post.hearts.push(req.user._id);
    } else {
      // If the user has already hearted the post, remove the user's ID from the hearts array
      post.hearts = post.hearts.filter((heartId) => heartId.toString() !== req.user._id.toString());
    }

    await post.save();

    res.json({ message: 'Heart updated successfully', hearts: post.hearts.length });
  } catch (error) {
    console.error('Error updating heart:', error);
    res.status(500).json({ message: 'Failed to update heart' });
  }
});

// GET /api/posts/:snowflake/comments - Get comments for a post
router.get('/posts/:snowflake/comments', async (req, res) => {
  const snowflake = req.params.snowflake;

  try {
    const post = await Post.findById(snowflake).populate('comments.author', 'username createdAt');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post.comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// GET /api/posts/user/:userId - Get posts by the currently logged-in user
router.get('/posts/user/:userId', authMiddleware, async (req, res) => {
  const userId = req.params.userId;

  try {
    // Check if the provided userId matches the currently logged-in user's ID
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You are not authorized to access this resource' });
    }

    // Fetch posts by the user and populate the author information
    const posts = await Post.find({ author: userId }).populate('author', 'username');

    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Failed to fetch user posts' });
  }
});


module.exports = router;
