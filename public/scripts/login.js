document.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const errorsList = document.getElementById("errors");
    errorsList.innerHTML = ""; // Clear previous errors

    const formData = new FormData(event.target);
    const loginData = {
        email: formData.get("email"),
        password: formData.get("password"),
    };

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(loginData),
        });

        const result = await response.json();

        if (response.ok) {
            // alert("Login successful!");
            console.log(result);
            localStorage.setItem("authToken", result.token);

            // Optionally store user details (avoid sensitive information like passwords)
            localStorage.setItem("user", JSON.stringify(result.user));
            window.location.href = "/index.html"; // Redirect to another page
        } else {
            const errorMessage = result.message || "Login failed. Please try again.";
            const errorItem = document.createElement("li");
            errorItem.textContent = errorMessage;
            errorsList.appendChild(errorItem);
        }
    } catch (error) {
        const errorItem = document.createElement("li");
        errorItem.textContent = "An error occurred. Please try again later.";
        errorsList.appendChild(errorItem);
        console.error("Login error:", error);
    }
});
