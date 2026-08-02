document.addEventListener('DOMContentLoaded', () => {
    
    const generateBtn = document.getElementById('generateEmailBtn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        
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
            outBody.innerText = "Insufficient Credits. Please upgrade in Dashboard.";
            return; 
        }

        const originalBtnText = generateBtn.innerHTML;
        generateBtn.innerHTML = "⏳ Generating AI Email...";
        generateBtn.disabled = true;

        outRecipient.innerText = recipient;
        outSubject.innerText = subject;
        outBody.innerText = "Connecting to high-speed AI... Please wait.";

        try {
            // Deduct 1 Credit instantly on UI for Email Generation
            currentCredits -= 1; 
            localStorage.setItem('tv_agent_credits', currentCredits);

            const systemPrompt = `You are an expert professional email copywriter. Write a highly effective, well-structured, and engaging email. Tone: ${tone}. Do not include the subject line in the body. Do not include any explanations or intro text, just provide the actual email body.`;
            const userPrompt = `Sender Name: ${sender}\nRecipient Name: ${recipient}\nEmail Purpose: ${purpose}`;

            // Fetch from your Groq Handler API
            const response = await fetch('/api/groq-handler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            const data = await response.json();

            if (response.ok && data.result) {
                outBody.innerText = data.result;
            } else {
                throw new Error(data.error || "API error occurred");
            }

        } catch (error) {
            console.error("Error:", error);
            outBody.innerText = `⚠️ Error: ${error.message}`;
        } finally {
            generateBtn.innerHTML = originalBtnText;
            generateBtn.disabled = false;
        }
    });

    // Copy to Clipboard Functionality
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const emailText = document.getElementById('outBody').innerText;
            if(emailText.includes("Click \"Generate Email\"") || emailText.includes("⚠️") || emailText.includes("Connecting")) return;

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
