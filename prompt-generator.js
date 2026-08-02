document.addEventListener('DOMContentLoaded', () => {
    
    const generateBtn = document.getElementById('generatePromptBtn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        
        const idea = document.getElementById('promptIdea').value.trim();
        const aiModel = document.getElementById('aiModel').value;
        const persona = document.getElementById('persona').value;
        const tone = document.getElementById('promptTone').value;

        const outPrompt = document.getElementById('outPrompt');

        if (idea === "") {
            alert("Please tell us what you want the AI to do.");
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
            outPrompt.innerHTML = "<span style='color: #ef4444;'>Insufficient Credits. Please upgrade in Dashboard.</span>";
            return; 
        }

        const originalBtnText = generateBtn.innerHTML;
        generateBtn.innerHTML = "⏳ Engineering Prompt...";
        generateBtn.disabled = true;

        outPrompt.innerHTML = "<span style='color: #22d3ee;'>Analyzing requirements... Crafting your Super Prompt. Please wait.</span>";

        try {
            // Deduct 5 Credits instantly on UI for Premium Text Generation
            currentCredits -= 5; 
            localStorage.setItem('tv_agent_credits', currentCredits);

            // System Prompt for Groq (Llama-3)
            const systemPrompt = `You are a Master Prompt Engineer. 
            Your goal is to take the user's basic idea and transform it into a highly detailed, optimized, and effective prompt ready to be pasted into an AI model (like ChatGPT, Midjourney, etc.).
            
            Format the output strictly as follows:
            
            🔥 SUPER PROMPT:
            (Write the actual detailed prompt here. If there are variables the user should fill in, put them in [BRACKETS LIKE THIS]. Ensure the prompt sets the context, persona, task, format, and tone clearly.)
            
            💡 PRO TIPS FOR BEST RESULTS:
            (Give 2 short bullet points on how the user can tweak this prompt to get even better results).`;

            const userPrompt = `Target AI: ${aiModel}\nPersona to adopt: ${persona}\nTone: ${tone}\nUser's Basic Idea: ${idea}`;

            // Fetch from your Groq Handler API
            const response = await fetch('/api/groq-handler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            const data = await response.json();

            if (response.ok && data.result) {
                // Formatting for VVIP Dark Output Box
                let formattedText = data.result
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/🔥 SUPER PROMPT:/g, `<span style="color: #fbbf24; font-weight: bold; font-size: 16px;">🔥 SUPER PROMPT:</span>`)
                    .replace(/💡 PRO TIPS FOR BEST RESULTS:/g, `<span style="color: #34d399; font-weight: bold; font-size: 16px; display:block; margin-top:20px;">💡 PRO TIPS FOR BEST RESULTS:</span>`)
                    .replace(/\[(.*?)\]/g, `<span style="color: #22d3ee; font-weight: bold; background: rgba(34, 211, 238, 0.1); padding: 2px 4px; border-radius: 4px;">[$1]</span>`);

                outPrompt.innerHTML = formattedText;
            } else {
                throw new Error(data.error || "API error occurred while generating prompt.");
            }

        } catch (error) {
            console.error("Error:", error);
            outPrompt.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${error.message}</span>`;
        } finally {
            generateBtn.innerHTML = "✨ Generate Super Prompt";
            generateBtn.disabled = false;
        }
    });

    // Copy to Clipboard Functionality
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textToCopy = document.getElementById('outPrompt').innerText;
            if(textToCopy.includes("Enter your basic idea") || textToCopy.includes("⚠️") || textToCopy.includes("Crafting your Super Prompt")) return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = "✅ Copied!";
                copyBtn.style.background = "#10b981"; // Green flash
                setTimeout(() => { 
                    copyBtn.innerText = originalText; 
                    copyBtn.style.background = "#0891b2"; 
                }, 2000);
            });
        });
    }
});
