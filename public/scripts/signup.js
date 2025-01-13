document.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission

    const errorsList = document.getElementById("errors");
    errorsList.innerHTML = ""; // Clear previous errors

    // Collect form data
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;

    // Validate inputs
    if (password !== password2) {
        const errorItem = document.createElement("li");
        errorItem.textContent = "Passwords do not match.";
        errorsList.appendChild(errorItem);
        return;
    }

    const signupData = {
        name: name,
        email: email,
        password: password,
    };

    try {
        // Send POST request to the signup endpoint
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(signupData),
        });

        const result = await response.json();

        if (response.ok) {
            // Handle successful signup
            alert("Signup successful! Please log in.");
            console.log(result);

            // Optionally redirect to the login page
            window.location.href = "login.html";
        } else {
            // Display errors from the server
            const errorMessage = result.message || "Signup failed. Please try again.";
            const errorItem = document.createElement("li");
            errorItem.textContent = errorMessage;
            errorsList.appendChild(errorItem);
        }
    } catch (error) {
        // Handle network or other errors
        const errorItem = document.createElement("li");
        errorItem.textContent = "An error occurred. Please try again later.";
        errorsList.appendChild(errorItem);
        console.error("Signup error:", error);
    }
});
