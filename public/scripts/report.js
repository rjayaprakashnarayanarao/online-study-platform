document.getElementById('report-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    const issue = event.target.querySelector('textarea').value;

    if (email && issue) {
        try {
            const response = await fetch('http://localhost:3000/reportBug', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Email: email, Description: issue })
            });
    
            const data = await response.json();
            
            if (response.ok) {
                alert('Thank you for your report. We will look into the issue.');
                event.target.reset(); // Reset only on success
            } else {
                console.error("Error:", data.message);
                alert("Error: " + data.message);
            }
        } catch (error) {
            console.error("Request failed:", error);
            alert("Failed to report bug. Please try again.");
        }
        event.target.reset();
    } else {
        alert('Please fill in all fields.');
    }
});