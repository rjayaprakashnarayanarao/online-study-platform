document.getElementById('report-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    const issue = event.target.querySelector('textarea').value;

    if (email && issue) {
        alert('Thank you for your report. We will look into the issue.');
        event.target.reset();
    } else {
        alert('Please fill in all fields.');
    }
});