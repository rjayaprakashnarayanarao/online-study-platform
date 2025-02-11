const express = require('express');
require('dotenv').config();
const { syncDatabase } = require('./config/database');
const route = require('./index');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const Rooms = require('./models/rooms.model'); // Import Rooms model
const { searchWikipedia } = require("./wikiSearch");
const { getGeminiTutorResponse } = require("./geminiTutor");

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

const filesHistory = {};

// Store study plans and resources
const studyPlanList = {};

const resourceList = {};

// 🔹 Handle Socket.io Connections
const activeUsers = new Map(); // Map to track active users in each room

const userSocketMap = new Map(); // Maps socket ID to username


io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    const id = socket.id

    try {
        console.log(socket.handshake.query.userId);

    } catch (error) {
        console.log("error:", error.message);

    }

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
            filesHistory[roomCode] = []; // Inititialize files history
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
            console.log("roomid: ", room.dataValues.room_id);

            console.log(`${username} joined room ${roomCode}`);

            // socket.emit("messageHistory", messageHistory[roomCode] || []);
            io.to(roomCode).emit("userJoined", { userName: username, user: socket.id, roomName: room.dataValues.room_name, roomId: room.dataValues.room_id, newMessage: messageHistory[roomCode] || [] });
            io.to(roomCode).emit("messageHistory", messageHistory[roomCode] || [])
            io.to(roomCode).emit("updateUsers", { users: Array.from(activeUsers.get(roomCode)) });
        } catch (error) {
            console.error("Error joining room:", error);
            socket.emit("error", "Failed to join room.");
        }
    });

    // 🔹 User Uploads File (Real-time Sharing)
    // 🔹 User Uploads File (Real-time Sharing)
    socket.on("fileUploaded", (data) => {
        const { roomCode, fileData } = data;

        // Initialize filesHistory[roomCode] as an array if it doesn't exist
        if (!filesHistory[roomCode]) {
            filesHistory[roomCode] = [];
        }

        // Push the new file data into the array
        filesHistory[roomCode].push(fileData);
        console.log("File history: ", filesHistory);

        // Emit the new file upload to the room
        socket.to(roomCode).emit("newFileUpload", fileData);
    });

    // 🔹 User Sends File
    socket.on("sendFile", ({ code, file, userId }) => {
        const roomCode = code;

        // Initialize filesHistory[roomCode] as an array if it doesn't exist
        if (!filesHistory[roomCode]) {
            filesHistory[roomCode] = [];
        }

        // Create a new message object for the file
        const newMessage = { sender: socket.id, file, userId };
        console.log("New file sent: ", newMessage);

        // Push the new file into the filesHistory
        filesHistory[roomCode].push(newMessage.file);
        console.log("File history: ", filesHistory);

        // Emit the new message to the room
        io.to(roomCode).emit("newMessage", newMessage);
    });

    // Handle study plan addition
    socket.on("addStudyPlan", (data) => {
        
        roomCode = data.roomCode
        // Initialize filesHistory[roomCode] as an array if it doesn't exist
        if (!studyPlanList[roomCode]) {
            studyPlanList[roomCode] = [];
        }

        studyPlanList[roomCode].push(data)
        console.log("Study Plan Added:", studyPlanList[roomCode]);
        io.to(roomCode).emit("getStudyPlan",{studyPlanList,roomCode})
    });

    // Handle resource addition

    socket.on("addResource", (data) => {
        roomCode = data.roomCode
        // Initialize resourceList[roomCode] as an array if it doesn't exist
        if (!resourceList[roomCode]) {
            resourceList[roomCode] = [];
        }
        resourceList[roomCode].push(data)
        console.log("Resource Added:", resourceList[roomCode]);
        socket.to(roomCode).emit("getResource",{resourceList,roomCode})
    });

    // 🔹 User Sends Message
    socket.on("sendMessage", ({ code, message, userId }) => {
        const roomCode = code
        if (!messageHistory[roomCode]) return;

        const newMessage = { sender: socket.id, message, userId };
        console.log("New message sent: ", newMessage);

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

// 🔹 Handle AI Tutor Requests
app.post("/tutor", async (req, res) => {
    const { topic, level } = req.body;
    try {
        const wikiSummary = await searchWikipedia(topic);

        console.log("📝 Raw Wikipedia Summary:", wikiSummary);

        // Clean the summary for better rendering
        const cleanSummary = wikiSummary
            .replace(/\n/g, ' ')  // Replace actual newline characters with spaces
            .replace(/{.*?}/g, '')  // Remove LaTeX curly brace expressions
            .replace(/\s{2,}/g, ' ')  // Remove extra spaces
            .trim();  // Trim leading/trailing whitespace

        console.log("📝 Cleaned Wikipedia Summary:", cleanSummary);

        const tutorResponse = await getGeminiTutorResponse(topic, level);

        res.json({
            topic,
            level,
            wikipediaSummary: cleanSummary,
            tutorResponse,
            searchResults: cleanSummary ? [cleanSummary] : []
        });
    } catch (error) {
        console.error("Error in AI Tutor route:", error);
        res.status(500).json({ error: "Something went wrong", searchResults: [] });
    }
});

const axios = require('axios');
// Google Books API Endpoint
app.get('/api/books', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}`;

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);  // Send API response to frontend
    } catch (error) {
        console.error('Error fetching books from Google Books API:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// Route to fetch detailed information for a specific book by ID
app.get('/api/books/:id', async (req, res) => {
    const bookId = req.params.id;
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    const apiUrl = `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${apiKey}`;

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);  // Send book details back to the frontend
    } catch (error) {
        console.error(`Error fetching book details for ID ${bookId}:`, error);
        res.status(500).json({ error: 'Failed to fetch book details' });
    }
});

// 🔹 Start Server
syncDatabase().then(() => {
    console.log('Database is ready!');
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});