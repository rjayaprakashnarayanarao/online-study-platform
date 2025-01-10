// login.js
window.addEventListener('DOMContentLoaded', () => {
    const errorList = document.getElementById('errors');
    const errors = JSON.parse('<%= JSON.stringify(errors || []) %>');
    if (errors.length > 0) {
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error.message;
            errorList.appendChild(li);
        });
    }
});
