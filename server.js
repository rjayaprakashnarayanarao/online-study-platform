const express = require('express');
require('dotenv').config();
const { syncDatabase } = require('./config/database');
const route = require('./index');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

app.use('/api', route);

// 🔹 Store active rooms, users, and messages
const activeRooms = {};  // Use an object instead of an array
const activeUsers = {};
const messageHistory = {};

// 🔹 Handle Socket.io Connections
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 🔸 Admin Creates Room
    socket.on("createRoom", ({ roomCode, adminName }) => {
        console.log("Create Room Event received. Room Code:", roomCode);

        if (activeRooms[roomCode]) {
            console.log(`Room ${roomCode} already exists.`);
            socket.emit("error", "Room already exists.");
            return;
        }

        activeRooms[roomCode] = { admin: socket.id, users: {} };
        messageHistory[roomCode] = [];

        console.log(`Room ${roomCode} created by ${adminName}`);

        socket.join(roomCode);
        activeRooms[roomCode].users[socket.id] = adminName;

        socket.emit("roomCreated", { roomCode, admin: adminName });

        io.to(roomCode).emit("adminUserJoined", { username: adminName, userId: socket.id });
    });

    // 🔹 User Joins Room
    socket.on("joinRoom", ({ roomCode, username }) => {
        console.log("Join Room Event received. Room Code:", roomCode);

        if (!activeRooms[roomCode]) {
            console.log(`Room ${roomCode} does not exist.`);
            socket.emit("error", "Room does not exist.");
            return;
        }

        socket.join(roomCode);
        activeRooms[roomCode].users[socket.id] = username;

        console.log(`${username} joined room ${roomCode}`);
        // Send the updated user list to all clients
        io.to(roomCode).emit("updateUsers", { users: activeRooms[roomCode].users });

        // Send existing users & message history to the newly joined user
        socket.emit("existingUsers", { users: activeRooms[roomCode].users });
        socket.emit("messageHistory", messageHistory[roomCode]);

        io.to(roomCode).emit("userJoined", { userName:username, user: socket.id });
    });

    // 🔹 User Sends Message
    socket.on("sendMessage", ({ roomCode, message }) => {
        if (!activeRooms[roomCode] || !activeRooms[roomCode].users[socket.id]) return;

        const sender = activeRooms[roomCode].users[socket.id];
        const newMessage = { sender, userId: socket.id, message };

        messageHistory[roomCode].push(newMessage);
        io.to(roomCode).emit("newMessage", newMessage);
    });

    // 🔸 User Disconnects
    socket.on("disconnect", () => {
        for (const roomCode in activeRooms) {
            if (activeRooms[roomCode].users[socket.id]) {
                const isAdmin = activeRooms[roomCode].admin === socket.id;

                delete activeRooms[roomCode].users[socket.id];
                io.to(roomCode).emit("userLeft", socket.id);

                if (isAdmin) {
                    console.log(`Admin ${socket.id} left. Closing room ${roomCode}.`);

                    // Notify all users in the room that the room is closing
                    io.to(roomCode).emit("roomClosed", "The admin has left. Redirecting...");

                    // Remove the room
                    delete activeRooms[roomCode];
                    delete messageHistory[roomCode];
                }
                break;
            }
        }
        console.log("User disconnected:", socket.id);
    });
});

// 🔹 Start Server
syncDatabase().then(() => {
    console.log('Database is ready!');
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});
