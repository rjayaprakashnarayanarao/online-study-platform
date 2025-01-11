document.addEventListener('DOMContentLoaded', function() {
    // Initially show the Materials section and highlight it
    showSection('materials');

    const defaultMenuItem = document.querySelector('.menu .item:nth-child(1)'); // Assume Materials is the first item
    if (defaultMenuItem) {
        defaultMenuItem.classList.add('active', 'highlight');
    }

    // Add event listeners to menu items
    const menuItems = document.querySelectorAll('.menu .item');
    menuItems.forEach((menuItem) => {
        menuItem.addEventListener('click', () => {
            // Remove active and highlight classes from all menu items
            menuItems.forEach((item) => item.classList.remove('active', 'highlight'));
            // Add active and highlight classes to the clicked menu item
            menuItem.classList.add('active', 'highlight');
            // Show the relevant section
            const sectionName = menuItem.textContent.trim().toLowerCase().replace(' ', '-');
            showSection(sectionName);
        });
    });

    // Add event listener to the upload area
    const uploadArea = document.querySelector('.upload-area');
    uploadArea.addEventListener('click', () => {
        // Open file upload dialog
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.click();
    });

    // Add event listener to the back button in the header
    const backButton = document.querySelector('.card-back-button');
    backButton.addEventListener('click', () => {
        // Go back to the room page
        window.location.href = 'room.html';
    });

    // Add event listeners to sub-menu items
    const subMenuItems = document.querySelectorAll('.sub-menu .step .item');
    subMenuItems.forEach((subMenuItem) => {
        subMenuItem.addEventListener('click', () => {
            // Clear highlights from all sub-menu items
            subMenuItems.forEach((item) => item.classList.remove('highlight'));

            // Add highlight class to the clicked item if it's 'Study Plan', 'Resource Online', or 'Materials'
            if (['STUDY PLAN', 'RESOURCE ONLINE', 'MATERIALS'].includes(subMenuItem.textContent.trim())) {
                subMenuItem.classList.add('highlight');
            }

            // Hide the main content area
            const mainContent = document.querySelector('.content');
            mainContent.style.display = 'none';

            // Remove existing content if present
            document.querySelector('.new-content')?.remove();

            // Create a new content area for the clicked item
            const newContent = document.createElement('div');
            newContent.className = 'new-content';

            // Define the content for each sub-menu item
            switch (subMenuItem.textContent.trim()) {
                case 'STUDY PLAN':
                    newContent.innerHTML = `
                        <style>
                            .back-button {
                                font-size: 24px;
                                cursor: pointer;
                                margin-bottom: 20px;
                            }
                            .button-container {
                                display: flex;
                                justify-content: space-between;
                                margin-top: 20px;
                            }
                            .button {
                                width: 30%;
                                height: 40px;
                                border: none;
                                border-radius: 5px;
                                background-color: #4CAF50;
                                color: #fff;
                                cursor: pointer;
                            }
                            .button:hover {
                                background-color: #3e8e41;
                            }
                            .highlight {
                                background-color: #ffffcc;
                                border: 2px solid #ffcc00;
                                border-radius: 5px;
                                padding: 10px;
                            }
                        </style>
                        <div class="content">
                            <div class="back-button card-back-button">BACK</div>
                            <h2>EXISTING PLANS</h2>
                            <div class="inner-box">
                                <div class="button-container">
                                    <input type="text" id="unit-name" placeholder="Unit Name">
                                    <input type="text" id="duration" placeholder="Duration">
                                </div>
                                <button class="button" id="enter-btn" style="margin-top: 20px; width: 100%;">Enter</button>
                            </div>
                        </div>
                    `;
                    newContent.querySelector('#enter-btn').addEventListener('click', () => {
                        const unitName = newContent.querySelector('#unit-name').value;
                        const duration = newContent.querySelector('#duration').value;
                        console.log(`Unit Name: ${unitName}, Duration: ${duration}`);
                    });
                    break;
                case 'RESOURCE ONLINE':
                    newContent.innerHTML = `
                        <style>
                            .back-button {
                                font-size: 24px;
                                cursor: pointer;
                                margin-bottom: 20px;
                            }
                            .button-container {
                                display: flex;
                                justify-content: space-between;
                                margin-top: 20px;
                            }
                            .button {
                                width: 30%;
                                height: 40px;
                                border: none;
                                border-radius: 5px;
                                background-color: #4CAF50;
                                color: #fff;
                                cursor: pointer;
                            }
                            .button:hover {
                                background-color: #3e8e41;
                            }
                            .highlight {
                                background-color: #ffffcc;
                                border: 2px solid #ffcc00;
                                border-radius: 5px;
                                padding: 10px;
                            }
                        </style>
                        <div class="content">
                            <div class="back-button card-back-button">BACK</div>
                            <h2>E-LINKS</h2>
                            <div class="inner-box">
                                <div class="button-container">
                                    <input type="text" placeholder="Link:">
                                    <input type="text" placeholder="For:">
                                </div>
                                <button class="button" style="margin-top: 20px; width: 100%;">Enter</button>
                            </div>
                        </div>
                    `;
                    newContent.querySelector('button').addEventListener('click', () => {
                        const link = newContent.querySelector('input[placeholder="Link:"]').value;
                        const forWhat = newContent.querySelector('input[placeholder="For:"]').value;
                        console.log(`Link: ${link}, For: ${forWhat}`);
                    });
                    break;
                case 'MATERIALS':
                    newContent.innerHTML = `
                        <div class="content">
                            <div class="back-button card-back-button">BACK</div>
                            <div class="upload-area">
                                <div class="upload-icon">+</div>
                                <div class="upload-text">CLICK TO UPLOAD</div>
                            </div>
                        </div>
                    `;
                    newContent.querySelector('.upload-area').addEventListener('click', () => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.click();

                        fileInput.addEventListener('change', () => {
                            const fileName = fileInput.files[0]?.name || 'No file selected';
                            alert(`File Uploaded: ${fileName}`);
                        });
                    });
                    break;
                default:
                    newContent.textContent = 'No additional content available.';
            }

            // Add the new content area to the main container
            const mainContentContainer = document.querySelector('.main-content');
            mainContentContainer.appendChild(newContent);
        });
    });
});

// Function to show a specific section
function showSection(section) {
    // Hide all sections
    const sections = document.querySelectorAll('.content .section');
    sections.forEach(sec => sec.style.display = 'none');

    // Show the selected section
    const selectedSection = document.querySelector(`.content .${section}`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
}

// Event listener for the card back button to navigate to the previous section
document.querySelector('.card-back-button')?.addEventListener('click', function() {
    const sections = document.querySelectorAll('.content .section');
    let currentIndex = -1;

    sections.forEach((sec, index) => {
        if (sec.style.display === 'block') {
            currentIndex = index;
        }
    });

    if (currentIndex > 0) {
        const previousSection = document.querySelectorAll('.content .section')[currentIndex - 1];
        if (previousSection) {
            previousSection.style.display = 'block';
        }
    } else if (currentIndex === 0) {
        // If on the first section, hide all sections and show the main content
        const mainContent = document.querySelector('.main-content');
        mainContent.style.display = 'block';
        document.querySelector('.new-content')?.remove(); // Remove the new content area if present
    }
});