// Elements
const inputText = document.getElementById('inputText');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const outputText = document.getElementById('outputText');
const statusBadge = document.getElementById('statusBadge');
const copyBtn = document.getElementById('copyBtn');

// Live Word & Character Count
inputText.addEventListener('input', function() {
    const text = this.value;
    
    // Character Count
    charCount.innerText = `${text.length} characters`;
    
    // Word Count
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    wordCount.innerText = `${words.length} words`;
});

// Check Grammar Button
checkBtn.addEventListener('click', function() {
    const text = inputText.value.trim();
    
    if (text === "") {
        outputText.innerHTML = `<span style="color:#ef4444;">Please enter some text to check!</span>`;
        return;
    }

    // Loading State
    const originalText = this.innerHTML;
    this.innerHTML = "⏳ Checking...";
    this.disabled = true;
    
    statusBadge.innerText = "Analyzing...";
    statusBadge.style.background = "#f59e0b"; // Yellow/Orange processing

    // Simulate AI Processing (1.2 seconds)
    setTimeout(() => {
        
        // Mock Grammar Fix: Capitalize first letter of string and add period if missing
        let fixedText = text.charAt(0).toUpperCase() + text.slice(1);
        if (!fixedText.match(/[.!?]$/)) {
            fixedText += ".";
        }

        // Output Result
        outputText.innerText = fixedText;

        // Update Badge randomly for mock effect (e.g., "3 Issues Fixed")
        const mockIssues = Math.floor(Math.random() * 4) + 1; 
        statusBadge.innerText = `${mockIssues} Issues Fixed`;
        statusBadge.style.background = "#e5322d"; // Red badge for fixed issues

        // Reset Button
        this.innerHTML = "✨ Fix Grammar";
        this.disabled = false;

    }, 1200);
});

// Clear Button
clearBtn.addEventListener('click', function() {
    inputText.value = "";
    wordCount.innerText = "0 words";
    charCount.innerText = "0 characters";
    outputText.innerHTML = `<div class="empty-state">✍️ Your flawless, error-free text will appear here.</div>`;
    statusBadge.innerText = "Perfect 💯";
    statusBadge.style.background = "#10b981";
});

// Copy Text
copyBtn.addEventListener('click', function() {
    const textToCopy = outputText.innerText;
    
    if (textToCopy.includes("Your flawless, error-free text")) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const status = document.getElementById('copyStatus');
        status.classList.add('show');
        setTimeout(() => { status.classList.remove('show'); }, 2000);
    });
});
