document.addEventListener('DOMContentLoaded', () => {
    
    const generateBtn = document.getElementById('generateEmailBtn');
    
    if (!generateBtn) {
        console.error("Button not found! Check HTML IDs.");
        return;
    }

    generateBtn.addEventListener('click', () => {
        
        // Get values from inputs
        const sender = document.getElementById('senderName').value.trim() || "[Your Name]";
        const recipient = document.getElementById('recipientName').value.trim() || "[Recipient Name]";
        const subject = document.getElementById('emailSubject').value.trim() || "[No Subject]";
        const tone = document.getElementById('emailTone').value;
        const purpose = document.getElementById('emailPurpose').value.trim();

        const outRecipient = document.getElementById('outRecipient');
        const outSubject = document.getElementById('outSubject');
        const outBody = document.getElementById('outBody');

        if (purpose === "") {
            alert("Please provide the main purpose of your email in the input box.");
            return;
        }

        const originalBtnText = generateBtn.innerHTML;
        generateBtn.innerHTML = "⏳ Checking Auth...";
        generateBtn.disabled = true;

        outRecipient.innerText = recipient;
        outSubject.innerText = subject;

        // Firebase Auth & Groq API Logic
        const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
            unsubscribe(); // Run only once

            if (!user) {
                alert("🔒 Please login to use the AI Email Writer.");
                window.location.href = "index.html"; 
                return;
            }

            generateBtn.innerHTML = "⏳ Generating AI Email...";
            outBody.innerText = "Connecting to Llama-3... Please wait.";

            try {
                const db = firebase.firestore();
                const userRef = db.collection('users').doc(user.uid);
                
                const userDoc = await userRef.get();
                const freeCredits = userDoc.data()?.free_credits || 0;

                if (freeCredits <= 0) {
                    alert("🎁 You have run out of Daily Free Credits!");
                    generateBtn.innerHTML = originalBtnText;
                    generateBtn.disabled = false;
                    outBody.innerText = "Insufficient Free Credits. Your Mining tokens are safe!";
                    return;
                }

                const systemPrompt = `You are an expert professional email copywriter. Write a highly effective, well-structured, and engaging email. Tone: ${tone}. Do not include the subject line in the body. Do not include any explanations or intro text, just provide the actual email body.`;
                const userPrompt = `Sender Name: ${sender}\nRecipient Name: ${recipient}\nEmail Purpose: ${purpose}`;

                const response = await fetch('/api/groq-handler', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ systemPrompt, userPrompt })
                });

                const data = await response.json();

                if (response.ok && data.result) {
                    outBody.innerText = data.result;
                    
                    // Deduct ONLY 1 Free Credit
                    await userRef.update({
                        free_credits: firebase.firestore.FieldValue.increment(-1)
                    });
                } else {
                    throw new Error(data.error || "API error occurred");
                }

            } catch (error) {
                console.error("Error:", error);
                outBody.innerText = `⚠️ Something went wrong: ${error.message}`;
            } finally {
                generateBtn.innerHTML = originalBtnText;
                generateBtn.disabled = false;
            }
        });
    });

    // Copy to Clipboard Functionality
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
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
    }
});
