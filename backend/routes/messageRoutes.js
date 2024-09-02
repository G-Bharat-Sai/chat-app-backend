const express = require('express');
const router = express.Router();
const multer = require('multer');
const { sendMessage, getMessages, deleteMessage } = require('../controllers/messageController');
const { protectRoute } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Define routes
router.post('/', protectRoute, upload.single('file'), sendMessage); // Handle file uploads
router.get('/', protectRoute, getMessages);
router.delete('/', protectRoute, deleteMessage); // Route for deleting messages

module.exports = router;
