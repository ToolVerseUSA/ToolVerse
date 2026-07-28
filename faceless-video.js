document.addEventListener('DOMContentLoaded', () => {
    
    const generateBtn = document.getElementById('generateBlueprintBtn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        
        const topic = document.getElementById('videoTopic').value.trim();
        const niche = document.getElementById('videoNiche').value;
        const length = document.getElementById('videoLength').value;
        const tone = document.getElementById('videoTone').value;
        const details = document.getElementById('videoDetails').value.trim();

        const outScript = document.getElementById('outScript');

        if (topic === "") {
            alert("Please provide a main topic or idea for the video.");
            return;
        }

        const originalBtnText = generateBtn.innerHTML;
        generateBtn.innerHTML = "⏳ Structuring Blueprint...";
        generateBtn.disabled = true;

        outScript.innerHTML = "<span style='color: #38bdf8;'>Connecting to Llama-3... Crafting your masterpiece. Please wait.</span>";

        try {
            if (typeof firebase === 'undefined' || !firebase.apps.length) {
                throw new Error("Firebase is not initialized.");
            }

            const user = firebase.auth().currentUser;
            if (!user) {
                alert("🔒 Please login to use Premium Tools.");
                window.location.href = "index.html"; 
                return;
            }

            const db = firebase.firestore();
            const userRef = db.collection('users').doc(user.uid);
            
            const userDoc = await userRef.get();
            const freeCredits = userDoc.data()?.free_credits || 0;

            if (freeCredits <= 0) {
                alert("🎁 You have run out of Daily Free Credits!");
                outScript.innerHTML = "<span style='color: #ef4444;'>Insufficient Free Credits. Your Mining tokens are safe!</span>";
                return; 
            }

            // VVIP Level Prompt Engineering for Faceless Videos
            const systemPrompt = `You are an elite YouTube Strategist and Scriptwriter for Faceless Channels. 
            Format the output strictly as follows:
            
            📌 TITLE IDEAS: Provide 3 highly clickable, CTR-optimized titles.
            
            🔥 THE HOOK (0-5s): Write a gripping opening hook. Include visual cues in brackets like [Visual: Show glitch effect].
            
            🎙️ VOICEOVER SCRIPT & VISUALS:
            Write the full script. Alternate between what the Voiceover (VO) says and the visual instructions in brackets [Visual: ...].
            Ensure the pacing matches a ${length} video.
            Keep the tone: ${tone}.
            
            Make the output visually clean and easy to read.`;

            const userPrompt = `Topic: ${topic}\nNiche: ${niche}\nAdditional Details: ${details || "None"}`;

            const response = await fetch('/api/groq-handler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            const data = await response.json();

            if (response.ok && data.result) {
                // Highlighting Visual cues in yellow for VVIP look
                let formattedText = data.result
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\[Visual:.*?\]/gi, match => `<span style="color: #facc15; font-weight: bold;">${match}</span>`)
                    .replace(/\[.*?\]/g, match => `<span style="color: #facc15; font-weight: bold;">${match}</span>`);

                outScript.innerHTML = formattedText;
                
                // Deduct 1 Free Credit
                await userRef.update({
                    free_credits: firebase.firestore.FieldValue.increment(-1)
                });
            } else {
                throw new Error(data.error || "API error occurred");
            }

        } catch (error) {
            console.error("Error:", error);
            outScript.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${error.message}</span>`;
        } finally {
            generateBtn.innerHTML = "🚀 Generate Blueprint";
            generateBtn.disabled = false;
        }
    });

    // Copy to Clipboard
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textToCopy = document.getElementById('outScript').innerText;
            if(textToCopy.includes("Provide your details") || textToCopy.includes("⚠️") || textToCopy.includes("Connecting")) return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = "✅ Copied!";
                setTimeout(() => { copyBtn.innerText = originalText; }, 2000);
            });
        });
    }
});
