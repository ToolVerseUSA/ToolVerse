document.getElementById('generateEmailBtn').addEventListener('click', function() {
    
    // Get values from inputs
    const sender = document.getElementById('senderName').value.trim() || "[Your Name]";
    const recipient = document.getElementById('recipientName').value.trim() || "[Recipient Name]";
    const subject = document.getElementById('emailSubject').value.trim() || "[No Subject]";
    const tone = document.getElementById('emailTone').value;
    const purpose = document.getElementById('emailPurpose').value.trim();

    // Output Elements
    const outRecipient = document.getElementById('outRecipient');
    const outSubject = document.getElementById('outSubject');
    const outBody = document.getElementById('outBody');

    if (purpose === "") {
        alert("Please provide the main purpose of your email in the input box.");
        return;
    }

    const btn = this;
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = "⏳ Authenticating...";
    btn.disabled = true;

    // Update Header
    outRecipient.innerText = recipient;
    outSubject.innerText = subject;

    // Bulletproof Firebase Auth Check
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
        unsubscribe(); // Run only once on click to prevent multiple triggers
        
        if (!user) {
            alert("🔒 Please login to use the AI Email Writer.");
            window.location.href = "index.html"; // Redirect to home/login
            return;
        }

        btn.innerHTML = "⏳ Generating AI Email...";
        outBody.innerText = "Connecting to Llama-3... Please wait.";

        try {
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(user.uid);
            
            // Check Only FREE CREDITS
            const userDoc = await userRef.get();
            const userData = userDoc.data() || {};
            const freeCredits = userData.free_credits || 0;

            if (!userDoc.exists || freeCredits <= 0) {
                alert("🎁 You have run out of Daily Free Credits! Please claim your daily free credits to continue.");
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
                outBody.innerText = "Insufficient Free Credits. Mining tokens are safe!";
                return;
            }

            // Prompt Setup
            const systemPrompt = `You are an expert professional email copywriter. Write a highly effective, well-structured, and engaging email. Tone: ${tone}. Do not include the subject line in the body. Do not include any explanations or intro text, just provide the actual email body.`;
            const userPrompt = `Sender Name: ${sender}\nRecipient Name: ${recipient}\nEmail Purpose: ${purpose}`;

            // Call Groq API
            const response = await fetch('/api/groq-handler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt: systemPrompt, userPrompt: userPrompt })
            });

            const data = await response.json();

            if (response.ok && data.result) {
                outBody.innerText = data.result;
                
                // Deduct ONLY 1 Free Credit (Mining Balance remains Safe!)
                await userRef.update({
                    free_credits: firebase.firestore.FieldValue.increment(-1)
                });
                console.log("1 Free Credit Deducted. Mining Tokens are Safe!");
            } else {
                throw new Error(data.error || "API error occurred");
            }

        } catch (error) {
            console.error("Error:", error);
            outBody.innerText = `⚠️ Something went wrong: ${error.message}`;
        } finally {
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
        }
    });
});

// Copy to Clipboard Functionality
document.getElementById('copyBtn').addEventListener('click', function() {
    const emailText = document.getElementById('outBody').innerText;
    
    if(emailText.includes("Click \"Generate Email\"") || emailText.includes("⚠️ Something went wrong")) return;

    navigator.clipboard.writeText(emailText).then(() => {
        const status = document.getElementById('copyStatus');
        if(status) {
            status.classList.add('show');
            setTimeout(() => { status.classList.remove('show'); }, 2000);
        } else {
            alert("Email Copied!");
        }
    });
});
