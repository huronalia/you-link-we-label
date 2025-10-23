// Configuration
const CONFIG = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw7VfeVe0po3pPWMZoLOAfLERfEJqhcRokzP8exXLI0t-IL48DKHRp6bXpPNWnTmFHk/exec', // Replace with your Google Apps Script URL
    LOCATION_ROTATE_INTERVAL: 5000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    TOTAL_LOCATIONS: 14
};

// State
let currentLocationIndex = 0;
let fileData = null;

// DOM Elements
const elements = {
    locationSlider: null,
    fileInput: null,
    fileLabel: null,
    annotationForm: null,
    status: null,
    submitBtn: null
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Cache DOM elements
    cacheElements();

    // Setup event listeners
    setupLocationRotation();
    setupFileUpload();
    setupFormSubmission();
}

function cacheElements() {
    elements.locationSlider = document.getElementById('location-slider');
    elements.fileInput = document.getElementById('exampleFile');
    elements.fileLabel = document.getElementById('fileLabel');
    elements.annotationForm = document.getElementById('annotationForm');
    elements.status = document.getElementById('status');
    elements.submitBtn = document.getElementById('submitBtn');
}

// Location rotation functionality
function setupLocationRotation() {
    if (!elements.locationSlider) return;

    setInterval(rotateLocation, CONFIG.LOCATION_ROTATE_INTERVAL);
}

function rotateLocation() {
    currentLocationIndex++;
    const offset = currentLocationIndex * -20;

    // Apply transformation
    if (elements.locationSlider) {
        elements.locationSlider.style.transform = `translateY(${offset}px)`;
    }

    // Reset to beginning seamlessly when reaching the end
    if (currentLocationIndex === CONFIG.TOTAL_LOCATIONS) {
        setTimeout(() => resetSlider(), 600);
    }
}

function resetSlider() {
    if (!elements.locationSlider) return;

    // Disable transition
    elements.locationSlider.style.transition = 'none';

    // Reset position
    currentLocationIndex = 0;
    elements.locationSlider.style.transform = 'translateY(0px)';

    // Re-enable transition
    setTimeout(() => {
        elements.locationSlider.style.transition = 'transform 0.6s ease-in-out';
    }, 50);
}

// File upload functionality
function setupFileUpload() {
    if (!elements.fileInput || !elements.fileLabel) return;

    elements.fileInput.addEventListener('change', handleFileChange);
}

function handleFileChange(event) {
    const file = event.target.files[0];

    if (!file) {
        resetFileUpload();
        return;
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
        alert('File size must be less than 10MB');
        resetFileUpload();
        return;
    }

    elements.fileLabel.textContent = file.name;

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
        fileData = {
            data: btoa(e.target.result),
            name: file.name,
            type: file.type
        };
    };
    reader.readAsBinaryString(file);
}

function resetFileUpload() {
    elements.fileInput.value = '';
    elements.fileLabel.textContent = 'Click to upload';
    fileData = null;
}

// Form submission functionality
function setupFormSubmission() {
    if (!elements.annotationForm) return;

    elements.annotationForm.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL === 'YOUR_WEB_APP_URL_HERE') {
        showStatus('error', 'Please configure the Google Apps Script URL first');
        return;
    }

    // Show loading state
    showStatus('loading', 'Sending your submission...');
    elements.submitBtn.disabled = true;

    // Collect form data
    const formData = collectFormData();

    // Add file data if available
    if (fileData) {
        formData.fileData = fileData.data;
        formData.fileName = fileData.name;
        formData.fileType = fileData.type;
    }

    try {
        await submitForm(formData);
        handleSubmitSuccess();
    } catch (error) {
        handleSubmitError(error);
    }
}

function collectFormData() {
    return {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        institution: document.getElementById('institution').value,
        dataLink: document.getElementById('dataLink').value,
        description: document.getElementById('description').value
    };
}
async function submitForm(data) {
    return new Promise((resolve) => {
        // Create a temporary form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = CONFIG.SCRIPT_URL;
        form.target = 'hidden_iframe';
        form.style.display = 'none';

        // Add each field as a separate input
        Object.keys(data).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data[key] || '';
            form.appendChild(input);
        });

        // Create hidden iframe if it doesn't exist
        let iframe = document.getElementById('hidden_iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'hidden_iframe';
            iframe.name = 'hidden_iframe';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
        }

        // Handle iframe load (submission complete)
        iframe.onload = () => {
            setTimeout(() => {
                if (form.parentNode) {
                    document.body.removeChild(form);
                }
                resolve();
            }, 500);
        };

        // Submit form
        document.body.appendChild(form);
        form.submit();
    });
}

function handleSubmitSuccess() {
    showStatus('success', 'Thank you! Your submission has been received. We will review it and get back to you soon.');
    elements.annotationForm.reset();
    resetFileUpload();

    // Re-enable submit button after delay
    setTimeout(() => {
        elements.submitBtn.disabled = false;
    }, 3000);
}

function handleSubmitError(error) {
    console.error('Form submission error:', error);
    showStatus('error', 'Error sending submission. Please try again or contact support.');
    elements.submitBtn.disabled = false;
}

function showStatus(type, message) {
    if (!elements.status) return;

    elements.status.className = `status ${type}`;
    elements.status.textContent = message;
}