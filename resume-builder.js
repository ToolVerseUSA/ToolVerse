// Function to update the preview instantly
function updatePreview(inputId, previewId, placeholderText) {
    const inputElement = document.getElementById(inputId);
    const previewElement = document.getElementById(previewId);

    // Listen for typing events
    inputElement.addEventListener('input', function() {
        if (this.value.trim() === '') {
            previewElement.innerText = placeholderText; // Show placeholder if empty
        } else {
            previewElement.innerText = this.value; // Show actual typed text
        }
    });
}

// Map the Inputs to the Preview areas
document.addEventListener("DOMContentLoaded", function() {
    updatePreview('nameInput', 'previewName', 'Imran Khan');
    updatePreview('titleInput', 'previewTitle', 'Freelance Digital Media Specialist');
    updatePreview('emailInput', 'previewEmail', 'you@email.com');
    updatePreview('phoneInput', 'previewPhone', '+92 300 0000000');
    updatePreview('addressInput', 'previewAddress', 'Hyderabad, Sindh, Pakistan');
    
    updatePreview('summaryInput', 'previewSummary', 'A brief summary of your professional background and goals will appear here.');
    updatePreview('skillsInput', 'previewSkills', 'YouTube SEO, Digital Graphic Design, AI Productivity Tools');
    updatePreview('experienceInput', 'previewExperience', 'Your detailed work experience will appear here as you type.');
    updatePreview('educationInput', 'previewEducation', 'Your educational background will appear here.');
});
