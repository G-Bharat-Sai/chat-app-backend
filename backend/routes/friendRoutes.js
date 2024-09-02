const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/authMiddleware');

// Send a friend request
router.post('/request', authMiddleware.protectRoute, friendController.sendFriendRequest);

// Get all friend requests
router.get('/requests', authMiddleware.protectRoute, friendController.getFriendRequests);

// Accept a friend request
router.post('/accept', authMiddleware.protectRoute, friendController.acceptFriendRequest);

// Reject a friend request
router.post('/reject', authMiddleware.protectRoute, friendController.rejectFriendRequest);

// Remove a friend
router.delete('/remove', authMiddleware.protectRoute, friendController.removeFriend);

// Get all friends
router.get('/all', authMiddleware.protectRoute, friendController.getAllFriends);

// Get mutual friends with another user
router.get('/mutual/:friendUsername', authMiddleware.protectRoute, friendController.getMutualFriends);

// Get friends of the user's friends
router.get('/friends-of-friends', authMiddleware.protectRoute, friendController.getFriendsOfFriends);

// Get friend count for the authenticated user
router.get('/count', authMiddleware.protectRoute, friendController.getFriendCount);

module.exports = router;
