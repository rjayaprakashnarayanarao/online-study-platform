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
const multer = require("multer");
const path = require("path");
const File = require("./models/files.model");
const Report = require("./models/report.model")

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 3000;

app.use("/uploads", express.static("uploads")); // Serve uploaded files

// Setup Multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Files stored in the uploads folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage });


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

app.use('/api', route);

app.post("/reportBug", async (req, res) => {
    const { Email, Description } = req.body
    const data = await Report.create({
        Email,
        Description
    })
    res.json(data)
})

// 🔹 Store message history in-memory (can be optimized later)
const messageHistory = {};

const filesHistory = {};

// Store study plans and resources
const studyPlanList = {};

const resourceList = {};

// 🔹 Handle Socket.io Connections
const activeUsers = new Map(); // Map to track active users in each room

const userSocketMap = new Map(); // Maps socket ID to username

const messages = {}; // Example: { roomId: { userId: { type: [{ messageObj }] } } }


io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    const id = socket.id

    try {
        console.log(socket.handshake.query.userId);

    } catch (error) {
        console.log("error:", error.message);

    }

    // Handle file uploads
    // File Upload Endpoint
    app.post("/upload", upload.single("file"), async (req, res) => {
        try {
            const { roomCode, uploader, socket_id, FileName, FileSize } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            const fileData = await File.create({
                socket_id: socket_id, // Set ID to socketId from frontend
                path: `/uploads/${file.filename}`,
                type: file.mimetype,
                uploader: uploader,
                roomCode: roomCode,
                FileName: FileName,
                FileSize: FileSize
            });

            res.status(201).json({ message: "File uploaded successfully", file: fileData });
        } catch (error) {
            console.error("Error uploading file:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    app.get("/getMaterials/:socket_id", async (req, res) => {
        const socket_id = req.params.socket_id
        // console.log("Socket id: ",socket_id);
        const data = await File.findAll({ where: { uploader: socket_id } })
        res.json(data)
    })

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
            // console.log(id);

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
        console.log(`${username} is requesting to join room ${roomCode}`);

        try {
            const room = await Rooms.findOne({ where: { room_id: roomCode } });

            if (!room) {
                console.log(`Room ${roomCode} does not exist.`);
                socket.emit("error", "Room does not exist.");
                return;
            }

            // Get the admin socket ID from the database
            const adminSocketId = room.socket_id;

            // Check if the requesting user is the admin (skip approval if they are)
            if (socket.id === adminSocketId) {
                socket.join(roomCode);
                if (!activeUsers.has(roomCode)) activeUsers.set(roomCode, new Set());
                activeUsers.get(roomCode).add(username);
                socket.emit("joinApproved", { roomCode });
                return;
            }

            // Notify the admin that a user wants to join
            io.to(adminSocketId).emit("userJoinRequest", { username, socketId: socket.id, roomCode });

            // socket.join(roomCode);
            // activeUsers.get(roomCode).add(username); // Store username in the room's user set
            // userSocketMap.set(socket.id, { roomCode, username }); // Store mapping
            // console.log("roomid: ", room.dataValues.room_id);

            // console.log(`${username} joined room ${roomCode}`);

            // // socket.emit("messageHistory", messageHistory[roomCode] || []);
            // io.to(roomCode).emit("messageHistory", messageHistory[roomCode] || [])
            // io.to(roomCode).emit("updateUsers", { users: Array.from(activeUsers.get(roomCode)) });
        } catch (error) {
            console.error("Error joining room:", error);
            socket.emit("error", "Failed to join room.");
        }
    });

    // Handle Admin's Decision
    socket.on("approveUser", async ({ socketId, roomCode, username, approved }) => {
        if (approved) {
            io.to(socketId).emit("joinApproved", { roomCode });
            console.log(`${username} was approved to join room ${roomCode}`);
            const room = await Rooms.findOne({ where: { room_id: roomCode } });

            // Add the user to the active list
            if (!activeUsers.has(roomCode)) activeUsers.set(roomCode, new Set());
            activeUsers.get(roomCode).add(username);

            // Notify the room that a new user has joined
            io.to(roomCode).emit("userJoined", { userName: username, user: socketId, roomName: room.dataValues.room_name, roomId: room.dataValues.room_id, newMessage: messageHistory[roomCode] || [] });

        } else {
            io.to(socketId).emit("joinDenied");
            console.log(`${username} was denied entry to room ${roomCode}`);
        }
    });

    socket.on("finalJoinRoom", ({ roomCode, username, sockerId }) => {
        // Join the user's socket to the room
        socket.join(roomCode);

        // Add username to active users
        if (!activeUsers.has(roomCode)) {
            activeUsers.set(roomCode, new Set());
        }
        activeUsers.get(roomCode).add(username);

        // Update userSocketMap
        userSocketMap.set(sockerId, { roomCode, username });

        console.log(`${username} joined room ${roomCode}`);

        // Notify all clients in the room about the new user and updated list
        io.to(roomCode).emit("userJoined", {
            userName: username,
            user: sockerId,
            newMessage: messageHistory[roomCode] || []
        });
        io.to(roomCode).emit("updateUsers", { users: Array.from(activeUsers.get(roomCode)) });
    });


    socket.on('likeMessage', ({ messageId, userId, type, roomId }) => {
        roomId = Number(roomId);
        console.log("logged all: ", messageId, userId, type, roomId);

        // Ensure the room exists
        if (!messages[roomId]) {
            console.log("Room ID not found, creating:", roomId);
            messages[roomId] = {}; // Create the room
        }

        // Ensure the user exists in the room
        if (!messages[roomId][userId]) {
            console.log("User ID not found, creating:", userId);
            messages[roomId][userId] = {}; // Create the user entry
        }

        // Ensure the type exists for the user
        if (!messages[roomId][userId][type]) {
            console.log("Type not found, creating:", type);
            messages[roomId][userId][type] = []; // Create the message array
        }

        const userMessages = messages[roomId][userId][type];

        console.log("User Messages:", userMessages);

        // Find the message
        let message = userMessages.find(m => m.id === messageId);

        if (!message) {
            console.log("Message not found, creating new message with ID:", messageId);
            message = {
                id: messageId,
                likes: 0,
                dislikes: 0,
                liked: false,
                disliked: false,
                messageType: 'A' // Default messageType to 'A'
            };
            userMessages.push(message); // Add the new message to the list
        }

        console.log("Message Found or Created:", message);

        // Update the like/dislike status
        if (message.messageType === 'A') {
            if (message.liked) {
                message.likes--;
                message.liked = false;
            } else {
                if (message.disliked) {
                    message.dislikes--;
                    message.disliked = false;
                }
                message.likes++;
                message.liked = true;
            }

            console.log("Updated Message:", message);

            // Broadcast update to all users in the room
            io.to(roomId).emit('updateMessage', { messageId, likes: message.likes, dislikes: message.dislikes });
            console.log("Emitted updateMessage event");
        } else {
            console.log("MessageType is not 'A':", message.messageType);
        }
    });

    // Handle dislike event
    socket.on('dislikeMessage', ({ messageId, userId, type, roomId }) => {
        console.log("logged all: ", messageId, userId, type, roomId);

        const userMessages = messages[roomId]?.[userId]?.[type] || [];
        const message = userMessages.find(m => m.id === messageId);

        if (message && message.messageType === 'A') {
            if (message.disliked) {
                message.dislikes--;
                message.disliked = false;
            } else {
                if (message.liked) {
                    message.likes--;
                    message.liked = false;
                }
                message.dislikes++;
                message.disliked = true;
            }
            // Broadcast update to all users in the room
            io.to(roomId).emit('updateMessage', { messageId, likes: message.likes, dislikes: message.dislikes });
        }
        console.log("Got into dislike");
    });

    // 🔹 User Uploads File (Real-time Sharing)
    socket.on("fileUploaded", async (data) => {
        try {
            const { roomCode, fileData } = data;

            const savedFile = await File.findAll({ where: { socket_id: fileData.socket_id } })

            console.log("File stored:", savedFile);

            // Broadcast the new file upload
            io.to(roomCode).emit("newFileUpload", savedFile);
        } catch (error) {
            console.error("Error storing file:", error);
        }
    });

    // Handle audio messages
    socket.on('sendAudioMessage', ({ roomCode, userId, audioData }) => {
        io.to(roomCode).emit('receiveAudioMessage', { roomCode, sender: userId, audioData });
    });

    // // 🔹 User Sends File
    // socket.on("sendMessage", ({ code, message:file, userId }) => {
    //     const roomCode = code;

    //     // Initialize filesHistory[roomCode] as an array if it doesn't exist
    //     if (!filesHistory[roomCode]) {
    //         filesHistory[roomCode] = [];
    //     }

    //     // Create a new message object for the file
    //     const newMessage = { sender: socket.id, file, userId };
    //     console.log("New file sent: ", newMessage);

    //     // Push the new file into the filesHistory
    //     filesHistory[roomCode].push(newMessage.file);
    //     console.log("File history: ", filesHistory);

    //     // Emit the new message to the room
    //     io.to(roomCode).emit("newMessage", newMessage);
    // });

    // Handle study plan addition
    socket.on("addStudyPlan", (data) => {

        roomCode = data.roomCode
        // Initialize filesHistory[roomCode] as an array if it doesn't exist
        if (!studyPlanList[roomCode]) {
            studyPlanList[roomCode] = [];
        }

        studyPlanList[roomCode].push(data)
        console.log("Study Plan Added:", studyPlanList[roomCode]);
        io.to(roomCode).emit("getStudyPlan", { studyPlanList, roomCode })
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
        socket.to(roomCode).emit("getResource", { resourceList, roomCode })
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
            await File.destroy({ where: { socket_id: socket.id } })
        } catch (error) {
            console.error("Error handling disconnect:", error);
        }

        console.log("User disconnected:", socket.id);
    });
});

// Serve uploaded files
app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, "uploads", filename);
    res.sendFile(filepath);
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
const { AsyncLocalStorage } = require('async_hooks');
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