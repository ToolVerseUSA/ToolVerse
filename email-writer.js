document.addEventListener('DOMContentLoaded', () => {
    
    const generateBtn = document.getElementById('generateEmailBtn');
    
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        
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
        generateBtn.innerHTML = "⏳ Authenticating...";
        generateBtn.disabled = true;

        outRecipient.innerText = recipient;
        outSubject.innerText = subject;

        try {
            // 1. Check if Firebase is loaded properly
            if (typeof firebase === 'undefined') {
                throw new Error("Firebase is not loaded! Check if Firebase scripts are in your HTML.");
            }

            // 2. Fast Auth Check
            const user = firebase.auth().currentUser;
            
            if (!user) {
                alert("🔒 Please login to use the AI Email Writer.");
                window.location.href = "index.html"; 
                return; // Code goes to finally block and resets button
            }

            generateBtn.innerHTML = "⏳ Generating AI Email...";
            outBody.innerText = "Connecting to Llama-3... Please wait.";

            // 3. Database Check for Free Credits Only
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(user.uid);
            
            const userDoc = await userRef.get();
            const freeCredits = userDoc.data()?.free_credits || 0;

            if (freeCredits <= 0) {
                alert("🎁 You have run out of Daily Free Credits!");
                outBody.innerText = "Insufficient Free Credits. Your Mining tokens are safe!";
                return; 
            }

            // 4. Groq API Logic
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
                
                // 5. Deduct ONLY 1 Free Credit (Mining Tokens Safe!)
                await userRef.update({
                    free_credits: firebase.firestore.FieldValue.increment(-1)
                });
                console.log("1 Free Credit Deducted. Mining Tokens are Safe!");
            } else {
                throw new Error(data.error || "API error occurred");
            }

        } catch (error) {
            console.error("Error:", error);
            outBody.innerText = `⚠️ Error: ${error.message}`;
        } finally {
            // 6. This ALWAYS runs, preventing the button from ever getting stuck!
            generateBtn.innerHTML = originalBtnText;
            generateBtn.disabled = false;
        }
    });

    // Copy to Clipboard Functionality
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const emailText = document.getElementById('outBody').innerText;
            if(emailText.includes("Click \"Generate Email\"") || emailText.includes("⚠️")) return;

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
