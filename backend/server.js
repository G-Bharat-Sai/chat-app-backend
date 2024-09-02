require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const http = require('http'); // Import http module
const socketIo = require('socket.io'); // Import socket.io
const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendRoutes');
const groupRoutes = require('./routes/groupRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const postRoutes = require('./routes/postRoutes');
const profilePicRoutes = require('./routes/profilePicRoutes');
const userRoutes = require('./routes/userRoutes'); // Import user routes

const app = express();
const server = http.createServer(app); // Create HTTP server with Express app
const io = socketIo(server); // Attach Socket.io to the HTTP server

// Socket.io setup
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('message', (data) => {
        console.log('Message received:', data);
        io.emit('message', data);
    });

    socket.on('notification', (data) => {
        console.log('Notification received:', data);
        io.emit('notification', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Middleware
app.use(bodyParser.json());
app.use(cookieParser()); // Middleware to parse cookies

// Attach io to req
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/friends', friendRoutes);
app.use('/groups', groupRoutes);
app.use('/messages', messageRoutes);
app.use('/notifications', notificationRoutes);
app.use('/posts', postRoutes);
app.use('/profile-pictures', profilePicRoutes);
app.use('/users', userRoutes); // Use user routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Server setup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
