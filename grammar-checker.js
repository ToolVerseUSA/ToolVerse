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

// Check Grammar Button (FREE CREDITS ONLY LOGIC)
checkBtn.addEventListener('click', async function() {
    const text = inputText.value.trim();
    const selectedMode = fixMode.value;
    
    if (text === "") {
        outputText.innerHTML = `<span style="color:#ef4444;">Please enter some text to check!</span>`;
        return;
    }

    // 1. Check if user is logged in
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("🔒 Please login to use the AI Grammar Checker.");
        window.location.href = "index.html";
        return;
    }

    // 2. Setup Firebase Firestore Reference
    const db = firebase.firestore();
    const userRef = db.collection('users').doc(user.uid);

    // Loading State
    this.innerHTML = "⏳ Connecting to Llama-3...";
    this.disabled = true;
    
    statusBadge.innerText = "Checking Free Credits...";
    statusBadge.style.background = "#f59e0b";

    try {
        // 3. Check Only FREE CREDITS
        const userDoc = await userRef.get();
        const userData = userDoc.data() || {};
        const freeCredits = userData.free_credits || 0;

        if (!userDoc.exists || freeCredits <= 0) {
            alert("🎁 You have run out of Daily Free Credits! Please claim your daily free credits to continue.");
            this.innerHTML = "✨ Fix Grammar";
            this.disabled = false;
            statusBadge.innerText = "No Free Credits";
            statusBadge.style.background = "#ef4444";
            return;
        }

        statusBadge.innerText = "AI Analyzing...";

        // 4. Dynamic Prompt based on Tone
        const dynamicPrompt = `You are an expert English grammar and spelling checker. Review the following text and apply a '${selectedMode}' tone. Correct any grammatical, spelling, and punctuation errors. Return ONLY the fully corrected text. Do not include any explanations, greetings, or extra formatting.`;

        // 5. Call Vercel Groq API
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

            // 6. Deduct ONLY 1 Free Credit (Mining Tokens Safe)
            await userRef.update({
                free_credits: firebase.firestore.FieldValue.increment(-1)
            });

            // Update Badge
            statusBadge.innerText = `✨ ${selectedMode} Applied`;
            statusBadge.style.background = "#10b981";
            
            console.log("1 Free Credit Deducted. Mining Tokens are safe!");
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
