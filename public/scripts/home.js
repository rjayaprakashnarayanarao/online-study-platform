let roomType = null;

document.addEventListener("DOMContentLoaded", () => {
    const profileName = document.querySelector(".profile-section h3");
    const authButton = document.querySelector(".profile-section .join-btn");

    // Check if authToken is present in the session storage
    const authToken = localStorage.getItem("authToken");

    if (authToken) {
        // Parse the user data from session storage
        const user = JSON.parse(localStorage.getItem("user"));

        if (user && user.name) {
            // Update the profile name with the user's name
            profileName.innerHTML = `<i class="fa-brands fa-superpowers"></i> ${user.name}`;

            // Hide the Login/Sign-up button
            authButton.style.display = "none";
        }
    }
});

function showJoinScreen() {
    document.getElementById("home-screen").classList.add('hide');
    document.getElementById("join-screen").classList.add('show');
}

function showCreateScreen() {
    // first need to check the authToken from localsession then if present then only it need to open box or else it need to redirect to login page
    const authToken = localStorage.getItem("authToken");
    const user = localStorage.getItem("user")
    if (authToken && user) {
        document.getElementById("home-screen").classList.add('hide');
        document.getElementById("create-screen").classList.add('show');
    } else {
        window.location.href = "login.html";
    }
}


function closeScreen() {
    document.getElementById("join-screen").classList.remove('show');
    document.getElementById("create-screen").classList.remove('show');
    document.getElementById("home-screen").classList.remove('hide');
}

function join() {
    const code = document.getElementById("join-code").value;
    if (code) {
        window.location.href = `room.html?code=${encodeURIComponent(code)}`; // Redirect without showPopup
    } else {
        alert("Please enter the correct code to join the room");
    }
}

function create() {
    // check if authToken is present or not
    if (sessionStorage.getItem("authToken") !== null) {
        // check if room name is not empty
        const roomName = document.getElementById("room-name").value;
        if (roomName) {
            // check if room type is selected
            if (roomType !== null) {
                // create room
                // ... (rest of the code)
            }
        }
    }
    if (roomType === null) {
        alert("Please select room type (Public or Private)");
        return;
    }
    const roomName = document.getElementById("create-name").value;
    if (roomName) {
        const roomNumber = generateRoomNumber(); // Generate a 6-digit room number
        // Redirect to room.html with roomName, roomNumber, and showPopup query parameters
        window.location.href = `room.html?roomName=${encodeURIComponent(roomName)}&roomNumber=${encodeURIComponent(roomNumber)}&showPopup=true`;
    } else {
        alert("Please enter a room name.");
    }
}

function generateRoomNumber() {
    return String(Math.floor(100000 + Math.random() * 900000)); // Generate a 6-digit number
}

function setPublic() {
    roomType = "Public";
    document.querySelector(".public-btn").classList.add('active');
    document.querySelector(".private-btn").classList.remove('active');
}

function setPrivate() {
    roomType = "Private";
    document.querySelector(".private-btn").classList.add('active');
    document.querySelector(".public-btn").classList.remove('active');
}

// Handle the "Enter Room" buttons
const goBtns = document.querySelectorAll('.go-btn');
goBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const roomName = btn.parentNode.querySelector('h3').textContent;
        const roomNumber = generateRoomNumber(); // Generate a 6-digit room number
        alert(`Clicked on room: ${roomName}`);
        // Redirect to room.html with roomName and roomNumber as query parameters
        window.location.href = `room.html?roomName=${encodeURIComponent(roomName)}&roomNumber=${encodeURIComponent(roomNumber)}`;
    });
});
