document.getElementById('resetPasswordBtn').addEventListener('click', function () {
    const email = document.getElementById('identifier').value;

    // Validation
    if (!email) {
        alert('Please enter a valid email address.');
        return;
    }

    // Prepare the data to be sent
    const data = { email };

    // Make a POST request
    fetch('http://localhost:3000/api/auth/forgetPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        console.log("result: ",result);
                
        if (result.type =="success") {
            //set emailID in localstorage
            sessionStorage.setItem('email', email);
            //redirect to verificationPage.html
            window.location.href = 'verificationPage.html';
            // alert('Password reset link sent to your email.');
        } else {
            alert('Failed to reset password. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
});
