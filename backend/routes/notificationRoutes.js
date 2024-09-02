const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { protectRoute } = require('../middleware/authMiddleware');

router.get('/', protectRoute, getNotifications);
router.put('/:id/read', protectRoute, markAsRead);

module.exports = router;
