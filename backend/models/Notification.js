const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: [
            'like',
            'comment',
            'view',
            'friend_request',
            'friend_request_accepted',
            'friend_request_rejected',
            'group_created',
            'group_updated',
            'group_deleted',
            'message_received',
            'group_member_added' 
        ],
        required: true,
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
