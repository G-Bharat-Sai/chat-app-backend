const io = require('socket.io-client');
const socket = io('http://localhost:5000'); // Adjust the URL to your server

socket.on('connect', () => {
    console.log('Connected to server');

    // Send a test message
    socket.emit('message', { content: 'Hello, World!' });

    // Listen for messages
    socket.on('message', (data) => {
        console.log('Received message:', data);
    });

    // Send a test notification
    socket.emit('notification', { content: 'New notification!' });

    // Listen for notifications
    socket.on('notification', (data) => {
        console.log('Received notification:', data);
    });
});
