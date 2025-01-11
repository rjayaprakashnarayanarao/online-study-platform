let roomType = null;

function showJoinScreen() {
    document.getElementById("home-screen").classList.add('hide');
    document.getElementById("join-screen").classList.add('show');
}

function showCreateScreen() {
    document.getElementById("home-screen").classList.add('hide');
    document.getElementById("create-screen").classList.add('show');
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
