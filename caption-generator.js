document.addEventListener('DOMContentLoaded', () => {
    
    const generateBtn = document.getElementById('generateCaptionBtn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        
        const topic = document.getElementById('postTopic').value.trim();
        const platform = document.getElementById('platform').value;
        const tone = document.getElementById('captionTone').value;
        const length = document.getElementById('captionLength').value;

        const outCaption = document.getElementById('outCaption');

        if (topic === "") {
            alert("Please describe what your post or video is about.");
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
            outCaption.innerHTML = "<span style='color: #ef4444;'>Insufficient Credits. Please upgrade in Dashboard.</span>";
            return; 
        }

        const originalBtnText = generateBtn.innerHTML;
        generateBtn.innerHTML = "⏳ Crafting Caption...";
        generateBtn.disabled = true;

        outCaption.innerHTML = "<span style='color: #f472b6;'>Analyzing platform algorithms... Writing your caption. Please wait.</span>";

        try {
            // Deduct 2 Credits instantly on UI for Caption Generation
            currentCredits -= 2; 
            localStorage.setItem('tv_agent_credits', currentCredits);

            // System Prompt for Groq (Llama-3)
            const systemPrompt = `You are a highly sought-after Social Media Manager and Viral Copywriter.
            Write a highly engaging caption based on the user's input.
            
            Strictly follow this structure:
            1. 🎣 THE HOOK: The first sentence must be a scroll-stopper (attention-grabbing).
            2. ✍️ THE BODY: Deliver the message clearly using spacing/line breaks so it's easy to read. Use appropriate emojis organically.
            3. 📢 THE CTA: End with a strong Call to Action (e.g., "Save this for later", "Link in bio", or a question).
            4. 🏷️ HASHTAGS: Provide a block of 10-15 highly relevant, mix of broad and niche hashtags at the very bottom.
            
            Do NOT include conversational filler like "Here is your caption". Just output the caption directly.`;

            const userPrompt = `Platform: ${platform}\nTone: ${tone}\nLength: ${length}\nTopic: ${topic}`;

            // Fetch from your Groq Handler API
            const response = await fetch('/api/groq-handler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            const data = await response.json();

            if (response.ok && data.result) {
                
                // VVIP Formatting: Highlight Hashtags in Pink/Blue just like real social media apps
                let formattedText = data.result
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                
                // Regex to find hashtags and wrap them in a colored span
                formattedText = formattedText.replace(/(#\w+)/g, '<span style="color: #38bdf8; cursor: pointer; transition: 0.2s;" onmouseover="this.style.color=\'#f472b6\'" onmouseout="this.style.color=\'#38bdf8\'">$1</span>');

                outCaption.innerHTML = formattedText;
                
            } else {
                throw new Error(data.error || "API error occurred while generating caption.");
            }

        } catch (error) {
            console.error("Error:", error);
            outCaption.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${error.message}</span>`;
        } finally {
            generateBtn.innerHTML = "✨ Generate Caption";
            generateBtn.disabled = false;
        }
    });

    // Copy to Clipboard Functionality
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textToCopy = document.getElementById('outCaption').innerText;
            if(textToCopy.includes("Tell us about your post") || textToCopy.includes("⚠️") || textToCopy.includes("Writing your caption")) return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = "✅ Copied!";
                copyBtn.style.background = "#10b981"; // Green flash
                setTimeout(() => { 
                    copyBtn.innerText = originalText; 
                    copyBtn.style.background = "#db2777"; 
                }, 2000);
            });
        });
    }
});
