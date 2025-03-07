let roomType = null;
console.log("This site is under RJP's rule");

// check if the user is using a mobile device
document.addEventListener("DOMContentLoaded", function () {
    if (window.innerWidth < 768) {
        document.getElementById("mobile-warning").style.display = "block";
    }
});

// Check if user is signed in or not
document.addEventListener("DOMContentLoaded", async () => {
    const profileName = document.querySelector(".profile-section h3");
    const authButton = document.querySelector(".profile-section .join-btn");
    const signOutButton = document.querySelector(".profile-section .sign-out-btn");

    // Check if authToken is present in the session storage
    const authToken = localStorage.getItem("authToken");

    if (authToken) {
        // Parse the user data from session storage
        const user = JSON.parse(localStorage.getItem("user"));

        if (user && user.name) {
            // Update the profile name with the user's name
            profileName.innerHTML = `<i class="fa-brands fa-superpowers" id="superpowers-icon"></i> ${user.name}`;

            // Hide the Login/Sign-up button
            authButton.style.display = "none";

            // Show the Sign Out button
            signOutButton.style.display = "block";
        }
    } else {
        // Generate a unique ID for unsigned users
        const uniqueId = generateUniqueId();
        profileName.innerHTML = `<i class="fa-brands fa-superpowers" id="superpowers-icon"></i> ${uniqueId}`;
    }

    // Add event listener to the Sign Out button
    signOutButton.addEventListener("click", () => {
        // Remove the authToken from local storage
        localStorage.removeItem("authToken");

        // Remove the user data from local storage
        localStorage.removeItem("user");

        // Redirect to the login page
        window.location.href = "index.html";
    });
    try {
        const response = await fetch("api/room/getPublicRooms");
        const rooms = await response.json();
        console.log("Rooms:", rooms);

        const roomsContainer = document.getElementById("roomsContainer");
        roomsContainer.innerHTML = ""; // Clear any existing content

        rooms.forEach(room => {
            const roomDiv = document.createElement("div");
            roomDiv.classList.add("rooms");

            const roomTitle = document.createElement("h3");
            roomTitle.textContent = room.room_name;

            const joinButton = document.createElement("button");
            joinButton.classList.add("go-btn");
            joinButton.textContent = "Enter Room";
            joinButton.onclick = () => join(room.room_id); // Pass room code as parameter

            roomDiv.appendChild(roomTitle);
            console.log("room code:", room.room_id);

            roomDiv.appendChild(joinButton);
            roomsContainer.appendChild(roomDiv);
        });

        // Store rooms data globally for filtering
        window.roomsData = rooms;
    } catch (error) {
        console.error("Error fetching public rooms:", error);
    }
});

// Function to filter rooms based on the search input
function filterRooms() {
    const searchTerm = document.getElementById("search-bar").value.toLowerCase();
    const roomsContainer = document.getElementById("roomsContainer");
    roomsContainer.innerHTML = ""; // Clear any existing content

    const filteredRooms = window.roomsData.filter(room =>
        room.room_name.toLowerCase().includes(searchTerm)
    );

    filteredRooms.forEach(room => {
        const roomDiv = document.createElement("div");
        roomDiv.classList.add("rooms");

        const roomTitle = document.createElement("h3");
        roomTitle.textContent = room.room_name;

        const joinButton = document.createElement("button");
        joinButton.classList.add("go-btn");
        joinButton.textContent = "Enter Room";
        joinButton.onclick = () => join(room.room_id); // Pass room code as parameter

        roomDiv.appendChild(roomTitle);
        roomDiv.appendChild(joinButton);
        roomsContainer.appendChild(roomDiv);
    });
}

function generateUniqueId() {
    return 'guest-' + Math.random().toString(36).substr(2, 9);
}

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

async function join(passedCode) {
    const heading = document.querySelector("#superpowers-icon").parentElement;
    const text = heading.textContent.trim(); // Extracts "guest009"

    let code = passedCode
    if (!code) {
        code = document.getElementById("join-code").value.trim();
    }
    const data = { code, creatorName: text }

    try {
        // Encrypt the room code before redirecting
        const encryptedCode = await encryptData(data);
        console.log("Encrypted Code:", encryptedCode);

        // Redirect to room.html with encrypted code as a query parameter
        window.location.href = `room.html?data=${encodeURIComponent(encryptedCode)}`;
    } catch (error) {
        console.error("Encryption Error:", error);
        alert("An error occurred while encrypting the room code.");
    }
}

async function createRoom() {
    const roomName = document.getElementById("create-name").value.trim();

    if (!roomName || !roomType) {
        alert("Please fill in all fields.");
        return;
    }
    // Get the username from the <h3> element
    const heading = document.querySelector("#superpowers-icon").parentElement;
    const text = heading.textContent.trim(); // Extracts "guest009"

    // Retrieve user data from localStorage
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;

    // If user exists and has a name, use it; otherwise, fallback to the text
    const admin_name = user && user.name ? user.name : text;
    const creatorName = text

    const roomData = {
        creatorName,
        roomName,
        roomType,
        admin_name
    };

    console.log("Room Data: ", roomData);

    try {
        const response = await fetch('/api/room/createRoom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(roomData),
        });

        const result = await response.json();

        if (response.status === 201) {
            console.log("response: ", result);

            // Encrypt the result object
            const encryptedData = await encryptData(result);
            console.log("Encrypted Data: ", encryptedData);


            // Redirect to room.html with encrypted data as a query parameter
            window.location.href = `room.html?data=${encodeURIComponent(encryptedData)}`;
        } else {
            alert(result.message || 'Failed to create room. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
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

// Event listener for the superpowers icon to show the popup
document.addEventListener("DOMContentLoaded", () => {
    const superpowersIcon = document.getElementById('superpowers-icon');
    const popupBox = document.getElementById('popup-box');

    if (superpowersIcon && popupBox) {
        superpowersIcon.addEventListener('click', () => {

            const popupContent = popupBox.querySelector('.popup-content');
            popupContent.innerHTML = ''; // Clear the previous content

            const userData = localStorage.getItem("user");
            if (userData && JSON.parse(userData).name) {
                
                let Quizdom = JSON.parse(userData).Quizdom
                let Analytix = JSON.parse(userData).Analytix 
                let Rebuff = JSON.parse(userData).Rebuff
                               
                var progressData = {
                    Quizdom: Number(Quizdom) || 0, 
                    Analytix: Number(Analytix) || 0, 
                    Rebuff: Number(Rebuff) || 0
                };

                // Create and append elements for each progress data
                for (const [key, value] of Object.entries(progressData)) {
                    const progressContainer = document.createElement('div');
                    progressContainer.className = 'progress-container';

                    const progressElement = document.createElement('div');
                    progressElement.className = 'circular-progress';
                    progressElement.setAttribute('data-inner-circle-color', 'black');
                    progressElement.setAttribute('data-percentage', value);
                    progressElement.setAttribute('data-progress-color', 'white');
                    progressElement.setAttribute('data-bg-color', 'grey');
                    progressElement.innerHTML = `
              <div class="inner-circle"></div>
              <p class="percentage">${value}%</p>
            `;
                    const labelElement = document.createElement('p');
                    labelElement.textContent = key;
                    labelElement.className = 'progress-label';

                    progressContainer.appendChild(progressElement);
                    progressContainer.appendChild(labelElement);
                    popupContent.appendChild(progressContainer);
                }

                // Add circular progress bar functionality
                const circularProgress = document.querySelectorAll(".circular-progress");

                Array.from(circularProgress).forEach((progressBar) => {
                    const progressValue = progressBar.querySelector(".percentage");
                    const innerCircle = progressBar.querySelector(".inner-circle");
                    let startValue = 0,
                        endValue = Number(progressBar.getAttribute("data-percentage")),
                        speed = 50,
                        progressColor = progressBar.getAttribute("data-progress-color");

                    const progress = setInterval(() => {
                        startValue++;
                        progressValue.textContent = `${startValue}%`;
                        progressValue.style.color = `${progressColor}`;

                        innerCircle.style.backgroundColor = `${progressBar.getAttribute(
                            "data-inner-circle-color"
                        )}`;

                        progressBar.style.background = `conic-gradient(${progressColor} ${startValue * 3.6
                            }deg,${progressBar.getAttribute("data-bg-color")} 0deg)`;
                        if (startValue === endValue) {
                            clearInterval(progress);
                        }
                    }, speed);
                });

            } else {
                console.log('user is not logged in');
                const message = document.createElement('p');
                message.textContent = 'Login is required to proceed with calculating your levels and accessing relevant data.';
                popupContent.appendChild(message);
            }

            const closePopup = document.createElement('span');
            closePopup.className = 'close-popup';
            closePopup.innerHTML = '&times;';
            closePopup.addEventListener('click', () => {
                popupBox.style.display = 'none';
            });

            popupContent.appendChild(closePopup);
            popupBox.style.display = 'block';

            // Retrieve the actual level number from user data
            const user = JSON.parse(userData);
            const CurrentLevel = user.level || 1; // Replace with actual logic to get the level number

            // Remove existing level container if it exists
            const existingLevelContainer = document.querySelector('.level-container');
            if (existingLevelContainer) {
                existingLevelContainer.remove();
            }

            // Create and append the new div for Level outside of popup-content
            const levelContainer = document.createElement('div');
            levelContainer.className = 'level-container';

            const infoButton = document.createElement('button');
            infoButton.className = 'info-btn';
            infoButton.innerHTML = '<i class="fa-solid fa-info-circle"></i>';

            const levelText = document.createElement('span');
            levelText.textContent = `Level: ${CurrentLevel}`;

            const certButton = document.createElement('button');
            certButton.className = 'cert-btn';
            certButton.textContent = 'Get Certified';

            levelContainer.appendChild(infoButton);
            levelContainer.appendChild(levelText);
            levelContainer.appendChild(certButton);
            popupBox.appendChild(levelContainer);

            // Add event listener to the info button to show guidelines popup
            infoButton.addEventListener('click', () => {
                const guidelinesPopup = document.createElement('div');
                guidelinesPopup.className = 'guidelines-popup';

                const guidelinesContent = `
              <h2>User Guidelines:</h2>
              <p>Your level in this application is determined by your engagement in knowledge-sharing and problem-solving. It is influenced by three key factors: Quizdom, Analytix, and Rebuff. Understanding these metrics will help you make the most of the platform and grow your expertise.</p>
              <h3>Level Progression Criteria:</h3>
              <h4>Quizdom:</h4>
              <p>Your Quizdom score increases when you actively seek knowledge by asking insightful questions in Rocket Chat. The more you engage in meaningful discussions, the more your level improves.</p>
              <h4>Analytix:</h4>
              <p>Your Analytix score grows when you solve other users' questions by applying your problem-solving skills. This metric increases based on the number of likes your solutions receive from others, showcasing the value of your contributions.</p>
              <h4>Rebuff:</h4>
              <p>Your Rebuff score rises when the answers you provide are incorrect or unhelpful. A higher Rebuff score negatively impacts your overall level, as it increases when others dislike the solutions you provide. Strive for accuracy and clarity to maintain a low Rebuff score.</p>
              <h3>Benefits of Increasing Your Level:</h3>
              <p>Progressing to higher levels unlocks valuable benefits, including:</p>
              <h4>Certification:</h4>
              <p>We will provide an official certificate reflecting your current level, which serves as a testament to your expertise and knowledge.</p>
              <h4>Career Growth:</h4>
              <p>Your certification can be showcased on professional platforms such as LinkedIn, Glassdoor, and other job-related networks to enhance your credibility and improve career opportunities.</p>
              <h4>Stay active, contribute effectively, and keep leveling up!</h4>
            `;

                guidelinesPopup.innerHTML = guidelinesContent;

                const closeGuidelines = document.createElement('span');
                closeGuidelines.className = 'close-guidelines';
                closeGuidelines.innerHTML = '&times;';
                closeGuidelines.addEventListener('click', () => {
                    guidelinesPopup.remove();
                });

                guidelinesPopup.appendChild(closeGuidelines);
                document.body.appendChild(guidelinesPopup);
            });

        });
    } else {
        console.error('superpowersIcon or popupBox is not found in the DOM');
    }
});

// Add event listener for the certificate button
document.addEventListener("click", function (event) {
    if (event.target.classList.contains("cert-btn")) {
        generateCertificate();
    }
});

function generateCertificate() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.certificateName) {
        alert("You need to be logged in to generate a certificate!");
        return;
    }

    const username = user.certificateName;
    const level = user.level || 1;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.src = "Images/certificate-test.jpeg"; // Ensure this path is correct

    img.onload = function () {
        ctx.drawImage(img, 0, 0, 800, 600);

        ctx.font = "30px Arial";
        ctx.fillStyle = "#333";
        ctx.fillText(username, 300, 300);
        ctx.fillText(`Level ${level}`, 300, 350);

        const link = document.createElement("a");
        link.download = `${username}_Certificate.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    img.onerror = function () {
        alert("Error loading certificate template. Check the file path.");
    };
}

// Encryption function using Web Crypto API
// Helper function to convert Uint8Array to Base64
function toBase64(data) {
    return btoa(String.fromCharCode(...new Uint8Array(data)));
}

// Function to generate an AES-GCM key
async function generateKey() {
    return await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Function to encrypt data
async function encryptData(data) {
    const key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv,
        },
        key,
        encodedData
    );

    const exportedKey = await crypto.subtle.exportKey("raw", key);

    return btoa(
        JSON.stringify({
            encrypted: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv),
            key: Array.from(new Uint8Array(exportedKey)),
        })
    );
}