document.getElementById('resetPasswordBtn').addEventListener('click', function () {
    const role = document.getElementById('role').value;
    const email = document.getElementById('identifier').value;

    // Validation
    if (!email) {
        alert('Please enter a valid email address.');
        return;
    }

    // Prepare the data to be sent
    const data = { role, email };

    // Make a POST request
    fetch('/forgetPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Password reset link sent to your email.');
        } else {
            alert('Failed to reset password. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
});
