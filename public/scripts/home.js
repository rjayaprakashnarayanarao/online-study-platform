let roomType = null;

document.addEventListener("DOMContentLoaded", () => {
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
});

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

async function join() {
    const code = document.getElementById("join-code").value.trim();

    if (!code) {
        alert("Please enter the correct code to join the room");
        return;
    }

    try {
        // Encrypt the room code before redirecting
        const encryptedCode = await encryptData(code);
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
    
    if ( !roomName || !roomType) {
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
            console.log("Encrypted Data: ",encryptedData);


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
        console.log('superpowersIcon clicked');
  
        const popupContent = popupBox.querySelector('.popup-content');
        popupContent.innerHTML = ''; // Clear the previous content
        
        const userData = localStorage.getItem("user");
        if (userData && JSON.parse(userData).name) {
          console.log('user is logged in');
  
          const progressData = {
            Quizdom: 29, // Example value
            Analytix: 10, // Example value
            Rebuff: 5 // Example value
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

            progressBar.style.background = `conic-gradient(${progressColor} ${
                startValue * 3.6
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
      });
    } else {
      console.error('superpowersIcon or popupBox is not found in the DOM');
    }
});


// Encryption function using Web Crypto API
async function encryptData(data) {
    const key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    // Convert data to a JSON string and then to a Uint8Array
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));

    // Generate a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv,
        },
        key,
        encodedData
    );

    // Export the key for transmission/storage
    const exportedKey = await crypto.subtle.exportKey("raw", key);

    // Return encrypted data, IV, and key as a Base64 string
    return btoa(
        JSON.stringify({
            encrypted: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv),
            key: Array.from(new Uint8Array(exportedKey)),
        })
    );
}
