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

function join() {
    const code = document.getElementById("join-code").value;
    if (code) {
        window.location.href = `room.html?code=${encodeURIComponent(code)}`; // Redirect without showPopup
    } else {
        alert("Please enter the correct code to join the room");
    }
}

async function createRoom() {
    const creatorName = document.getElementById("creator-name").value.trim();
    const roomName = document.getElementById("create-name").value.trim();

    if (!creatorName || !roomName || !roomType) {
        alert("Please fill in all fields.");
        return;
    }
    const userString = localStorage.getItem("user"); // Retrieve the string from localStorage
    const user = userString ? JSON.parse(userString) : null; // Parse the string into an object
    const admin_name = user ? user.name : null; // Safely access the name property
    
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

        if (response.status == 201) {
            console.log("response: ",result);
            
            // Redirect to room.html with room details
            window.location.href = `room.html?roomName=${encodeURIComponent(result.room_name)}&roomNumber=${encodeURIComponent(result.room_id)}`;
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

// to show info of the user
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
  
          const Quizdom = document.createElement('p');
          const Analytix = document.createElement('p');
          const Rebuff = document.createElement('p');

          const progressData = {
            Quizdom: 29, // Example value
            Analytix: 10, // Example value
            Rebuff: 5 // Example value
        };

        // Update progress bars after the content is loaded
        updateProgressBar('quizdom', progressData.Quizdom);
        updateProgressBar('analytix', progressData.Analytix);
        updateProgressBar('rebuff', progressData.Rebuff);
  
        Quizdom.textContent = `Quizdom: ${progressData.Quizdom}`;
        Analytix.textContent = `Analytix: ${progressData.Analytix}`;
        Rebuff.textContent = `Rebuff: ${progressData.Rebuff}`;

        popupContent.appendChild(Quizdom);
        popupContent.appendChild(Analytix);
        popupContent.appendChild(Rebuff);
        
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

  function updateProgressBar(className, progress) {
    // Correct selector to target the circle element inside the SVG
    const circle = document.querySelector(`.circle-${className}`);
    
    // Debugging: Log the selector and element
    console.log(`Selector: .circle-${className} .progress-ring-bar .${className}`, circle);

    if (!circle) {
        console.error(`Circle element with class circle-${className} not found`);
        return;
    }

    // Calculate the progress bar offset
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = circumference;
    const offset = circumference - (progress / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Update the progress text
    const progressText = document.querySelector(`.circle-${className} .progress-text`);
    if (progressText) {
        progressText.textContent = `${progress}%`;
    }
}