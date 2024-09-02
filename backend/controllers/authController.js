const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

// Create rate limiter for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: "Too many login attempts from this IP, please try again later."
});

// Create rate limiter for password reset
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: "Too many password reset requests from this IP, please try again later."
});

const generateToken = (userId, expiresIn = JWT_EXPIRE) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
};

const parseDuration = (duration) => {
    const match = duration.match(/(\d+)([a-z]+)/);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case 'd': return value * 24 * 60 * 60 * 1000; // days to milliseconds
        case 'h': return value * 60 * 60 * 1000; // hours to milliseconds
        case 'm': return value * 60 * 1000; // minutes to milliseconds
        case 's': return value * 1000; // seconds to milliseconds
        default: return 0;
    }
};

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create the user object; password will be hashed internally
        const user = new User({ username, email, password });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        logger.error(`Error during user registration: ${error.message}`);
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.login = [loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });

        // Check if user exists
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        // Use the instance method to compare the passwords
        const isMatch = await user.comparePassword(password);

        // If passwords don't match, return an error
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        // Generate JWT tokens
        const accessToken = generateToken(user._id);
        const refreshToken = generateToken(user._id, JWT_REFRESH_EXPIRE);

        // Set the refresh token as a cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: parseDuration(JWT_REFRESH_EXPIRE) // Convert duration to milliseconds
        });

        // Respond with the access token
        res.status(200).json({ accessToken });
    } catch (error) {
        logger.error(`Error during user login: ${error.message}`);
        res.status(500).json({ message: 'Server error', error });
    }
}];

exports.forgotPassword = [forgotPasswordLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const resetToken = generateToken(user._id, '15m');
        res.status(200).json({ resetToken });
    } catch (error) {
        logger.error(`Error during password reset request: ${error.message}`);
        res.status(500).json({ message: 'Server error', error });
    }
}];

exports.resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        const decoded = jwt.verify(resetToken, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        // Only hash and save the password if it has been modified
        if (newPassword) {
            user.password = newPassword;
            await user.save();
        }

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        logger.error(`Error during password reset: ${error.message}`);
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return res.status(401).json({ message: 'No token provided' });

        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ message: 'Invalid token' });

        const accessToken = generateToken(user._id);
        res.status(200).json({ accessToken });
    } catch (error) {
        logger.error(`Error during token refresh: ${error.message}`);
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    });
    res.status(200).json({ message: 'Logged out successfully' });
};
