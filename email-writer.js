document.getElementById('generateEmailBtn').addEventListener('click', async function() {
    
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

    // 1. Check if user is logged in
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("🔒 Please login to use the AI Email Writer.");
        window.location.href = "index.html"; // Redirect to home/login
        return;
    }

    // 2. Setup Firebase Firestore Reference
    const db = firebase.firestore();
    const userRef = db.collection('users').doc(user.uid);

    // Update Header
    outRecipient.innerText = recipient;
    outSubject.innerText = subject;

    // Loading State
    const originalBtnText = this.innerHTML;
    this.innerHTML = "⏳ Generating AI Email...";
    this.disabled = true;

    try {
        // 3. Check Only FREE CREDITS (Mining Tokens Safe)
        const userDoc = await userRef.get();
        const userData = userDoc.data() || {};
        const freeCredits = userData.free_credits || 0;

        if (!userDoc.exists || freeCredits <= 0) {
            alert("🎁 You have run out of Daily Free Credits! Please claim your daily free credits to continue.");
            this.innerHTML = originalBtnText;
            this.disabled = false;
            return;
        }

        outBody.innerText = "Connecting to Llama-3... Please wait.";

        // 4. Dynamic Prompts for Llama-3
        const systemPrompt = `You are an expert professional email copywriter. Write a highly effective, well-structured, and engaging email. 
        Tone: ${tone}. 
        Do not include the subject line in the body. Do not include any explanations or intro text, just provide the actual email body.`;
        
        const userPrompt = `Sender Name: ${sender}\nRecipient Name: ${recipient}\nEmail Purpose: ${purpose}`;

        // 5. Call Vercel Groq API
        const response = await fetch('/api/groq-handler', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemPrompt: systemPrompt,
                userPrompt: userPrompt
            })
        });

        const data = await response.json();

        if (response.ok && data.result) {
            // Output the AI generated email
            outBody.innerText = data.result;

            // 6. Deduct ONLY 1 Free Credit (Mining Tokens Safe!)
            await userRef.update({
                free_credits: firebase.firestore.FieldValue.increment(-1)
            });
            
            console.log("1 Free Credit Deducted for Email Generation. Mining Tokens remain completely safe!");
        } else {
            throw new Error(data.error || "API error occurred");
        }

    } catch (error) {
        console.error("Error:", error);
        outBody.innerText = `⚠️ Something went wrong: ${error.message}`;
    } finally {
        // Reset Button
        this.innerHTML = originalBtnText;
        this.disabled = false;
    }
});

// Copy to Clipboard Functionality
document.getElementById('copyBtn').addEventListener('click', function() {
    const emailText = document.getElementById('outBody').innerText;
    
    if(emailText.includes("Click \"Generate Email\"") || emailText.includes("⚠️ Something went wrong")) return;

    navigator.clipboard.writeText(emailText).then(() => {
        const status = document.getElementById('copyStatus');
        if(status) {
            status.classList.add('show');
            setTimeout(() => {
                status.classList.remove('show');
            }, 2000);
        } else {
            alert("Email Copied!");
        }
    });
});
