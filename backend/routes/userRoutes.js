const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Setup multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Search users by username
router.get('/search', authMiddleware.protectRoute, userController.searchUsersByUsername);


// Get user profile by username
router.get('/profile/username/:username', authMiddleware.protectRoute, userController.getProfileByUsername);

// Update user profile by username
router.put('/profile/username/:username', authMiddleware.protectRoute, upload.single('profilePicture'), userController.updateProfileByUsername);


module.exports = router;
