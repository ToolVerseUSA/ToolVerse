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

// Check Grammar Button (VIP PREMIUM LOGIC)
checkBtn.addEventListener('click', async function() {
    const text = inputText.value.trim();
    
    if (text === "") {
        outputText.innerHTML = `<span style="color:#ef4444;">Please enter some text to check!</span>`;
        return;
    }

    // 1. Check if user is logged in (Firebase Auth)
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("🔒 VIP Premium Tool: Please login to use the AI Grammar Checker.");
        // window.location.href = "login.html"; // Uncomment this if you have a login page
        return;
    }

    // 2. Setup Firebase Firestore Reference
    const db = firebase.firestore();
    const userRef = db.collection('users').doc(user.uid);

    // Loading State
    const originalText = this.innerHTML;
    this.innerHTML = "⏳ Connecting to Llama-3...";
    this.disabled = true;
    
    statusBadge.innerText = "Checking Credits...";
    statusBadge.style.background = "#f59e0b"; // Yellow processing

    try {
        // 3. Check User Credits
        const userDoc = await userRef.get();
        if (!userDoc.exists || userDoc.data().credits <= 0) {
            alert("💎 Insufficient Credits! Please mine more credits to use this VIP tool.");
            window.location.href = "mining-node.html"; // Redirect to mining node
            return;
        }

        statusBadge.innerText = "AI Analyzing...";

        // 4. Call Vercel Groq API
        const response = await fetch('/api/groq-handler', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemPrompt: "You are an expert English grammar and spelling checker. Review the following text. Correct any grammatical, spelling, and punctuation errors. Ensure the tone remains natural. Return ONLY the fully corrected text. Do not include any explanations, greetings, or formatting.",
                userPrompt: text
            })
        });

        const data = await response.json();

        if (response.ok && data.result) {
            // Output Result
            outputText.innerText = data.result;

            // 5. Deduct 1 Credit from Firebase
            await userRef.update({
                credits: firebase.firestore.FieldValue.increment(-1)
            });

            // Update Badge for success
            statusBadge.innerText = "💎 VIP Corrected";
            statusBadge.style.background = "#e5322d"; // Red badge for premium look
            
            console.log("1 Credit Deducted. Transaction Successful.");
        } else {
            throw new Error(data.error || "API error occurred");
        }

    } catch (error) {
        console.error("Error:", error);
        outputText.innerHTML = `<span style="color:#ef4444;">⚠️ Something went wrong: ${error.message}</span>`;
        statusBadge.innerText = "Error";
        statusBadge.style.background = "#ef4444";
    } finally {
        // Reset Button
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
    statusBadge.style.background = "#10b981"; // Green
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
