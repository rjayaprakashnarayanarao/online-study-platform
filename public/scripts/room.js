// Add the msg functions here
let messages = [];
let voiceMessage = [];
var roomCode;
var username;
let uploadedFiles = {};
let resource = {};
let studyPlan = {};
let selectedUser = null;
const userButtons = {};
const socket = io()
console.log("This site is under RJP's rule");


function setResource(roomCode, Data) {
    resource[roomCode] = Data
}

function getResource(roomCode) {
    return resource[roomCode]
}

function setStudyPlan(roomCode, Data) {
    studyPlan[roomCode] = Data
}

function getStudyPlan(roomCode) {
    return studyPlan[roomCode]
}

function setUserName(name) {
    username = name;
}

function getUserName() {
    return username;
}

function setRoomCode(code) {
    roomCode = code;
}

function getRoomCode() {
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
// Start recording audio
function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            isRecording = true;
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                sendAudioMessage(audioBlob);
                audioChunks = [];
            };
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
        });
}

// Send audio message to server
function sendAudioMessage(audioBlob) {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
        const audioData = reader.result;
        const userId = document.getElementById('popup').getAttribute('data-user-id');
        const roomCode = getRoomCode();
        socket.emit('sendAudioMessage', { roomCode, userId, audioData });
    };
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
// Function to send a message
function sendMessage(event) {
    event.preventDefault();

    const input = document.getElementById('message-input');
    const text = input.value.trim();
    const userId = document.getElementById('popup').getAttribute('data-user-id');
    const code = getRoomCode();

    if (!text && audioChunks.length === 0) return;

    // Get the selected message type (Q or A)
    const messageType = document.querySelector('input[name="message-type"]:checked');
    if (!messageType) {
        alert('Please select a message type (Q or A)');
        return;
    }

    const message = {
        id: Date.now(),
        sender: getUserName(),
        timestamp: new Date().toLocaleTimeString(),
        messageType: messageType.value,
        likes: 0
    };

    if (text) {
        message.text = text;
        socket.emit('sendMessage', { code, userId, message });
    }

    input.value = ""; // Clear text input
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
    console.log("renderMessage: ", userId, type);

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

function renderFileUpload(fileDataArray) {
    uploadedFiles = fileDataArray
    console.log("upload files:", uploadedFiles);

    const materialsList = document.getElementById("materials-list");
    const materialsContent = document.querySelector(".materials-content");
    materialsList.innerHTML = ''; // Clear previous messages
    fileDataArray.forEach(fileData => {
        const fileElement = document.createElement("div");
        fileElement.classList.add("uploaded-file");

        fileElement.innerHTML = `
            <p><strong>${fileData.name || 'Unnamed File'}</strong> (${fileData.size || 'Unknown Size'})</p>
            <p>Type: ${fileData.type || 'Unknown Type'}</p>
            <p>Uploaded by: ${fileData.uploader || 'Anonymous'}</p>
            <p>Time: ${fileData.timestamp || new Date().toLocaleString()}</p>
            <a href="${fileData.fileUrl || '#'}" target="_blank" download>Download</a>
            <hr>
        `;

        materialsList.appendChild(fileElement);
        // Always append to the uploader's materials content
        if (fileData.uploader === getUserName()) {
            materialsContent.appendChild(fileElement.cloneNode(true));
            materialsContent.classList.remove("hidden");
        }
    });
}


// Function to render study plan inside study-plan-content
function renderStudyPlan(studyData) {
    const studyPlanList = document.getElementById("study-plan-list");
    const studyPlanContent = document.querySelector(".study-plan-content");

    const studyElement = document.createElement("div");
    studyElement.classList.add("study-plan-entry");

    studyElement.innerHTML = `
        <p><strong>Unit:</strong> ${studyData.unitName}</p>
        <p><strong>Study Time:</strong> ${studyData.studyTime}</p>
        <p><strong>Added by:</strong> ${studyData.uploader}</p>
        <hr>
    `;

    // Append to study plan list
    studyPlanList.appendChild(studyElement);

    // Append to study plan content and ensure visibility only for uploader
    if (studyData.uploader === getUserName()) {
        studyPlanContent.appendChild(studyElement.cloneNode(true));
        studyPlanContent.classList.remove("hidden");
    }
}

// Function to render resource inside resources-content
function renderResource(resourceData) {
    const resourceList = document.getElementById("resource-list");
    const resourcesContent = document.querySelector(".resources-content");

    const resourceElement = document.createElement("div");
    resourceElement.classList.add("resource-entry");

    resourceElement.innerHTML = `
        <p><strong>Resource Link:</strong> <a href="${resourceData.link}" target="_blank">${resourceData.link}</a></p>
        <p><strong>Description:</strong> ${resourceData.description}</p>
        <p><strong>Added by:</strong> ${resourceData.uploader}</p>
        <hr>
    `;

    // Append to resource list
    resourceList.appendChild(resourceElement);

    // Append to resources content and ensure visibility only for uploader
    if (resourceData.uploader === getUserName()) {
        resourcesContent.appendChild(resourceElement.cloneNode(true));
        resourcesContent.classList.remove("hidden");
    }
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
    document.getElementById('popup-card').style.display = 'flex';
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

    users.forEach((user, index) => {
        const userDiv = document.createElement('div');
        userDiv.className = 'single-user';
        userDiv.id = `user${index + 1}`; // Set unique ID for each user
        userDiv.innerHTML = `
            <p>${user.name}</p>
            <div class="user-options">
                <button class="user-info" onclick="openPopup('${user.id}', 'info')"><i class="fa-solid fa-info"></i></button>
                <button class="chat-box" onclick="openPopup('${user.id}', 'chat')"><i class="fa-brands fa-rocketchat"></i></button>
            </div>
        `;
        // Attach click event listener
        userDiv.addEventListener('click', function () {
            handleUserSelection(userDiv, user.name);
        });

        userDetailsContainer.appendChild(userDiv);
    });

    // Show the default message if no user is selected
    document.getElementById('default-message').style.display = 'block';
    document.querySelector('.materials-content').style.display = 'none';
    document.querySelector('.study-plan-content').style.display = 'none';
    document.querySelector('.resources-content').style.display = 'none';
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
    });

    document.getElementById(`upload-${tabName}`).classList.remove("hidden");

    document.querySelectorAll(".upload-tab").forEach((tab) => {
        tab.classList.remove("active");
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
}

// Handle file upload
document.getElementById("upload-materials-input").addEventListener("change", function () {
    document.getElementById("upload-materials-message").classList.remove("hidden");
});
// Add study plan entry
function addStudyPlan() {
    const unitName = document.getElementById("study-unit-name").value;
    const studyTime = document.getElementById("study-time").value;

    if (unitName && studyTime) {
        const formattedTime = formatTime(studyTime);

        // Send data to backend via WebSocket
        socket.emit("addStudyPlan", { roomCode, unitName, studyTime: formattedTime });

        // Update UI
        const studyPlanList = document.getElementById("study-plan-list");
        const entry = document.createElement("p");
        entry.textContent = `${unitName} - ${formattedTime}`;
        studyPlanList.prepend(entry);

        // Clear input fields
        document.getElementById("study-unit-name").value = "";
        document.getElementById("study-time").value = "";
    }
}

// Convert 24-hour time to 12-hour format
function formatTime(time) {
    let [hour, minute] = time.split(":");
    let period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${period}`;
}

// Add resource entry
function addResource() {
    const link = document.getElementById("resource-link").value;
    const description = document.getElementById("resource-description").value;

    if (link && description) {
        // Send data to backend via WebSocket
        socket.emit("addResource", { roomCode, link, description });

        // Clear input fields
        document.getElementById("resource-link").value = "";
        document.getElementById("resource-description").value = "";
    }
}

// Attach the popup open function to the Upload button
document.querySelector(".upload-button").addEventListener("click", function (event) {
    event.preventDefault(); // Prevent redirection
    openUploadPopup();
});

// Function to change the tooltip text to "Copied!"
function showCopiedTooltip(icon) {
    const tooltip = icon.nextElementSibling;
    tooltip.textContent = "Copied!";
    setTimeout(() => {
        tooltip.textContent = "Copy Room Code";
    }, 2000); // Reset the tooltip text after 2 seconds
}

document.addEventListener('DOMContentLoaded', function () {
    if (typeof google !== 'undefined' && google.books) {
        google.books.load(); // Load the Books API
        google.books.setOnLoadCallback(initGoogleBooks);
    } else {
        console.error("Google Books API is not loaded.");
    }
});

function initGoogleBooks() {
    console.log("Google Books API loaded successfully.");
    // Any Google Books related code should go here
}

// Open Library Popup when clicking the Library button
document.querySelector(".library-button").addEventListener("click", function () {
    document.getElementById("lib-popup").classList.remove("hidden");
    document.getElementById("close-viewer").style.display = 'none';
});

// Close Library Popup when clicking the close button
document.querySelector(".close-lib-popup").addEventListener("click", function () {
    document.getElementById("lib-popup").classList.add("hidden");
    closeViewerCanvas();
    clearSearchResults();
});

let displayedResults = 12; // Number of results to show initially
let currentBookData = []; // Store search results globally
let previousSearchResults = ""; // Store the previous search results before selecting a book

// Book Search using Backend API (Google Books)
document.getElementById("search-button").addEventListener("click", function () {
    const query = document.getElementById("book-search").value.trim();
    if (!query) return;

    const resultsContainer = document.getElementById("search-results");
    resultsContainer.innerHTML = "<p>Loading...</p>"; // Display loading text

    // Fetch book data from the backend server
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40`)
        .then(response => response.json())
        .then(data => {
            const resultsContainer = document.getElementById("search-results");
            resultsContainer.innerHTML = "";

            if (!data.items || data.items.length === 0) {
                resultsContainer.innerHTML = "<p>No results found.</p>";
                return;
            }

            // Display initial results
            displayResults(data);

        })
        .catch(error => console.error("Error fetching books:", error));
});

// Function to display book search results
function displayResults(data, isAppending = false) {
    const resultsContainer = document.getElementById("search-results");

    // Store the entire dataset once
    if (!isAppending) {
        currentBookData = data.items || []; // Save all books
        displayedResults = 12; // Reset displayed results
        resultsContainer.innerHTML = ""; // Clear only if not appending
    }

    // Show only the first `displayedResults` number of books
    const booksToShow = currentBookData.slice(0, displayedResults);

    previousSearchResults = resultsContainer.innerHTML; // Store the previous search results
    resultsContainer.innerHTML = ""; // Clear previous results

    booksToShow.forEach((item, index) => {
        const book = item.volumeInfo;
        const title = book.title || "Unknown Title";
        const author = book.authors ? book.authors.join(", ") : "Unknown Author";
        const thumbnail = book.imageLinks?.thumbnail || "https://dummyimage.com/128x195/ccc/fff.png&text=No+Image";

        // Prevent duplicates when appending
        if (document.getElementById(`book-${index}`)) return;

        const bookItem = document.createElement("div");
        bookItem.classList.add("book-item");
        bookItem.id = `book-${index}`; // Unique ID to avoid duplicates
        bookItem.innerHTML = `
            <img src="${thumbnail}" alt="Book Cover">
            <h3>${title}</h3>
            <p>by ${author}</p>
        `;

        bookItem.addEventListener("click", () => fetchBookDetails(item.id));
        resultsContainer.appendChild(bookItem);
    });

    // Remove existing button if already added
    const existingButton = document.getElementById("load-more-button");
    if (existingButton) existingButton.remove();

    // Add "Load More" button if there are still more books to load
    if (displayedResults < currentBookData.length) {
        const loadMoreButton = document.createElement("button");
        loadMoreButton.id = "load-more-button";
        loadMoreButton.textContent = "Load More";
        loadMoreButton.style.marginTop = "1rem";
        loadMoreButton.onclick = () => {
            displayedResults += 12; // Show 12 more books
            displayResults(currentBookData, true); // Append results
        };
        resultsContainer.appendChild(loadMoreButton);
    }
}

// Function to display book preview using Google Books Embedded Viewer
function displayBookPreview(bookIsbn) {
    if (typeof google === 'undefined' || typeof google.books === 'undefined') {
        console.error("Google Books API is not loaded.");
        return;
    }

    try {
        const viewer = new google.books.DefaultViewer(document.getElementById('viewerCanvas'));
        viewer.load('ISBN:' + bookIsbn);
        console.log(`Loading book preview for ISBN: ${bookIsbn}`);

        // Show the viewerCanvas when the preview button is clicked
        document.getElementById('viewerCanvas').style.display = 'block';
        document.getElementById('close-viewer').style.display = 'block';
        document.querySelector('.close-lib-popup').style.display = 'none';
    } catch (error) {
        console.error("Error loading book preview:", error);
    }
}

function closeViewerCanvas() {
    document.getElementById('viewerCanvas').style.display = 'none';
    document.getElementById('close-viewer').style.display = 'none';
    document.querySelector('.close-lib-popup').style.display = 'block';
}

// Fetch and Display Book Details
function fetchBookDetails(bookId) {
    fetch(`/api/books/${bookId}`)
        .then(response => response.json())
        .then(item => {
            const book = item.volumeInfo;
            const title = book.title || "Unknown Title";
            const description = book.description || "No description available.";
            const authors = book.authors ? book.authors.join(", ") : "Unknown Author";
            const pageCount = book.pageCount || "N/A";
            const publishedDate = book.publishedDate || "Unknown";

            const industryIdentifiers = book.industryIdentifiers;
            const isbn = industryIdentifiers ? industryIdentifiers.find(id => id.type === "ISBN_13")?.identifier : null;

            const resultsContainer = document.getElementById("search-results");
            // Save current search results before replacing them
            previousSearchResults = resultsContainer.innerHTML;
            resultsContainer.classList.add("selected");

            resultsContainer.innerHTML = `
                <img src="${book.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}" 
                     alt="Book Cover" 
                     style="width: 150px; border-radius: 10px;">
                <div id="book-details">
                    <h2>${title}</h2>
                    <p><strong>Authors:</strong> ${authors}</p>
                    <p><strong>Pages:</strong> ${pageCount}</p>
                    <p><strong>Published:</strong> ${publishedDate}</p>
                    <p>${description}</p>
                    ${isbn ? `<button id="preview-button" onclick="displayBookPreview('${isbn}')">Preview Book</button>`
                    : `<p>No preview available for this book.</p>`}
                    <button onclick="returnToSearch()">Back to Search</button>
                </div>
            `;
        })
        .catch(error => {
            console.error("Error fetching book details:", error);
            document.getElementById("search-results").innerHTML = "<p>Unable to load book details.</p>";
        });
}

// Clear Search Results and Reset Input
function clearSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    const searchInput = document.getElementById('book-search');
    resultsContainer.innerHTML = '';
    resultsContainer.classList.remove("selected");
    searchInput.value = '';
    closeViewerCanvas();
}

function returnToSearch() {
    const resultsContainer = document.getElementById('search-results');

    if (previousSearchResults) {
        resultsContainer.innerHTML = previousSearchResults; // Restore old search results
        resultsContainer.classList.remove("selected"); // Reset to grid layout
    }
}

// ai functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add an event listener to the AI button
    let closeAiPopup = document.querySelector('.close-ai-popup');
    let aiButton = document.querySelector('.ai-button');
    const aiPopup = document.getElementById('ai-popup');

    // If .ai-button does NOT exist, create and append it
    if (!aiButton) {
        console.warn("ai-button not found! Creating one dynamically...");

        // Create new button element
        aiButton = document.createElement('button');
        aiButton.className = 'ai-button';
        aiButton.innerHTML = 'AI <i class="fa-solid fa-robot"></i>';

        // Append it to the header or body
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(aiButton);
        } else {
            document.body.appendChild(aiButton);
        }
    }

    // Now add the event listener safely
    aiButton.addEventListener('click', function (event) {
        event.preventDefault();
        if (aiPopup) {
            aiPopup.classList.remove('hidden');
        }
    });

    // If .close-ai-popup does NOT exist, create and append it
    if (!closeAiPopup) {
        console.warn(".close-ai-popup not found! Creating one...");
        closeAiPopup = document.createElement('button');
        closeAiPopup.className = 'close-ai-popup';
        closeAiPopup.innerHTML = '✖';

        // Append it inside #ai-popup
        const aiPopup = document.getElementById('ai-popup');
        if (aiPopup) {
            aiPopup.appendChild(closeAiPopup);
        }
    }

    // Add an event listener to the AI popup close button
    document.querySelector('.close-ai-popup').addEventListener('click', function (event) {
        event.preventDefault();
        document.getElementById('ai-popup').classList.add('hidden');
    });

    // Handle AI Tutor Form submission
    document.getElementById("tutorForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const topic = document.getElementById("topic").value;
        const level = document.getElementById("level").value;

        document.getElementById("results").innerHTML = `
            <img src="./Images/gif-thinking.gif" alt="robo" style="display: block; margin: 0 auto 1rem; width: 150px; margin-bottom: 0;">
            Thinking...
            `;

        try {
            console.log("topic level: ", topic, level);

            const response = await fetch("http://localhost:3000/tutor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, level }),
            });

            const data = await response.json();

            document.getElementById("results").innerHTML = `
                <h2>Topic: ${data.topic}</h2>
                <h3>Level: ${data.level}</h3>
                <h4>Helper Response:</h4>
                <div class="tutor-response">${marked.parse(data.tutorResponse)}</div>
                <h4>Wikipedia Result:</h4>
                <ul>
                    ${Array.isArray(data.searchResults) && data.searchResults.length > 0
                    ? data.searchResults.map(item => `<li>${item.replace(/\n/g, '<br>')}</li>`).join("")
                    : "<li>No search results available.</li>"
                }
                </ul>
                <img src="./Images/gif-done.gif" alt="robo" style="display: block; margin: 0 auto; width: 150px;">
            `;

            console.log("Response from server:", data);
        } catch (error) {
            console.error("Error:", error);
            document.getElementById("results").innerHTML = `
                <img src="./Images/gif-fail.gif" alt="robo" style="display: block; margin: 0 auto; width: 150px;">
                An error occurred.
            `;
        }
    });
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
            event.stopPropagation();
            const textarea = document.createElement('textarea');
            textarea.value = document.getElementById('room-number').textContent;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            console.log('Room number copied to clipboard!');
            showCopiedTooltip(icon); // Call the function to change the tooltip text
        });
    });

    // Update sharing links dynamically
    updateShareLinks();
};


// Share options functionality
document.addEventListener('DOMContentLoaded', () => {

    // Add event listeners to all single-user divs
    document.querySelectorAll('.single-user').forEach(user => {
        user.addEventListener('click', handleUserSelection);
    });

    //share options functionality
    const shareIcon = document.getElementById('share-icon');
    const shareOptions = document.getElementById('share-options');

    shareIcon?.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent click event from propagating
        // Toggle the display of the share options menu
        shareOptions.classList.toggle('show');
    });

    // Close the share options menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!shareOptions.contains(event.target) && !shareIcon.contains(event.target)) {
            shareOptions.classList.remove('show');
        }
    });

    // Add an event listener to the close button
    document.querySelector('.close-popup')?.addEventListener('click', () => {
        closePopup();
    });

    // Add an event listener to the Details button
    // document.querySelector('.details-button')?.addEventListener('click', () => {
    //     showPopup();
    // });


    // Start the room timer
    startRoomTimer();
});

// Function to handle user selection
function handleUserSelection(selectedUser, username) {
    // Remove 'selected' class from all users
    document.querySelectorAll('.single-user').forEach(user => {
        user.classList.remove('selected');
    });

    // Add 'selected' class to clicked user
    selectedUser.classList.add('selected');

    // Hide the default message
    document.getElementById('default-message').style.display = 'none';

    // Update the materials-content with the selected user
    const materialsContent = document.querySelector('.materials-content');
    materialsContent.innerHTML = `<h3>Materials Content</h3><p>Selected User: ${username}</p>`;

    // Load uploaded files for the selected user
    const userId = selectedUser.id;
    console.log("UserId: ", userId);

    if (uploadedFiles[userId]) {
        const materialsList = document.createElement('div');
        materialsList.id = 'materials-list';
        uploadedFiles[userId].forEach(file => {
            const listItem = document.createElement('p');
            listItem.innerHTML = `<a href="#" onclick="alert('File: ${file.name}')">${file.name}</a>`;
            materialsList.appendChild(listItem);
        });
        materialsContent.appendChild(materialsList);
    }

    document.querySelector('.study-plan-content').innerHTML = `<h3>Study Plan Content</h3><p>Selected User: ${username}</p>`;
    document.querySelector('.resources-content').innerHTML = `<h3>Resources Content</h3><p>Selected User: ${username}</p>`;

    // Ensure only the Materials section is visible by default
    document.querySelector('.materials-content').style.display = 'block';
    document.querySelector('.study-plan-content').style.display = 'none';
    document.querySelector('.resources-content').style.display = 'none';
    toggleHiddenGrid('materials'); // Calls function to highlight materials by default
}
// Toggle hidden grid content
function toggleHiddenGrid(section) {
    const selectedUser = document.querySelector('.single-user.selected');
    const hiddenGrid = document.querySelector('.hidden-grid');  // Select the hidden grid element

    if (!selectedUser) {
        // No user selected, show warning message
        document.getElementById('default-message').innerHTML = `<h3>You must select a user in order to access ${section.replace('-', ' ')}</h3>`;
        document.getElementById('default-message').style.display = 'block';

        // Hide all section contents
        document.querySelector('.materials-content').style.display = 'none';
        document.querySelector('.study-plan-content').style.display = 'none';
        document.querySelector('.resources-content').style.display = 'none';

        // Remove highlights from sections
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

        return;
    }

    // If a user is selected, hide the default message and show the selected section
    document.getElementById('default-message').style.display = 'none';

    const sections = ['materials', 'study-plan', 'resources'];
    sections.forEach(sec => {
        const content = document.querySelector(`.${sec}-content`);
        const sectionElement = document.querySelector(`.${sec}`);
        if (sec === section) {
            content.style.display = 'block'; // Show selected section
            sectionElement.classList.add('active'); // Highlight selected section
        } else {
            content.style.display = 'none'; // Hide others
            sectionElement.classList.remove('active'); // Remove highlight
        }
    });

    // hiddenGrid.classList.toggle('hidden');
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

// Start the room timer when the page loads and populate user details
document.addEventListener('DOMContentLoaded', () => {
    startRoomTimer();
    populateUserDetails();
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
            const socket = io("http://localhost:3000", {
                query: { userId: decryptedData.creatorName },
            });

            // Check if the user is the admin (room creator)
            if ((decryptedData.admin_name === decryptedData.creatorName) && (decryptedData.creatorName)) {
                document.getElementById("pleasewait-popups").style.display = "none";
                console.log("Blocked popup ");

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

                socket.emit("joinRoom", {

                    roomCode: decryptedData.code,
                    username: decryptedData.creatorName || "guest009"
                });
                // Show the "Please Wait" popup
                document.getElementById("pleasewait-popups").style.display = "flex";
                socket.on("joinApproved", ({ roomCode }) => {
                    console.log("Admin approved your request. Entering the room...");
                    // Wait 2 seconds before hiding the popup
                    setTimeout(() => {
                        document.getElementById("pleasewait-popups").style.display = "none";
                    }, 2000);
                    // Emit 'finalJoinRoom' instead of 'joinRoom'
                    socket.emit("finalJoinRoom", { roomCode, username: getUserName() });
                });

                socket.on("joinDenied", () => {
                    alert("The admin didn't allow you.");
                    window.location.href = "index.html"; // Redirect back
                });
                // User joins an existing room

                // socket.on("roomJoined", (data) => {
                //     populateUserDetails()
                //     console.log("Joined room successfully:", data);
                // });
            }

            populateUserDetails()


            document.getElementById("upload-materials-input").addEventListener("change", function (event) {
                const files = event.target.files;
                const materialsList = document.getElementById("materials-list");
                const message = document.getElementById("upload-materials-message");

                if (files.length > 0) {
                    message.classList.remove("hidden");
                    materialsList.innerHTML = ""; // Clear previous list

                    Array.from(files).forEach(file => {
                        const fileData = {
                            name: file.name || 'Unnamed File',
                            size: file.size || 'Unknown Size',
                            type: file.type || 'Unknown Type',
                            uploader: selectedUser || getUserName(),
                            timestamp: new Date().toLocaleString(),
                            fileUrl: file ? URL.createObjectURL(file) : '#'
                        };

                        // renderFileUpload(fileData);

                        // Emit the file upload event to the server
                        socket.emit("fileUploaded", {
                            roomCode: getRoomCode(),
                            fileData: fileData
                        });

                        // Render the file upload locally
                        renderFileUpload(fileData);
                    });

                    // Hide message after 3 seconds
                    setTimeout(() => {
                        message.classList.add("hidden");
                    }, 3000);
                }
            });

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

            // Function to receive and display audio messages
            socket.on('receiveAudioMessage', ({ roomCode, sender, audioData }) => {
                console.log("Received audio message from:", sender, "in room:", roomCode);
            
                // Ensure voiceMessage object is initialized properly
                if (!voiceMessage[roomCode]) {
                    voiceMessage[roomCode] = [];
                }
            
                // Store the message with sender details
                voiceMessage[roomCode].push({ sender, audioData });
            
                const messagesContainer = document.getElementById('messages');
            
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message');
                
                // Retrieve the latest message for this roomCode
                const latestMessage = voiceMessage[roomCode][voiceMessage[roomCode].length - 1];
            
                messageDiv.innerHTML = `<strong>${latestMessage.sender}:</strong> `;
            
                const audioElement = document.createElement('audio');
                audioElement.controls = true;
                audioElement.src = latestMessage.audioData;
            
                messageDiv.appendChild(audioElement);
                messagesContainer.appendChild(messageDiv);
                console.log("Audio Data: ",voiceMessage);
                
            });
            

            socket.on("error", (error) => {
                console.log("error:", error);
            })


            // admin's decision
            socket.on("userJoinRequest", async ({ username, socketId, roomCode }) => {
                const confirmation = await confirm(`${username} wants to join the room. Allow entry?`);
                socket.emit("approveUser", { socketId, roomCode, username, approved: confirmation });
            });
            socket.on("roomClosed", (message) => {
                alert(message); // Show an alert
                window.location.href = "index.html"; // Redirect to index.html
            });

            // Listen for users joining
            socket.on("userJoined", async ({ user, userName, roomName, roomId, newMessage }) => {

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

                async function lambda(newMessage) {
                    console.log("messagessss::: ", newMessage);

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

                    console.log("old message received:", newMessage);
                };

                await lambda(newMessage)


                console.log("Current Users: ", users);
                console.log("User joined:", user);
            });

            // Assuming this is your socket listener in frontend

            socket.on("newFileUpload", (fileData) => {
                console.log("File Data array: ", fileData);
                renderFileUpload(fileData);
            });


            // Listen for updated user list
            socket.on("updateUsers", ({ users: updatedUsers }) => {
                users = updatedUsers.map((username, index) => ({ id: `user${index + 1}`, name: username }));
                populateUserDetails();
                console.log("Updated User List: ", users);
            });

            // Listen for users joining
            // socket.on("userJoined", ({ userName }) => {
            //     users.push({ id: `user${users.length + 1}`, name: userName });
            //     populateUserDetails();
            //     console.log("User joined:", userName);
            // });


            socket.on("getStudyPlan", (Data) => {

                setStudyPlan(Data.roomCode, Data.studyPlanList);
                console.log("Study data: ", Data);

                let roomCode = Data.roomCode;
                let studyPlanList = Data.studyPlanList[roomCode];

                let studyPlanDisplay = document.getElementById("study-plan-list");

                // Clear the previous list before adding new data
                studyPlanDisplay.innerHTML = "";

                // Check if study plans exist and have elements
                if (studyPlanList && studyPlanList.length > 0) {
                    // Loop through each study plan and add it to the list
                    studyPlanList.forEach(({ studyTime, unitName }) => {
                        const formattedTime = formatTime(studyTime);

                        console.log("Study Time:", formattedTime);
                        console.log("Unit Name:", unitName);

                        const entry = document.createElement("p");
                        entry.textContent = `${unitName} - ${formattedTime}`;
                        studyPlanDisplay.appendChild(entry); // Use appendChild to maintain order
                    });
                }
            });


            socket.on("getResource", (Data) => {
                setResource(Data.roomCode, Data.resourceList);
                console.log("Resource data: ", Data);

                let roomCode = Data.roomCode;
                let resources = Data.resourceList[roomCode];

                let resourceList = document.getElementById("resource-list");

                // Clear the previous list before adding new data
                resourceList.innerHTML = "";

                // Check if resources exist and have elements
                if (resources && resources.length > 0) {
                    // Loop through each resource and add it to the list
                    resources.forEach(({ description, link }) => {
                        console.log("Description:", description);
                        console.log("Link:", link);

                        let entry = document.createElement("p");
                        entry.innerHTML = `<a href="${link}" target="_blank">${description}</a>`;
                        resourceList.appendChild(entry); // Append (instead of prepend)
                    });
                }
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