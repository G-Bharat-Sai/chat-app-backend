const User = require('../models/User');

// Search Users by Username
exports.searchUsersByUsername = async (req, res) => {
    try {
        const { query } = req.query;
        const users = await User.find({
            username: { $regex: query, $options: 'i' }
        }).limit(10);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get User Profile by Username
exports.getProfileByUsername = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update User Profile by Username
exports.updateProfileByUsername = async (req, res) => {
    try {
        const { name, bio } = req.body;
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (bio) user.bio = bio;

        if (req.file) {
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `profile-pictures/${req.file.originalname}`,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            };
            const uploadResult = await s3.upload(params).promise();
            user.profilePicture = uploadResult.Location;
        }

        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};