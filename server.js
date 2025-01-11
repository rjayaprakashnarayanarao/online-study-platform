const express = require('express');
require('dotenv').config();
const { syncDatabase } = require('./config/database');
const route = require('./index');
const port = process.env.PORT;
const cors = require('cors');
const http = require('http'); // Import HTTP for server creation
const socketIo = require('socket.io'); // Import socket.io

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = socketIo(server); // Attach socket.io to the server

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

app.use('/api', route);

// Socket.io configuration
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Handle create room
    socket.on("createRoom", (data) => {
        const { creatorName, roomName, roomType } = data;

        console.log(`Room created by ${creatorName}: ${roomName} (${roomType})`);

        // Join the socket to the room
        socket.join(roomName);

        // Broadcast the new room to others (if needed)
        socket.broadcast.emit("newRoom", { roomName, creatorName, roomType });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Sync the database and start the server
syncDatabase().then(() => {
    console.log('Database is ready!');
    server.listen(port, () => { // Use the server instance here
        console.log(`Server is running on port ${port}`);
    });
});
