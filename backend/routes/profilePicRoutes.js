const express = require('express');
const multer = require('multer');
const { uploadProfilePicture, getProfilePicture, getProfilePictureByUsername } = require('../controllers/profilePicController'); // Add getProfilePictureByUsername here
const { protectRoute } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define routes
router.post('/', protectRoute, upload.single('profilePic'), uploadProfilePicture);
router.get('/:id', protectRoute, getProfilePicture);
router.get('/username/:username', protectRoute, getProfilePictureByUsername); // Ensure this line is correct

module.exports = router;
