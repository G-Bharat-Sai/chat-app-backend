const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Group = require('../models/Group');
const Friend = require('../models/Friend');
const Notification = require('../models/Notification');
const { uploadFile } = require('../utils/s3Upload');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const resolveUsernameToId = async (username) => {
    const user = await User.findOne({ username });
    if (!user) throw new Error('User not found');
    return user._id;
};

const getUsernamesByIds = async (userIds) => {
    const users = await User.find({ _id: { $in: userIds } }, 'username');
    return users.reduce((acc, user) => {
        acc[user._id] = user.username;
        return acc;
    }, {});
};

// Send Message
exports.sendMessage = async (req, res) => {
    const { message, isGroupMessage, groupName, receiverUsername } = req.body;
    const file = req.file;

    const isGroup = isGroupMessage === 'true';

    if (!message && !file && (isGroup && !groupName) || (!isGroup && !receiverUsername)) {
        return res.status(400).json({ message: 'Message content, file, and recipient/groupName are required' });
    }

    let groupId;
    let receiver = null;
    let fileUrl = '';

    if (file) {
        try {
            logger.info(`File received: ${file.originalname}, ${file.mimetype}`);
            const uploadResult = await uploadFile(file, 'messageFiles');
            fileUrl = uploadResult.Location;
        } catch (error) {
            logger.error(`Error uploading file: ${error.message}`);
            return res.status(500).json({ message: 'File upload failed' });
        }
    }

    if (isGroup) {
        try {
            const group = await Group.findOne({ name: groupName, members: { $in: [req.user._id] } });
            if (!group) {
                logger.error(`Group not found or user is not a member. Group Name: ${groupName}, Username: ${req.user.username}`);
                return res.status(404).json({ message: 'Group not found or not a member' });
            }
            groupId = group._id;
        } catch (error) {
            logger.error(`Error fetching group: ${error.message}`);
            return res.status(500).json({ message: 'Server error' });
        }
    } else {
        try {
            receiver = await resolveUsernameToId(receiverUsername);
        } catch (error) {
            logger.error(`Error resolving username to ID: ${error.message}`);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    try {
        let isFriend = false;

        if (!isGroup) {
            const friendship = await Friend.findOne({
                userId: req.user._id,
                friendId: receiver,
                status: 'accepted'
            });

            if (friendship) {
                isFriend = true;
            }
        }

        const messageData = {
            sender: req.user._id,
            message: message || '',
            file: fileUrl,
            isGroupMessage: isGroup,
            groupId: isGroup ? groupId : undefined,
            receiver: !isGroup ? receiver : undefined,
            status: isFriend ? 'sent' : 'delivered'
        };

        const newMessage = new Message(messageData);
        const savedMessage = await newMessage.save();

        req.io.emit('message', savedMessage);

        if (!isGroup && receiver) {
            const receiverUser = await User.findById(receiver);
            const notification = new Notification({
                user: receiver,
                type: 'message_received',
                relatedId: savedMessage._id,
                message: `New message from ${req.user.username}`,
                read: false,
            });
            await notification.save();

            req.io.emit('notification', {
                user: receiverUser.username,
                message: `New message from ${req.user.username}`,
            });
        }

        res.status(201).json(savedMessage);
    } catch (error) {
        logger.error(`Error sending message: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Messages
exports.getMessages = async (req, res) => {
    const { groupName, receiverUsername } = req.query;

    let groupId;
    let receiver = null;

    try {
        if (groupName) {
            const group = await Group.findOne({ name: groupName, members: { $in: [req.user._id] } });
            if (!group) return res.status(404).json({ message: 'Group not found or not a member' });
            groupId = group._id;
        }

        if (receiverUsername) {
            receiver = await resolveUsernameToId(receiverUsername);
        }

        let query = {};

        if (groupId) {
            query = { groupId };
        } else if (receiver) {
            query = {
                $or: [
                    { sender: req.user._id, receiver },
                    { sender: receiver, receiver: req.user._id }
                ]
            };
        }

        const messages = groupId || receiver
            ? await Message.find(query).sort({ createdAt: 1 })
            : await Message.find({
                $or: [
                    { sender: req.user._id },
                    { receiver: req.user._id },
                    { groupId: { $in: await Group.find({ members: req.user._id }).distinct('_id') } }
                ]
            }).sort({ createdAt: 1 });

        const userIds = [...new Set(messages.map(m => [m.sender, m.receiver]).flat())].filter(Boolean);
        const usernames = await getUsernamesByIds(userIds);

        const enrichedMessages = messages.map(message => ({
            ...message._doc,
            senderUsername: usernames[message.sender],
            receiverUsername: message.receiver ? usernames[message.receiver] : null
        }));

        // Marking messages as read
        const unreadMessages = messages.filter(m => m.receiver && m.receiver.toString() === req.user._id.toString() && m.status !== 'read');
        if (unreadMessages.length > 0) {
            await Message.updateMany(
                { _id: { $in: unreadMessages.map(m => m._id) } },
                { status: 'read' }
            );

            // Notify the sender that their message was read
            unreadMessages.forEach(msg => {
                req.io.emit('message_read', { messageId: msg._id, sender: usernames[msg.sender] });
            });
        }

        res.json(enrichedMessages);
    } catch (error) {
        logger.error(`Error fetching messages: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Message Status
exports.updateMessageStatus = async (req, res) => {
    const { messageId, status } = req.body;

    if (!isValidObjectId(messageId) || !['delivered', 'read'].includes(status)) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    try {
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        if (message.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        const friendship = await Friend.findOne({
            userId: message.sender,
            friendId: req.user._id,
            status: 'accepted'
        });

        if (friendship) {
            message.status = status;
            await message.save();

            // Notify the sender that their message was read
            if (status === 'read') {
                req.io.emit('message_read', { messageId: message._id, sender: message.sender });
            }

            res.json(message);
        } else {
            res.status(403).json({ message: 'Cannot update message status for non-friends' });
        }
    } catch (error) {
        logger.error(`Error updating message status: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Message
exports.deleteMessage = async (req, res) => {
    const { messageId } = req.body;

    if (!isValidObjectId(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID' });
    }

    try {
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        const isReceiverSeen = message.status === 'read';

        if (isReceiverSeen) {
            await Message.deleteOne({ _id: messageId, sender: req.user._id });
            res.json({ message: 'Message deleted for sender' });
        } else {
            await Message.deleteOne({ _id: messageId });
            res.json({ message: 'Message deleted for both sender and receiver' });
        }

        req.io.emit('message_deleted', { messageId, sender: req.user.username });

    } catch (error) {
        logger.error(`Error deleting message: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};
