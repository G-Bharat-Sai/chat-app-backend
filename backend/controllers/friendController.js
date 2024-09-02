const User = require('../models/User');
const Friend = require('../models/Friend');
const mongoose = require('mongoose');
const io = require('socket.io')(require('../server'));
const Notification = require('../models/Notification');

// Utility function to validate MongoDB ObjectIDs
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Send a friend request based on username
exports.sendFriendRequest = async (req, res) => {
    const { username } = req.body;
    const userId = req.user._id;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        const user = await User.findById(userId);
        const friend = await User.findOne({ username });

        if (!friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        const friendId = friend._id;

        // Check if they are already friends
        const existingFriendship = await Friend.findOne({
            $or: [
                { userId: userId, friendId: friendId, status: 'accepted' },
                { userId: friendId, friendId: userId, status: 'accepted' }
            ]
        });

        if (existingFriendship) {
            return res.status(400).json({ message: 'Already friends' });
        }

        // Check if a friend request has already been sent or received
        const existingRequest = await Friend.findOne({
            userId: userId,
            friendId: friendId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }

        const receivedRequest = await Friend.findOne({
            userId: friendId,
            friendId: userId,
            status: 'pending'
        });

        if (receivedRequest) {
            return res.status(400).json({
                message: 'This user has already sent you a friend request. Please accept or reject it instead.'
            });
        }

        // Proceed to send a new friend request
        await Friend.create({
            userId: userId,
            friendId: friendId,
            status: 'pending'
        });

        // Create a notification
        await Notification.create({
            user: friendId,
            type: 'friend_request',
            relatedId: userId,
            message: `${user.username} has sent you a friend request`
        });

        // Emit notification
        io.emit('notification', {
            userId: friendId,
            message: `${user.username} has sent you a friend request`
        });

        res.status(200).json({ message: 'Friend request sent' });
    } catch (err) {
        console.error('Error in sendFriendRequest:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Accept a friend request based on username
exports.acceptFriendRequest = async (req, res) => {
    const { username } = req.body;
    const userId = req.user._id;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        const user = await User.findById(userId);
        const friend = await User.findOne({ username });

        if (!friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        const friendId = friend._id;

        const request = await Friend.findOneAndUpdate(
            { userId: friendId, friendId: userId, status: 'pending' },
            { status: 'accepted' },
            { new: true }
        );

        if (!request) {
            return res.status(400).json({ message: 'No pending friend request found' });
        }

        // Create the reciprocal friendship
        await Friend.create({
            userId: userId,
            friendId: friendId,
            status: 'accepted'
        });

        // Increment friendCount for both users
        await User.findByIdAndUpdate(userId, { $inc: { friendCount: 1 } });
        await User.findByIdAndUpdate(friendId, { $inc: { friendCount: 1 } });

        // Create a notification
        await Notification.create({
            user: friendId,
            type: 'friend_request_accepted',
            relatedId: userId,
            message: `${user.username} has accepted your friend request`
        });

        // Emit notification
        io.emit('notification', {
            userId: friendId,
            message: `${user.username} has accepted your friend request`
        });

        res.status(200).json({ message: 'Friend request accepted' });
    } catch (err) {
        console.error('Error in acceptFriendRequest:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Reject a friend request based on username
exports.rejectFriendRequest = async (req, res) => {
    const { username } = req.body;
    const userId = req.user._id;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        const user = await User.findById(userId);
        const friend = await User.findOne({ username });

        if (!friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        const friendId = friend._id;

        const request = await Friend.findOneAndUpdate(
            { userId: friendId, friendId: userId, status: 'pending' },
            { status: 'rejected' },
            { new: true }
        );

        if (!request) {
            return res.status(400).json({ message: 'No pending friend request found' });
        }

        // Create a notification
        await Notification.create({
            user: friendId,
            type: 'friend_request_rejected',
            relatedId: userId,
            message: `${user.username} has rejected your friend request`
        });

        // Emit notification
        io.emit('notification', {
            userId: friendId,
            message: `${user.username} has rejected your friend request`
        });

        res.status(200).json({ message: 'Friend request rejected' });
    } catch (err) {
        console.error('Error in rejectFriendRequest:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Remove a friend based on username
exports.removeFriend = async (req, res) => {
    const { username } = req.body;
    const userId = req.user._id;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        const user = await User.findById(userId);
        const friend = await User.findOne({ username });

        if (!friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        const friendId = friend._id;

        // Remove the friendship from both sides
        await Friend.deleteMany({
            $or: [
                { userId: userId, friendId: friendId, status: 'accepted' },
                { userId: friendId, friendId: userId, status: 'accepted' }
            ]
        });

        // Decrement friendCount for both users
        await User.findByIdAndUpdate(userId, { $inc: { friendCount: -1 } });
        await User.findByIdAndUpdate(friendId, { $inc: { friendCount: -1 } });

        // Create a notification
        await Notification.create({
            user: friendId,
            type: 'friend_removed',
            relatedId: userId,
            message: `${user.username} has removed you as a friend`
        });

        // Emit notification
        io.emit('notification', {
            userId: friendId,
            message: `${user.username} has removed you as a friend`
        });

        res.status(200).json({ message: 'Friend removed' });
    } catch (err) {
        console.error('Error in removeFriend:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get all friend requests for the authenticated user
exports.getFriendRequests = async (req, res) => {
    const userId = req.user._id;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        // Find all pending friend requests received by the user
        const receivedRequests = await Friend.find({
            friendId: userId,
            status: 'pending'
        }).populate('userId', 'username'); // Populate the username of the sender

        // Remove duplicates if any
        const uniqueRequests = receivedRequests.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.userId._id.toString() === value.userId._id.toString()
            ))
        );

        res.status(200).json({
            message: 'Friend requests retrieved successfully',
            friendRequests: uniqueRequests
        });
    } catch (err) {
        console.error('Error in getFriendRequests:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get all friends of the authenticated user
exports.getAllFriends = async (req, res) => {
    const userId = req.user._id;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        const friends = await Friend.find({
            $or: [
                { userId: userId, status: 'accepted' },
                { friendId: userId, status: 'accepted' }
            ]
        })
        .populate('userId', 'username')
        .populate('friendId', 'username');

        // Map and filter friends for easier consumption and remove duplicates
        const uniqueFriends = [];
        friends.forEach(friend => {
            const friendData = friend.userId.equals(userId) ? friend.friendId : friend.userId;
            if (!uniqueFriends.some(f => f.friendId.equals(friendData._id))) {
                uniqueFriends.push({ username: friendData.username, friendId: friendData._id });
            }
        });

        res.status(200).json({ message: 'Friends retrieved successfully', friends: uniqueFriends });
    } catch (err) {
        console.error('Error in getAllFriends:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get mutual friends between the authenticated user and another user
exports.getMutualFriends = async (req, res) => {
    const userId = req.user._id;
    const { friendUsername } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (!friendUsername) {
        return res.status(400).json({ message: 'Friend username is required' });
    }

    try {
        // Find the friend by username
        const friend = await User.findOne({ username: friendUsername });
        if (!friend) {
            return res.status(404).json({ message: 'User not found' });
        }
        const friendId = friend._id;

        // Find all accepted friends of both users
        const userFriends = await Friend.find({
            $or: [{ userId: userId, status: 'accepted' }, { friendId: userId, status: 'accepted' }]
        });
        const friendFriends = await Friend.find({
            $or: [{ userId: friendId, status: 'accepted' }, { friendId: friendId, status: 'accepted' }]
        });

        // Map the friendIds and remove duplicates
        const userFriendIds = Array.from(new Set(userFriends.map(f => f.userId.equals(userId) ? f.friendId.toString() : f.userId.toString())));
        const friendFriendIds = Array.from(new Set(friendFriends.map(f => f.userId.equals(friendId) ? f.friendId.toString() : f.userId.toString())));

        // Find mutual friends
        const mutualFriendIds = userFriendIds.filter(id => friendFriendIds.includes(id));
        
        // Fetch mutual friends from the database
        const mutualFriends = await User.find({ _id: { $in: mutualFriendIds } }, 'username');
        
        res.status(200).json({ message: 'Mutual friends retrieved successfully', mutualFriends });
    } catch (err) {
        console.error('Error in getMutualFriends:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get friends who are friends of the authenticated user's friends
exports.getFriendsOfFriends = async (req, res) => {
    const userId = req.user._id;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        // Find all accepted friends of the user
        const userFriends = await Friend.find({
            $or: [{ userId: userId, status: 'accepted' }, { friendId: userId, status: 'accepted' }]
        });

        // Map the friendIds
        const userFriendIds = userFriends.map(f => (f.userId.equals(userId) ? f.friendId : f.userId));

        // Find friends of friends
        const friendsOfFriends = await Friend.find({
            $or: [
                { userId: { $in: userFriendIds }, status: 'accepted' },
                { friendId: { $in: userFriendIds }, status: 'accepted' }
            ],
            // Exclude the user's direct friends
            $and: [
                { userId: { $ne: userId } },
                { friendId: { $ne: userId } }
            ]
        })
        .populate('userId', 'username')
        .populate('friendId', 'username');

        // Map and filter for easier consumption and remove duplicates
        const uniqueFriendsOfFriends = [];
        friendsOfFriends.forEach(friend => {
            const friendData = friend.userId.equals(userId) ? friend.friendId : friend.userId;
            if (!uniqueFriendsOfFriends.some(f => f.friendId.equals(friendData._id))) {
                uniqueFriendsOfFriends.push({ username: friendData.username, friendId: friendData._id });
            }
        });

        res.status(200).json({ message: 'Friends of friends retrieved successfully', friendsOfFriends: uniqueFriendsOfFriends });
    } catch (err) {
        console.error('Error in getFriendsOfFriends:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get the friend count for the authenticated user
exports.getFriendCount = async (req, res) => {
    const userId = req.user._id;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ friendCount: user.friendCount });
    } catch (err) {
        console.error('Error in getFriendCount:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
