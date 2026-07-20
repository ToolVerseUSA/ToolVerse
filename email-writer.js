document.getElementById('generateEmailBtn').addEventListener('click', function() {
    
    // Get values from inputs
    const sender = document.getElementById('senderName').value || "[Your Name]";
    const recipient = document.getElementById('recipientName').value || "[Recipient Name]";
    const subject = document.getElementById('emailSubject').value || "[No Subject]";
    const tone = document.getElementById('emailTone').value;
    const purpose = document.getElementById('emailPurpose').value;

    // Output Elements
    const outRecipient = document.getElementById('outRecipient');
    const outSubject = document.getElementById('outSubject');
    const outBody = document.getElementById('outBody');

    // Update Header
    outRecipient.innerText = recipient;
    outSubject.innerText = subject;

    // Loading State
    const originalBtnText = this.innerHTML;
    this.innerHTML = "⏳ Generating...";
    this.disabled = true;

    // Simulate AI Generation Delay (1.5 seconds)
    setTimeout(() => {
        
        let generatedBody = "";

        if (purpose.trim() === "") {
            generatedBody = "Please provide the main purpose of your email in the input box so the AI can generate a complete message.";
        } else {
            // Very basic template generation based on tone
            if (tone === "Professional") {
                generatedBody = `Dear ${recipient},\n\nI hope this email finds you well.\n\n${purpose}\n\nShould you need any further information, please feel free to let me know.\n\nBest regards,\n${sender}`;
            } 
            else if (tone === "Friendly") {
                generatedBody = `Hi ${recipient},\n\nHope you're having a great day!\n\nI just wanted to reach out because ${purpose}.\n\nLet me know what you think when you have a moment.\n\nBest,\n${sender}`;
            }
            else if (tone === "Persuasive") {
                generatedBody = `Hello ${recipient},\n\nI am reaching out to share an exciting opportunity with you.\n\n${purpose}\n\nI would love to schedule a quick call to discuss how this can benefit you. Please let me know your availability.\n\nWarm regards,\n${sender}`;
            }
            else {
                generatedBody = `Dear ${recipient},\n\nI sincerely hope you are doing well.\n\nI am writing to express my apologies. ${purpose}\n\nThank you for your understanding and patience in this matter.\n\nSincerely,\n${sender}`;
            }
        }

        // Output the generated email
        outBody.innerText = generatedBody;

        // Reset Button
        this.innerHTML = originalBtnText;
        this.disabled = false;

    }, 1500); // 1.5 second delay
});

// Copy to Clipboard Functionality
document.getElementById('copyBtn').addEventListener('click', function() {
    const emailText = document.getElementById('outBody').innerText;
    
    if(emailText.includes("Click \"Generate Email\"")) return; // Don't copy placeholder

    navigator.clipboard.writeText(emailText).then(() => {
        const status = document.getElementById('copyStatus');
        status.classList.add('show');
        
        setTimeout(() => {
            status.classList.remove('show');
        }, 2000);
    });
});
