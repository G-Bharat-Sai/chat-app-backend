const express = require('express');
const router = express.Router();
const {
    createGroup,
    getGroups,
    updateGroup,
    deleteGroup,
    exitGroup,
    addMemberToGroup, // Include the new addMemberToGroup function
} = require('../controllers/groupController');
const { protectRoute } = require('../middleware/authMiddleware');

// Create a new group
router.post('/', protectRoute, createGroup);

// Get a group by name or all groups if no name is provided
router.get('/:identifier?', protectRoute, getGroups);

// Update a group by name
router.put('/:identifier', protectRoute, updateGroup);

// Delete a group by name
router.delete('/:identifier', protectRoute, deleteGroup);

// Exit a group by name
router.post('/:identifier/exit', protectRoute, exitGroup);

// Add a member to a group
router.post('/:identifier/add-member', protectRoute, addMemberToGroup);

module.exports = router;
