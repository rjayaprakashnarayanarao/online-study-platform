const express = require('express');
require('dotenv').config();
const { syncDatabase } = require('./config/database');
const route = require('./index');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const Rooms = require('./models/rooms.model'); // Import Rooms model

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

// 🔹 Store message history in-memory (can be optimized later)
const messageHistory = {};

// 🔹 Handle Socket.io Connections
const activeUsers = new Map(); // Map to track active users in each room

const userSocketMap = new Map(); // Maps socket ID to username


io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    const id = socket.id

    // 🔸 Admin Creates Room
    socket.on("createRoom", async ({ roomCode, adminName }) => {
        console.log("Create Room Event received. Room Code:", roomCode);

        try {
            // Check if room already exists
            const existingRoom = await Rooms.findOne({ where: { room_id: roomCode } });

            if (!existingRoom) {
                console.log(`Room ${roomCode} already exists.`);
                socket.emit("error", "Room already exists.");
                return;
            }

            await Rooms.update(
                { socket_id: id }, // Update field
                { where: { room_id: roomCode } } // Condition
            );
            console.log(id);

            messageHistory[roomCode] = []; // Initialize message history
            activeUsers.set(roomCode, new Set()); // Initialize active users set

            console.log(`Room ${roomCode} created by ${adminName}`);

            socket.join(roomCode);
            activeUsers.get(roomCode).add(adminName);

            // Emit success event
            socket.emit("roomCreated", { user: socket.id, username: adminName });
            io.to(roomCode).emit("adminUserJoined", { username: adminName, userId: socket.id });
            io.to(roomCode).emit("updateUsers", { users: Array.from(activeUsers.get(roomCode)) });
        } catch (error) {
            console.error("Error creating room:", error);
            socket.emit("error", "Failed to create room.");
        }
    });

    // 🔹 User Joins Room
    socket.on("joinRoom", async ({ roomCode, username }) => {
        console.log("Join Room Event received. Room Code:", roomCode);
    
        try {
            const room = await Rooms.findOne({ where: { room_id: roomCode } });
    
            if (!room) {
                console.log(`Room ${roomCode} does not exist.`);
                socket.emit("error", "Room does not exist.");
                return;
            }
    
            socket.join(roomCode);
            activeUsers.get(roomCode).add(username); // Store username in the room's user set
            userSocketMap.set(socket.id, { roomCode, username }); // Store mapping
    
            console.log(`${username} joined room ${roomCode}`);
    
            socket.emit("messageHistory", messageHistory[roomCode] || []);
            io.to(roomCode).emit("userJoined", { userName: username, user: socket.id });
            io.to(roomCode).emit("updateUsers", { users: Array.from(activeUsers.get(roomCode)) });
        } catch (error) {
            console.error("Error joining room:", error);
            socket.emit("error", "Failed to join room.");
        }
    });
    

    // 🔹 User Sends Message
    socket.on("sendMessage", ({ code, message, userId }) => {
        const roomCode = code
        if (!messageHistory[roomCode]) return;

        const newMessage = { sender: socket.id, message ,userId};
        console.log("New message sent: ",newMessage);
        
        messageHistory[roomCode].push(newMessage);
        io.to(roomCode).emit("newMessage", newMessage);
    });

    // 🔸 User Disconnects
    socket.on("disconnect", async () => {
        try {
            // Check if the disconnected user is an admin
            const room = await Rooms.findOne({ where: { socket_id: socket.id } });
    
            if (room) {
                const roomCode = room.room_id;
    
                console.log(`Admin ${socket.id} left. Closing room ${roomCode}.`);
    
                io.to(roomCode).emit("roomClosed", "The admin has left. Redirecting...");
    
                // Delete room from database
                await Rooms.destroy({ where: { room_id: roomCode } });
    
                // Remove message history and active users
                delete messageHistory[roomCode];
                activeUsers.delete(roomCode);
            } else {
                // Handle regular user disconnect
                const userInfo = userSocketMap.get(socket.id);
    
                if (userInfo) {
                    const { roomCode, username } = userInfo;
    
                    if (activeUsers.has(roomCode)) {
                        activeUsers.get(roomCode).delete(username); // Remove the user by username
    
                        // Notify others in the room
                        io.to(roomCode).emit("userLeft", socket.id);
                        io.to(roomCode).emit("updateUsers", { users: Array.from(activeUsers.get(roomCode)) });
    
                        console.log(`User ${username} left room ${roomCode}`);
                    }
    
                    // Remove mapping
                    userSocketMap.delete(socket.id);
                }
            }
        } catch (error) {
            console.error("Error handling disconnect:", error);
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