console.log("This site is under RJP's rule");

// Function to display an error message
function displayErrorMessage(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.innerText = message;
}

// Function to handle form submission
function handleFormSubmission(event) {
    event.preventDefault(); // Prevent default form submission behavior

    //get emailID from localstorage
    var emailID = sessionStorage.getItem("email");
    console.log("emailID:",emailID);
    
    const otp = document.getElementById('otp').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate password and confirm password
    if (password !== confirmPassword) {
        displayErrorMessage('Passwords do not match!');
        return;
    }

    // Prepare data for the server
    const data = {emailID, otp, password };

    console.log("Data: ",data);
    

    // Send data to the server
    fetch('/api/auth/verifyOtpForPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(result => {
            console.log("result: ",result);
            
            if (result.user.success) {
                // alert('Password reset successful!');
                window.location.href = 'login.html'; // Redirect to login page
            } else {
                displayErrorMessage(result.message || 'Failed to reset password. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayErrorMessage('An error occurred. Please try again later.');
        });
}

// Display error message on page load based on query parameters
window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get('error');
    if (errorMessage) {
        displayErrorMessage(errorMessage);
    }

    // Attach event listener to the submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.addEventListener('click', handleFormSubmission);
};
