// Elements
const inputText = document.getElementById('inputText');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const outputText = document.getElementById('outputText');
const statusBadge = document.getElementById('statusBadge');
const copyBtn = document.getElementById('copyBtn');
const fixMode = document.getElementById('fixMode');

// Live Word & Character Count
inputText.addEventListener('input', function() {
    const text = this.value;
    charCount.innerText = `${text.length} characters`;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    wordCount.innerText = `${words.length} words`;
});

// Check Grammar Button (FAST LOCALSTORAGE CREDITS)
checkBtn.addEventListener('click', async function() {
    const text = inputText.value.trim();
    const selectedMode = fixMode.value;
    
    if (text === "") {
        outputText.innerHTML = `<span style="color:#ef4444;">Please enter some text to check!</span>`;
        return;
    }

    // ==========================================
    // VVIP AUTH & FAST CREDIT CHECK (0ms Delay)
    // ==========================================
    const isAuth = localStorage.getItem('ToolVerse_Auth') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
    if (!isAuth) {
        alert("🔒 Please login from the Dashboard to use Premium Tools.");
        window.location.href = "index.html";
        return;
    }

    let currentCredits = parseInt(localStorage.getItem('tv_agent_credits') || "0");
    if (currentCredits <= 0) {
        alert("🎁 You have run out of Credits!");
        outputText.innerHTML = `<span style="color:#ef4444;">Insufficient Credits. Please upgrade in Dashboard.</span>`;
        statusBadge.innerText = "No Credits";
        statusBadge.style.background = "#ef4444";
        this.innerHTML = "✨ Fix Grammar";
        this.disabled = false;
        return; 
    }

    // Loading State
    this.innerHTML = "⏳ AI Analyzing...";
    this.disabled = true;
    
    statusBadge.innerText = "Processing...";
    statusBadge.style.background = "#f59e0b";

    try {
        // Deduct 1 Credit instantly on UI
        currentCredits -= 1; 
        localStorage.setItem('tv_agent_credits', currentCredits);
        
        statusBadge.innerText = "AI Fixing Grammar...";

        // Dynamic Prompt based on Tone
        const dynamicPrompt = `You are an expert English grammar and spelling checker. Review the following text and apply a '${selectedMode}' tone. Correct any grammatical, spelling, and punctuation errors. Return ONLY the fully corrected text. Do not include any explanations, greetings, or extra formatting.`;

        // Call Vercel Groq API
        const response = await fetch('/api/groq-handler', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemPrompt: dynamicPrompt,
                userPrompt: text
            })
        });

        const data = await response.json();

        if (response.ok && data.result) {
            // Output Result
            outputText.innerText = data.result;

            // Update Badge
            statusBadge.innerText = `✨ ${selectedMode} Applied`;
            statusBadge.style.background = "#10b981";
            
        } else {
            throw new Error(data.error || "API error occurred");
        }

    } catch (error) {
        console.error("Error:", error);
        outputText.innerHTML = `<span style="color:#ef4444;">⚠️ Something went wrong: ${error.message}</span>`;
        statusBadge.innerText = "Error";
        statusBadge.style.background = "#ef4444";
    } finally {
        this.innerHTML = "✨ Fix Grammar";
        this.disabled = false;
    }
});

// Clear Button
clearBtn.addEventListener('click', function() {
    inputText.value = "";
    wordCount.innerText = "0 words";
    charCount.innerText = "0 characters";
    outputText.innerHTML = `<div class="empty-state">✍️ Your flawless, error-free text will appear here.</div>`;
    statusBadge.innerText = "Ready ✨";
    statusBadge.style.background = "#10b981";
});

// Copy Text
copyBtn.addEventListener('click', function() {
    const textToCopy = outputText.innerText;
    
    if (textToCopy.includes("Your flawless, error-free text") || textToCopy.includes("⚠️ Something went wrong")) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const status = document.getElementById('copyStatus');
        if(status) {
            status.classList.add('show');
            setTimeout(() => { status.classList.remove('show'); }, 2000);
        } else {
            alert("Copied to clipboard!");
        }
    });
});
