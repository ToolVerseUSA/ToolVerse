document.addEventListener('DOMContentLoaded', () => {
    
    const generateBtn = document.getElementById('generateToolkitBtn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        
        const topic = document.getElementById('ytTopic').value.trim();
        const style = document.getElementById('ytStyle').value;
        const tone = document.getElementById('ytTone').value;
        const details = document.getElementById('ytDetails').value.trim();

        const outToolkit = document.getElementById('outToolkit');

        if (topic === "") {
            alert("Please enter the main video topic or keyword first.");
            return;
        }

        const originalBtnText = generateBtn.innerHTML;
        generateBtn.innerHTML = "⏳ Analyzing YouTube Algorithm...";
        generateBtn.disabled = true;

        outToolkit.innerHTML = "<span style='color: #f43f5e;'>Connecting to Llama-3... Crafting viral metadata. Please wait.</span>";

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
                outToolkit.innerHTML = "<span style='color: #ef4444;'>Insufficient Free Credits. Your Mining tokens are safe!</span>";
                return; 
            }

            // Elite YouTube SEO Prompt
            const systemPrompt = `You are an elite YouTube Growth Strategist and SEO Algorithm Expert.
            Based on the user's input, generate a complete metadata toolkit.
            Format the output EXACTLY like this:
            
            📌 VIRAL TITLES
            (Provide 3 highly clickable, high CTR titles. Keep them under 60 characters if possible)
            
            📝 SEO DESCRIPTION
            (Write a 2-paragraph highly optimized description. Naturally include keywords. Add a section for "Timestamps" and "Follow Me" placeholders).
            
            🏷️ TOP SEO TAGS
            (Provide 15-20 comma-separated long-tail and short-tail tags optimized for search).
            
            🖼️ THUMBNAIL IDEA
            (Describe a high-converting thumbnail concept that visually matches the titles).`;

            const userPrompt = `Topic: ${topic}\nVideo Style: ${style}\nTone: ${tone}\nAdditional Details: ${details || "None"}`;

            const response = await fetch('/api/groq-handler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            const data = await response.json();

            if (response.ok && data.result) {
                // Add color styling to the output for VVIP feel
                let formattedText = data.result
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/📌 VIRAL TITLES/g, `<span style="color: #fbbf24; font-weight: bold; font-size: 16px;">📌 VIRAL TITLES</span>`)
                    .replace(/📝 SEO DESCRIPTION/g, `<span style="color: #34d399; font-weight: bold; font-size: 16px;">📝 SEO DESCRIPTION</span>`)
                    .replace(/🏷️ TOP SEO TAGS/g, `<span style="color: #60a5fa; font-weight: bold; font-size: 16px;">🏷️ TOP SEO TAGS</span>`)
                    .replace(/🖼️ THUMBNAIL IDEA/g, `<span style="color: #f472b6; font-weight: bold; font-size: 16px;">🖼️ THUMBNAIL IDEA</span>`);

                outToolkit.innerHTML = formattedText;
                
                // Deduct ONLY 1 Free Credit
                await userRef.update({
                    free_credits: firebase.firestore.FieldValue.increment(-1)
                });
            } else {
                throw new Error(data.error || "API error occurred");
            }

        } catch (error) {
            console.error("Error:", error);
            outToolkit.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${error.message}</span>`;
        } finally {
            generateBtn.innerHTML = "✨ Generate SEO Toolkit";
            generateBtn.disabled = false;
        }
    });

    // Copy to Clipboard Functionality
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textToCopy = document.getElementById('outToolkit').innerText;
            if(textToCopy.includes("Provide your video details") || textToCopy.includes("⚠️") || textToCopy.includes("Connecting")) return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = "✅ Copied!";
                setTimeout(() => { copyBtn.innerText = originalText; }, 2000);
            });
        });
    }
});
