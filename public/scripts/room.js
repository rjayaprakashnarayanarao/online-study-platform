// Add the msg functions here
let messages = [];
var roomCode;
var username;
const userButtons = {};
const socket = io("http://localhost:3000"); // Replace with your backend URL

function setUserName(name){
    username = name;
}

function getUserName(){
    return username;
}

function setRoomCode(code){
    roomCode = code;
}

function getRoomCode(){
    return roomCode;
}

// added audio recording functionality
let isRecording = false;
let mediaRecorder;
let audioChunks = [];

// function to work as on/off switch for recording
function toggleRecording() {
    // check if user has selected a message type
    const messageType = document.querySelector('input[name="message-type"]:checked');
    if (!messageType) {
        alert('Please select a message type (Q or A)');
        return;
    }
    // Toggle recording
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// function to start recording
function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            isRecording = true;
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = [];
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.controls = true;
                document.getElementById('messages').appendChild(audio);
                // You can send the audioBlob to the server here
            };
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
        });
}

// function to stop recording
function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
}

// Function to open the chat popup
function openPopup(userId, type) {
    const popup = document.getElementById('popup');
    const chatContainer = document.getElementById('chat-container');
    const infoContainer = document.getElementById('info-container');
    const popupTitle = document.getElementById('popup-title');
    const messagesContainer = document.getElementById('messages');

    popup.classList.remove('hidden');
    popup.setAttribute('data-user-id', userId);
    popup.setAttribute('data-type', type);

    // Set popup title based on type
    switch (type) {
        case 'chat':
            popupTitle.textContent = 'Rocket Chat';
            chatContainer.style.display = 'flex';
            infoContainer.style.display = 'none';
            break;
        case 'info':
            popupTitle.textContent = 'User Information';
            chatContainer.style.display = 'none';
            infoContainer.style.display = 'block';
            break;
    }

    // Display the messages for the selected user and option
    renderMessages(userId, type);
}

// Function to close the popup
function closePopupBox() {
    const popup = document.getElementById('popup');
    popup.classList.add('hidden');
}

// Function to send a message
function sendMessage(event) {
    event.preventDefault();

    const input = document.getElementById('message-input');
    const text = input.value.trim();
    const userId = document.getElementById('popup').getAttribute('data-user-id');
    const type = document.getElementById('popup').getAttribute('data-type');

    if (!text && audioChunks.length === 0) return;

    // Get the selected message type (Q or A)
    const messageType = document.querySelector('input[name="message-type"]:checked');
    if (!messageType) {
        alert('Please select a message type (Q or A)');
        return;
    }
    
    const message = {
        id: Date.now(),
        text: text,
        sender: getUserName(),
        timestamp: new Date().toLocaleTimeString(),
        messageType: messageType.value,
        likes: 0
    };

    // Check if the message is text or audio
    if (text) {
        message.text = text;
    } else if (audioChunks.length > 0) {
        // Process voice message
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        message.audioUrl = audioUrl;
        audioChunks = []; // Clear the audio chunks after processing
    } else {
        return; // No valid message content
    }

    const code = getRoomCode()
    // Emit the message to the server
    socket.emit('sendMessage', { code, userId, message });
    
}


// Function to like a message
function likeMessage(messageId, userId, type) {
    const userMessages = messages[userId][type];
    const message = userMessages.find(m => m.id === messageId);
    if (message && message.messageType === 'A') { // Only allow liking answers
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
        renderMessages(userId, type);
    }
}

// Function to dislike a message
function dislikeMessage(messageId, userId, type) {
    const userMessages = messages[userId][type];
    const message = userMessages.find(m => m.id === messageId);
    if (message && message.messageType === 'A') { // Only allow disliking answers
        if (message.disliked) {
            message.dislikes--;
            message.disliked = false;
        } else {
            if (message.liked) {
                message.likes--;
                message.liked = false;
            }
            if (!message.dislikes) {
                message.dislikes = 0;
            }
            message.dislikes++;
            message.disliked = true;
        }
        renderMessages(userId, type);
    }
}

// Function to render messages for a specific user and option
function renderMessages(userId, type) {
    console.log("renderMessage: ",userId,type);
    
    const messagesContainer = document.getElementById('messages');
    const userMessages = messages[userId] && messages[userId][type] ? messages[userId][type] : [];

    messagesContainer.innerHTML = ''; // Clear previous messages

    if (userMessages.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.id = 'chat-placeholder';
        placeholder.className = 'chat-placeholder';
        placeholder.textContent = 'Users are required to select Q (Question) for inquiries or clarification or A (Answer) for responses or explanations before sending a message. This ensures clear, structured, and efficient communication.';
        messagesContainer.appendChild(placeholder);
    } else {
        userMessages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';

            const likeButton = message.messageType === 'A'
                ? `<button class="like-button" onclick="likeMessage(${message.id}, '${userId}', '${type}')">
                     <i class="fas fa-thumbs-up"></i>
                     <span class="like-count">${message.likes}</span>
                   </button>`
                : '';

            const dislikeButton = message.messageType === 'A'
                ? `<button class="dislike-button" onclick="dislikeMessage(${message.id}, '${userId}', '${type}')">
                    <i class="fas fa-thumbs-down"></i>
                    <span class="dislike-count">${message.dislikes || 0}</span>
                </button>`
                : '';

            messageDiv.innerHTML = `
                <div class="message-header">
                    <div class="left">
                        <span class="message-sender">${message.sender}</span>
                        <span class="message-type message-type-${message.messageType}">${message.messageType}</span>
                    </div>
                    <span class="message-time">${message.timestamp}</span>
                </div>
                 <div class="message-content">
                    ${message.text ? `<p class="message-text">${message.text}</p>` : ''}
                    ${message.audioUrl ? `<audio controls src="${message.audioUrl}"></audio>` : ''}
                    ${likeButton}
                    ${dislikeButton}
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
            console.log('Messages:', messages);
            console.log('Audio Chunks Cleared:', audioChunks);
        });
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    document.querySelector('.close-button').addEventListener('click', closePopupBox);
});

// Function to get URL parameter by name
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Function to close the popup card
function closePopup() {
    document.getElementById('popup-card').style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Function to show the popup card
function showPopup() {
    document.getElementById('popup-card').style.display = 'block';
    document.body.classList.add('modal-open');
}

// Example user data
let users = [
    // { id: 'user1', name: 'Jaya Prakash' }
];

// Function to populate user details
function populateUserDetails() {
    const userDetailsContainer = document.getElementById('user-details-container');
    userDetailsContainer.innerHTML = ''; // Clear existing user details

    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'single-user';
        userDiv.innerHTML = `
            <p>${user.name}</p>
            <div class="user-options">
                <button class="user-info" onclick="openPopup('${user.id}', 'info')"><i class="fa-solid fa-info"></i></button>
                <button class="chat-box" onclick="openPopup('${user.id}', 'chat')"><i class="fa-brands fa-rocketchat"></i></button>
            </div>
        `;
        userDetailsContainer.appendChild(userDiv);
    });
}

// Open the upload popup
function openUploadPopup() {
    document.getElementById("upload-popup").classList.remove("hidden");
}

// Close the upload popup
function closeUploadPopup() {
    document.getElementById("upload-popup").classList.add("hidden");
}

// Switch between tabs
function switchUploadTab(tabName) {
    const sections = ["materials", "study-plan", "resources"];
    sections.forEach((section) => {
        document.getElementById(`upload-${section}`).classList.add("hidden");
        document.querySelector(`.upload-tab[onclick="switchUploadTab('${section}')"]`).classList.remove("active");
    });
    
    document.getElementById(`upload-${tabName}`).classList.remove("hidden");
    document.querySelector(`.upload-tab[onclick="switchUploadTab('${tabName}')"]`).classList.add("active");
}

// Handle file upload
document.getElementById("upload-materials-input").addEventListener("change", function() {
    document.getElementById("upload-materials-message").classList.remove("hidden");
});

// Add study plan entry
function addStudyPlan() {
    const unitName = document.getElementById("study-unit-name").value;
    const studyTime = document.getElementById("study-time").value;

    if (unitName && studyTime) {
        const formattedTime = formatTime(studyTime); // Convert to 12-hour format
        const studyPlanList = document.getElementById("study-plan-list");
        const entry = document.createElement("p");
        entry.textContent = `${unitName} - ${formattedTime}`;
        studyPlanList.prepend(entry);

        document.getElementById("study-unit-name").value = "";
        document.getElementById("study-time").value = "";
    }
}

// Convert 24-hour time to 12-hour format
function formatTime(time) {
    let [hour, minute] = time.split(":");
    let period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // Convert 0 to 12 for AM
    return `${hour}:${minute} ${period}`;
}

// Add resource entry
function addResource() {
    const link = document.getElementById("resource-link").value;
    const description = document.getElementById("resource-description").value;

    if (link && description) {
        const resourceList = document.getElementById("resource-list");
        const entry = document.createElement("p");
        entry.innerHTML = `<a href="${link}" target="_blank">${description}</a>`;
        resourceList.prepend(entry);

        document.getElementById("resource-link").value = "";
        document.getElementById("resource-description").value = "";
    }
}

// Attach the popup open function to the Upload button
document.querySelector(".upload-button").addEventListener("click", function(event) {
    event.preventDefault(); // Prevent redirection
    openUploadPopup();
});

// Handle file upload
document.getElementById("upload-materials-input").addEventListener("change", function(event) {
    const files = event.target.files;
    const materialsList = document.getElementById("materials-list");
    const message = document.getElementById("upload-materials-message");

    if (files.length > 0) {
        message.classList.remove("hidden");
        materialsList.innerHTML = ""; // Clear previous list

        // Loop through uploaded files and display them
        Array.from(files).forEach(file => {
            const listItem = document.createElement("p");
            listItem.innerHTML = `<a href="#" onclick="alert('File: ${file.name}')">${file.name}</a>`;
            materialsList.appendChild(listItem);
        });

        // Hide message after 3 seconds
        setTimeout(() => {
            message.classList.add("hidden");
        }, 3000);
    }
});



// Show popup card on page load
window.onload = async function () {
    let data = getQueryParam("data"); // Fetch encrypted data from URL

    if (data) {
        try {
            const decryptedData = await decryptData(data);
            if (decryptedData) {
                console.log("Decrypted Data:", decryptedData);

                let hasRoomName = false;
                let hasRoomId = false;

                // Update only if values exist
                if (decryptedData.room_name) {
                    document.getElementById('room-name').textContent = decryptedData.room_name;
                    hasRoomName = true;
                }
                if (decryptedData.room_id) {
                    document.getElementById('room-number').textContent = decryptedData.room_id;
                    hasRoomId = true;
                }

                // Show popup only if both values exist
                if (hasRoomName && hasRoomId) {
                    showPopup();
                }

            } else {
                console.log("Decryption failed. Invalid data.");
                closePopup();
            }
        } catch (error) {
            console.error("Error decrypting data:", error);
            closePopup();
        }
    } else {
        console.log("No encrypted data found in URL.");
        closePopup();
    }

    // Copy Room Number Functionality
    document.querySelectorAll('.fa-copy').forEach((icon) => {
        icon.addEventListener('click', () => {
            const textarea = document.createElement('textarea');
            textarea.value = document.getElementById('room-number').textContent;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            console.log('Room number copied to clipboard!');
        });
    });

    // Update sharing links dynamically
    updateShareLinks();
};


// Share options functionality
document.addEventListener('DOMContentLoaded', () => {
    const shareIcon = document.getElementById('share-icon');
    const shareOptions = document.getElementById('share-options');

    shareIcon?.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent click event from propagating
        // Toggle the display of the share options menu
        if (shareOptions.style.display === 'block') {
            shareOptions.style.display = 'none';
        } else {
            shareOptions.style.display = 'block';
        }
    });

    // Close the share options menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!shareIcon?.contains(event.target) && !shareOptions?.contains(event.target)) {
            shareOptions.style.display = 'none';
        }
    });

    // Add an event listener to the close button
    document.querySelector('.close-popup')?.addEventListener('click', () => {
        closePopup();
    });

    // Add an event listener to the Details button
    document.querySelector('.details-button')?.addEventListener('click', () => {
        showPopup();
    });

    // Populate user details
    populateUserDetails();

    // Start the room timer
    startRoomTimer();
});


// Toggle hidden grid content
function toggleHiddenGrid(section) {
    const hiddenGrid = document.querySelector('.hidden-grid');
    const materialsContent = document.querySelector('.materials-content');
    const studyPlanContent = document.querySelector('.study-plan-content');
    const resourcesContent = document.querySelector('.resources-content');

    // Hide all content
    materialsContent?.classList.add('hidden');
    studyPlanContent?.classList.add('hidden');
    resourcesContent?.classList.add('hidden');

    // Show the selected content and ensure hidden grid is visible
    switch (section) {
        case 'materials':
            materialsContent?.classList.remove('hidden');
            break;
        case 'study-plan':
            studyPlanContent?.classList.remove('hidden');
            break;
        case 'resources':
            resourcesContent?.classList.remove('hidden');
            break;
        default:
            console.error('Invalid section');
    }

    hiddenGrid?.classList.remove('hidden');
}

// Room timer functionality
let timerInterval;
let timerStartTime = localStorage.getItem('timerStartTime') ? parseInt(localStorage.getItem('timerStartTime'), 10) : Date.now();
let timerPausedAt = localStorage.getItem('timerPausedAt') ? parseInt(localStorage.getItem('timerPausedAt'), 10) : null;

function startRoomTimer() {
    const timerElement = document.getElementById('room-timer');

    // If the timer was paused, calculate the elapsed time
    if (timerPausedAt) {
        timerStartTime += Date.now() - timerPausedAt;
    }

    // Update the timer display every second
    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - timerStartTime) / 1000); // Get elapsed time in seconds
        const hours = Math.floor(elapsedTime / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');

        if (timerElement) {
            timerElement.textContent = `${hours}:${minutes}:${seconds}`;
        }

        // Save the start time to localStorage so the timer continues after page reload
        localStorage.setItem('timerStartTime', timerStartTime);
    }, 1000);
}

// Function to pause the timer
function pauseTimer() {
    clearInterval(timerInterval);
    localStorage.setItem('timerPausedAt', Date.now()); // Store the time when the timer was paused
}

// Function to stop the timer
function stopRoomTimer() {
    clearInterval(timerInterval);
    localStorage.removeItem('timerStartTime'); // Remove the stored start time when stopping the timer
    localStorage.removeItem('timerPausedAt'); // Remove the stored pause time
}

function exitRoom() {
    stopRoomTimer(); // Stop and clear the timer
    window.location.href = 'index.html'; // Redirect to the exit page
}

// Clear the timer when the user leaves the page
window.addEventListener('beforeunload', stopRoomTimer);

// Start the room timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    startRoomTimer();
});

// Function to update sharing links dynamically
const updateShareLinks = () => {
    const roomName = document.getElementById('room-name').textContent;
    const roomNumber = document.getElementById('room-number').textContent;
    const encodedRoomName = encodeURIComponent(roomName);
    const encodedRoomNumber = encodeURIComponent(roomNumber);
    const encodedPageUrl = encodeURIComponent(window.location.href);

    // WhatsApp link
    const whatsappLink = `https://wa.me/?text=Room%20Name:%20${encodedRoomName}%20Room%20Number:%20${encodedRoomNumber}`;
    document.getElementById('whatsapp-share-link').setAttribute('href', whatsappLink);

    // Gmail link with prompt for Gmail ID
    const gmailLink = `mailto:?subject=Room%20Details&body=Room%20Name:%20${encodedRoomName}%0ARoom%20Number:%20${encodedRoomNumber}%0APage%20URL:%20${encodedPageUrl}`;
    document.getElementById('gmail-share-link').setAttribute('href', gmailLink);
};

// Add an event listener for the Gmail button that will open the user's Gmail compose screen with pre-filled details
document.getElementById('gmail-share-link')?.addEventListener('click', function (event) {
    event.preventDefault();
    const gmailID = prompt('Please enter your Gmail address to send the room details:');

    if (gmailID) {
        const roomName = document.getElementById('room-name').textContent;
        const roomNumber = document.getElementById('room-number').textContent;
        const encodedRoomName = encodeURIComponent(roomName);
        const encodedRoomNumber = encodeURIComponent(roomNumber);
        const encodedPageUrl = encodeURIComponent(window.location.href);
        const subject = `Room Details - ${encodedRoomName}`;
        const body = `Room Name: ${encodedRoomName}\nRoom Number: ${encodedRoomNumber}\nPage URL: ${encodedPageUrl}`;

        const gmailLink = `mailto:${gmailID}?subject=${subject}&body=${body}`;
        window.location.href = gmailLink;
    }
});

// Function to extract query parameter from URL
const getsQueryParam = (name) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

// Decrypt the encrypted data using the Web Crypto API
// Helper function to convert Base64 to Uint8Array
function fromBase64(data) {
    return new Uint8Array([...atob(data)].map(char => char.charCodeAt(0)));
}

// Function to decrypt data
async function decryptData(encryptedData) {
    try {
        const decodedData = atob(encryptedData);
        const data = JSON.parse(decodedData);

        const { encrypted, iv, key } = data;

        const encryptedArray = new Uint8Array(encrypted);
        const ivArray = new Uint8Array(iv);
        const keyArray = new Uint8Array(key);

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyArray,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: ivArray,
            },
            cryptoKey,
            encryptedArray
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
        console.error("Decryption failed:", error.message);
        return null;
    }
}


// Fetch, decrypt, and log the data
(async () => {
    let data = getsQueryParam("data"); // Fetch encrypted data from URL

    if (data) {
        const decryptedData = await decryptData(data);
        if (decryptedData) {
            console.log("Decrypted Data:", decryptedData);
            // roomCode = decryptedData.room_id
            setRoomCode(decryptedData.room_id);
            const socket = io("http://localhost:3000",{
                query: {userId: decryptedData.creatorName},
            });

            // Check if the user is the admin (room creator)
            if ((decryptedData.admin_name === decryptedData.creatorName) && (decryptedData.creatorName)) {
                console.log("Admin detected. Creating room...");

                setUserName(decryptedData.creatorName)
                // Admin creates the room
                socket.emit("createRoom", {
                    roomCode: decryptedData.room_id,
                    adminName: decryptedData.creatorName
                });

                socket.on("roomCreated", ({ user, username }) => {
                    let obj = { id: user, name: username };
                    users.push(obj);
                    populateUserDetails()
                    console.log("Room created successfully:", data);
                });

            } else {
                console.log("Participant detected. Joining room...");

                setRoomCode(decryptedData.code)
                setUserName(decryptedData.creatorName)
                // User joins an existing room
                socket.emit("joinRoom", {
                    roomCode: decryptedData.code,
                    username: decryptedData.creatorName || "guest009"
                });

                socket.on("roomJoined", (data) => {
                    populateUserDetails()
                    console.log("Joined room successfully:", data);
                });
            }

            populateUserDetails()

            // Listen for new messages
            socket.on("newMessage", (newMessage) => {
                // Extract userId and message from the newMessage object
                const userId = newMessage.userId; // The user ID of the sender
                const message = newMessage.message; // The message content
            
                // Ensure the messages structure exists for the user and type
                if (!messages[userId]) {
                    messages[userId] = {};
                }
            
                // Determine the type of message (e.g., "chat" or "info")
                // Assuming the message object has a `type` property
                const type = message.type || "chat"; // Default to "chat" if type is not provided
            
                if (!messages[userId][type]) {
                    messages[userId][type] = [];
                }
            
                // Add the new message to the appropriate user and type
                messages[userId][type].push(message);
            
                // Render the messages for the user and type
                renderMessages(userId, type);
            
                // Clear the input field (if applicable)
                const input = document.getElementById('message-input');
                if (input) {
                    input.value = '';
                }
            
                // Reset the message type selection (if applicable)
                const messageType = document.querySelector('input[name="message-type"]:checked');
                if (messageType) {
                    messageType.checked = false;
                }
            
                console.log("New message received:", newMessage);
            });

            socket.on("error", (error) => {
                console.log("error:", error);
            })

            socket.on("roomClosed", (message) => {
                alert(message); // Show an alert
                window.location.href = "index.html"; // Redirect to index.html
            });

            // Listen for users joining
            socket.on("userJoined", ({ user, userName ,roomName,roomId}) => {
                let obj = { id: user, name: userName };
                users.push(obj);
                console.log("Room id:::::", roomId);

                let hasRoomId;
                let hasRoomName;

                if (roomName) {
                    document.getElementById('room-name').textContent = roomName;
                    hasRoomName = true;
                }
                if (roomId) {
                    document.getElementById('room-number').textContent = roomId;
                    hasRoomId = true;
                }

                // Show popup only if both values exist
                if (hasRoomName && hasRoomId) {
                    showPopup();
                }

                populateUserDetails()
            
                console.log("Current Users: ", users);
                console.log("User joined:", user);
            });

            socket.on("adminUserJoined", ({ userId, username }) => {

                console.log("Current Users: ", userId);
                console.log("User joined:", username);
            });
            // Fetch existing users when joining
            // Listen for updated user list
            socket.on("updateUsers", ({ users: updatedUsers }) => {
                users = updatedUsers.map((username, index) => ({ id: `user${index + 1}`, name: username }));
                populateUserDetails();
                console.log("Updated User List: ", users);
            });

            // Listen for users joining
            socket.on("userJoined", ({ userName }) => {
                users.push({ id: `user${users.length + 1}`, name: userName });
                populateUserDetails();
                console.log("User joined:", userName);
            });

            // Listen for users leaving
            socket.on("userLeft", (userId) => {
                users = users.filter(user => user.id !== userId);
                populateUserDetails();
                console.log("User left:", userId);
            });


        } else {
            console.log("Decryption failed. Invalid data.");
        }
    } else {
        console.log("No 'data' parameter found in the URL.");
    }
})();