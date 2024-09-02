const express = require('express');
const multer = require('multer');
const { createPost, getPosts, likePost, commentOnPost } = require('../controllers/postController');
const { protectRoute } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage

// Create a post
router.post('/', protectRoute, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), createPost);

// Get posts
router.get('/', protectRoute, getPosts);

// Like a post
router.put('/like/:postId', protectRoute, likePost);

// Comment on a post
router.put('/comment/:postId', protectRoute, commentOnPost);

module.exports = router;
