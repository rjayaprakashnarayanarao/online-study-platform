// Add the msg functions here
let messages = [];

function openPopup(userId, type) {
    const popup = document.getElementById('popup');
    const chatContainer = document.getElementById('chat-container');
    const infoContainer = document.getElementById('info-container');
    const popupTitle = document.getElementById('popup-title');
    const messagesContainer = document.getElementById('messages');
    const chatPlaceholder = document.getElementById('chat-placeholder');
    
    popup.classList.remove('hidden');
    popup.setAttribute('data-user-id', userId);
    popup.setAttribute('data-type', type);
    
    // Set popup title based on type
    switch (type) {
        case 'chat':
            popupTitle.textContent = 'Chat';
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

    // Show or hide the placeholder based on the presence of messages
    if (messages[userId] && messages[userId][type] && messages[userId][type].length > 0) {
        chatPlaceholder.style.display = 'none';
    } else {
        chatPlaceholder.style.display = 'block';
    }
}

function closePopupBox() {
    const popup = document.getElementById('popup');
    popup.classList.add('hidden');
}

function sendMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (!text) return;

    const userId = document.getElementById('popup').getAttribute('data-user-id');
    const type = document.getElementById('popup').getAttribute('data-type');
    
    const message = {
        id: Date.now(),
        text: text,
        sender: 'You',
        timestamp: new Date().toLocaleTimeString()
    };

    if (!messages[userId]) {
        messages[userId] = {};
    }
    
    if (!messages[userId][type]) {
        messages[userId][type] = [];
    }
    
    messages[userId][type].push(message);
    renderMessages(userId, type);
    input.value = '';

    // Hide the placeholder when a message is sent
    document.getElementById('chat-placeholder').style.display = 'none';
}

// Function to render messages for a specific user and option
function renderMessages(userId, type) {
    const messagesContainer = document.getElementById('messages');
    const userMessages = messages[userId] && messages[userId][type] ? messages[userId][type] : [];
    messagesContainer.innerHTML = userMessages.map(message => `
        <div class="message">
            <div class="message-header">
                <span class="message-sender">${message.sender}</span>
                <span class="message-time">${message.timestamp}</span>
            </div>
            <p class="message-text">${message.text}</p>
        </div>
    `).join('');
    
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
const users = [
    { id: 'user1', name: 'Jaya Prakash' },
    { id: 'user2', name: 'jay' },
    { id: 'user3', name: 'mukesh' },
    { id: 'user4', name: 'just checking the length' },
    { id: 'user5', name: 'jai sem-mate' }
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

// Show popup card on page load
window.onload = function() {
    const roomName = getQueryParam('roomName'); // Get room name from URL
    const roomNumber = getQueryParam('roomNumber'); // Get room number from URL

    // Update the room name and number in the popup if they exist
    if (roomName) {
        document.getElementById('room-name').textContent = roomName;
    }

    if (roomNumber) {
        document.getElementById('room-number').textContent = roomNumber;
    }

    // Check if both roomName and roomNumber are present in the URL
    if (roomName && roomNumber) {
        showPopup(); // Show the popup if both parameters are present
    } else {
        closePopup(); // Close the popup if parameters are missing
    }

    // Get the copy button and room number elements
    const copyIcons = document.querySelectorAll('.fa-copy');

    // Add an event listener to the copy button
    copyIcons.forEach((icon) => {
        icon.addEventListener('click', () => {
            // Create a temporary textarea element
            const textarea = document.createElement('textarea');
            textarea.value = document.getElementById('room-number').textContent;
            document.body.appendChild(textarea);

            // Select the text in the textarea
            textarea.select();

            // Copy the text to the clipboard
            document.execCommand('copy');

            // Remove the textarea element
            document.body.removeChild(textarea);

            // Show a success message (optional)
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
document.getElementById('gmail-share-link')?.addEventListener('click', function(event) {
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
