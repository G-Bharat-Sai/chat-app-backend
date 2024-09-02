const Group = require('../models/Group');
const User = require('../models/User');
const Friend = require('../models/Friend');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Utility function to validate MongoDB ObjectIDs
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to get user IDs from usernames
const getUserIdsFromUsernames = async (usernames) => {
    const users = await User.find({ username: { $in: usernames } });
    if (users.length !== usernames.length) {
        throw new Error('One or more usernames are invalid');
    }
    return users.map(user => user._id);
};

// Helper function to format group data
const formatGroupData = async (group) => {
    const creator = await User.findById(group.creator);
    const members = await User.find({ _id: { $in: group.members } });

    return {
        name: group.name,
        creator: creator.username,
        members: members.map(member => member.username),
    };
};

// Helper function to check if two users are friends
const areUsersFriends = async (userId, friendId) => {
    const friendship = await Friend.findOne({
        $or: [
            { userId: userId, friendId: friendId, status: 'accepted' },
            { userId: friendId, friendId: userId, status: 'accepted' }
        ]
    });
    return !!friendship;
};

// Create Group
exports.createGroup = async (req, res) => {
    const { name, members } = req.body;

    if (!name || !members || !Array.isArray(members)) {
        return res.status(400).json({ message: 'Group name and valid members are required' });
    }

    try {
        // Convert usernames to user IDs
        const memberIds = await getUserIdsFromUsernames(members);

        // Ensure all members are friends of the creator
        const creatorId = req.user._id;
        const invalidMembers = [];

        for (const memberId of memberIds) {
            if (!(await areUsersFriends(creatorId, memberId))) {
                invalidMembers.push(memberId);
            }
        }

        if (invalidMembers.length > 0) {
            return res.status(400).json({ message: 'All members must be friends of the creator' });
        }

        // Include the creator in the members array
        if (!memberIds.includes(creatorId)) {
            memberIds.push(creatorId);
        }

        const group = new Group({
            name,
            members: memberIds,
            creator: creatorId,
        });
        const createdGroup = await group.save();
        const formattedGroup = await formatGroupData(createdGroup);

        // Emit group creation notification
        req.io.emit('notification', {
            user: req.user.username,
            message: `Group "${name}" has been created.`,
        });

        // Send notifications to group members
        for (const memberId of memberIds) {
            const memberUser = await User.findById(memberId);
            const notification = new Notification({
                user: memberId,
                type: 'group_created',
                relatedId: createdGroup._id,
                message: `You have been added to the group "${name}" by ${req.user.username}`,
                read: false,
            });
            await notification.save();

            req.io.emit('notification', {
                user: memberUser.username,
                message: `You have been added to the group "${name}" by ${req.user.username}`,
            });
        }

        res.status(201).json(formattedGroup);
    } catch (error) {
        logger.error(`Error creating group: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Groups or Group by Name
exports.getGroups = async (req, res) => {
    const groupName = req.params.identifier || '';

    try {
        const query = groupName
            ? { name: groupName.trim(), members: { $in: [req.user._id] } }
            : { members: { $in: [req.user._id] } };

        const groups = await Group.find(query);
        if (groupName && groups.length === 0) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const formattedGroups = await Promise.all(groups.map(group => formatGroupData(group)));
        res.json(formattedGroups);
    } catch (error) {
        logger.error(`Error fetching groups: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Group by Name
exports.updateGroup = async (req, res) => {
    const { identifier } = req.params;
    const { name, members } = req.body;

    if (!name && !members) {
        return res.status(400).json({ message: 'Group name or members must be provided' });
    }

    try {
        const group = await Group.findOne({ name: identifier });
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const memberIds = members ? await getUserIdsFromUsernames(members) : group.members;
        const creatorId = req.user._id;

        const invalidMembers = [];
        for (const memberId of memberIds) {
            if (!(await areUsersFriends(creatorId, memberId))) {
                invalidMembers.push(memberId);
            }
        }

        if (invalidMembers.length > 0) {
            return res.status(400).json({ message: 'All members must be friends of the creator' });
        }

        if (!memberIds.includes(creatorId)) {
            memberIds.push(creatorId);
        }

        if (name) group.name = name;
        if (members) group.members = memberIds;

        const updatedGroup = await group.save();
        const formattedGroup = await formatGroupData(updatedGroup);

        // Emit group update notification
        req.io.emit('notification', {
            user: req.user.username,
            message: `Group "${group.name}" has been updated.`,
        });

        // Send notifications to group members about the update
        for (const memberId of memberIds) {
            const memberUser = await User.findById(memberId);
            const notification = new Notification({
                user: memberId,
                type: 'group_updated',
                relatedId: updatedGroup._id,
                message: `The group "${group.name}" has been updated by ${req.user.username}`,
                read: false,
            });
            await notification.save();

            req.io.emit('notification', {
                user: memberUser.username,
                message: `The group "${group.name}" has been updated by ${req.user.username}`,
            });
        }

        res.json(formattedGroup);
    } catch (error) {
        logger.error(`Error updating group: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Group by Name
exports.deleteGroup = async (req, res) => {
    const { identifier } = req.params;

    try {
        const group = await Group.findOne({ name: identifier });
        if (!group) return res.status(404).json({ message: 'Group not found' });

        await Group.deleteOne({ _id: group._id });

        // Emit group deletion notification
        req.io.emit('notification', {
            user: req.user.username,
            message: `Group "${group.name}" has been deleted.`,
        });

        // Send notifications to group members about the deletion
        for (const memberId of group.members) {
            const memberUser = await User.findById(memberId);
            const notification = new Notification({
                user: memberId,
                type: 'group_deleted',
                relatedId: group._id,
                message: `The group "${group.name}" has been deleted by ${req.user.username}`,
                read: false,
            });
            await notification.save();

            req.io.emit('notification', {
                user: memberUser.username,
                message: `The group "${group.name}" has been deleted by ${req.user.username}`,
            });
        }

        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting group: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Exit Group by Name
exports.exitGroup = async (req, res) => {
    const { identifier } = req.params;
    const userId = req.user._id;

    try {
        const group = await Group.findOne({ name: identifier });
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if the user is a member of the group
        if (!group.members.includes(userId)) {
            return res.status(400).json({ message: 'You are not a member of this group' });
        }

        // Remove the user from the group's members array
        group.members = group.members.filter(memberId => !memberId.equals(userId));

        // If the user was the last member, delete the group
        if (group.members.length === 0) {
            await Group.deleteOne({ _id: group._id });
            return res.json({ message: `You were the last member, so the group "${group.name}" has been deleted.` });
        }

        // If the user was the creator and they leave, transfer ownership
        if (group.creator.equals(userId)) {
            group.creator = group.members[0]; // Transfer ownership to the first remaining member
        }

        const updatedGroup = await group.save();
        const formattedGroup = await formatGroupData(updatedGroup);

        // Emit group exit notification
        req.io.emit('notification', {
            user: req.user.username,
            message: `You have exited the group "${group.name}".`,
        });

        res.json({ message: `You have exited the group "${group.name}".`, group: formattedGroup });
    } catch (error) {
        logger.error(`Error exiting group: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add Member to Group
exports.addMemberToGroup = async (req, res) => {
    const { identifier } = req.params;
    const { newMemberUsername } = req.body;

    if (!newMemberUsername) {
        return res.status(400).json({ message: 'New member username is required' });
    }

    try {
        const group = await Group.findOne({ name: identifier });
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if the new member is already in the group
        const newMember = await User.findOne({ username: newMemberUsername });
        if (!newMember) return res.status(404).json({ message: 'User not found' });
        if (group.members.includes(newMember._id)) {
            return res.status(400).json({ message: 'User is already a member of the group' });
        }

        // Check if the new member is a friend of the creator
        const creatorId = group.creator;
        if (!(await areUsersFriends(creatorId, newMember._id))) {
            return res.status(400).json({ message: 'New member must be a friend of the group creator' });
        }

        // Add the new member to the group
        group.members.push(newMember._id);
        const updatedGroup = await group.save();
        const formattedGroup = await formatGroupData(updatedGroup);

        // Emit group update notification
        req.io.emit('notification', {
            user: req.user.username,
            message: `User "${newMember.username}" has been added to the group "${group.name}".`,
        });

        // Send notification to the new member
        const notification = new Notification({
            user: newMember._id,
            type: 'group_member_added',
            relatedId: updatedGroup._id,
            message: `You have been added to the group "${group.name}" by ${req.user.username}`,
            read: false,
        });
        await notification.save();

        req.io.emit('notification', {
            user: newMember.username,
            message: `You have been added to the group "${group.name}" by ${req.user.username}`,
        });

        res.json(formattedGroup);
    } catch (error) {
        logger.error(`Error adding member to group: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};
