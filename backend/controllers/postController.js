const Post = require('../models/Post');
const { uploadFile } = require('../utils/s3Upload');
const User = require('../models/User');
const Friend = require('../models/Friend');

// Create a post
exports.createPost = async (req, res) => {
    try {
        const { caption, hideFromUsers } = req.body;
        let image = null, video = null;

        // Check if files are included in the request
        if (req.files) {
            if (req.files.image && req.files.image.length > 0) {
                const uploadResult = await uploadFile(req.files.image[0], 'postImages');
                image = uploadResult.Location;
            }
            if (req.files.video && req.files.video.length > 0) {
                const uploadResult = await uploadFile(req.files.video[0], 'postVideos');
                video = uploadResult.Location;
            }
        }

        // Create new post
        const newPost = new Post({
            user: req.user._id,
            image,
            video,
            caption,
            hiddenFrom: hideFromUsers || [],
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error); // Log the full error for debugging
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get posts
exports.getPosts = async (req, res) => {
    try {
        const { username } = req.query;

        let user;
        if (username) {
            user = await User.findOne({ username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
        } else {
            user = req.user;
        }

        // Check friendship status if user is not the current user
        if (user._id.toString() !== req.user._id.toString()) {
            const isFriend = await Friend.findOne({
                $or: [
                    { userId: req.user._id, friendId: user._id, status: 'accepted' },
                    { userId: user._id, friendId: req.user._id, status: 'accepted' }
                ]
            });

            if (!isFriend) {
                return res.status(403).json({ message: 'You are not friends with this user' });
            }
        }

        // Fetch posts
        const posts = await Post.find({
            user: user._id,
            hiddenFrom: { $ne: req.user.username }
        }).populate('user', 'username').sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error); // Log the full error for debugging
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Like a post
exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post.likes.includes(req.user._id)) {
            post.likes.push(req.user._id);
            await post.save();
        }

        res.status(200).json(post);
    } catch (error) {
        console.error('Error liking post:', error); // Log the full error for debugging
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Comment on a post
exports.commentOnPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        const newComment = {
            user: req.user._id,
            text: req.body.text,
        };

        post.comments.push(newComment);
        await post.save();

        res.status(200).json(post);
    } catch (error) {
        console.error('Error commenting on post:', error); // Log the full error for debugging
        res.status(500).json({ message: 'Server Error', error });
    }
};
