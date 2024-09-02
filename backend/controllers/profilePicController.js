// controllers/profilePicController.js
const User = require('../models/User');
const ProfilePic = require('../models/profilePic');
const aws = require('aws-sdk');

// Configure AWS SDK for S3
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Upload Profile Picture
exports.uploadProfilePicture = async (req, res) => {
    console.log('Request file:', req.file);
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileContent = Buffer.from(req.file.buffer, 'binary');
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `profile_pictures/${user._id}-${Date.now()}-${req.file.originalname}`,
            Body: fileContent,
            ContentType: req.file.mimetype,
        };

        const data = await s3.upload(params).promise();

        // Save profile picture URL to ProfilePic model
        let profilePic = await ProfilePic.findOneAndUpdate(
            { user: user._id },
            { url: data.Location },
            { new: true, upsert: true } // Create if not exists
        );

        user.profilePicture = profilePic.url;
        await user.save();

        res.json({ profilePicture: profilePic.url });
    } catch (error) {
        console.error('Failed to upload profile picture:', error.message);
        res.status(500).json({ message: 'Failed to upload profile picture: ' + error.message });
    }
};

// Get Profile Picture
exports.getProfilePicture = async (req, res) => {
    try {
        const profilePic = await ProfilePic.findOne({ user: req.params.id });

        if (!profilePic) {
            return res.status(404).json({ message: 'Profile picture not found' });
        }

        res.json({ profilePicture: profilePic.url });
    } catch (error) {
        console.error('Failed to retrieve profile picture:', error.message);
        res.status(500).json({ message: 'Failed to retrieve profile picture: ' + error.message });
    }
};

// Get Profile Picture by Username
exports.getProfilePictureByUsername = async (req, res) => {
    const { username } = req.params;

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find profile picture by user ID
        const profilePic = await ProfilePic.findOne({ user: user._id });
        if (!profilePic) {
            return res.status(404).json({ message: 'Profile picture not found' });
        }

        res.json({ profilePicture: profilePic.url });
    } catch (error) {
        console.error('Failed to retrieve profile picture:', error.message);
        res.status(500).json({ message: 'Failed to retrieve profile picture: ' + error.message });
    }
};
