document.addEventListener('DOMContentLoaded', () => {
    
    const generateBtn = document.getElementById('generateResumeBtn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        
        const jobTitle = document.getElementById('jobTitle').value.trim();
        const experience = document.getElementById('experience').value;
        const skills = document.getElementById('skills').value.trim();
        const workHistory = document.getElementById('workHistory').value.trim();

        const outResume = document.getElementById('outResume');

        if (jobTitle === "" || workHistory === "") {
            alert("Please provide at least a Target Job Title and a brief Work History.");
            return;
        }

        generateBtn.innerHTML = "⏳ AI Coach is Writing...";
        generateBtn.disabled = true;

        outResume.innerHTML = "<span style='color: #38bdf8;'>Scanning ATS Algorithms... Crafting perfect bullet points. Please wait.</span>";

        try {
            // 1. Firebase Auth Check
            if (typeof firebase === 'undefined' || !firebase.apps.length) {
                throw new Error("Firebase is not initialized.");
            }

            const user = firebase.auth().currentUser;
            if (!user) {
                alert("🔒 Please login to use Premium Tools.");
                window.location.href = "index.html"; 
                return;
            }

            // 2. Database Credit Check
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(user.uid);
            
            const userDoc = await userRef.get();
            const freeCredits = userDoc.data()?.free_credits || 0;

            if (freeCredits <= 0) {
                alert("🎁 You have run out of Daily Free Credits!");
                outResume.innerHTML = "<span style='color: #ef4444;'>Insufficient Free Credits. Your Mining tokens are safe!</span>";
                return; 
            }

            // 3. Expert AI Prompt for ATS Resume
            const systemPrompt = `You are an Elite Executive Resume Writer and an Expert in ATS (Applicant Tracking Systems). 
            Your job is to take the user's rough inputs and transform them into a highly professional, 100% ATS-compliant resume draft.
            
            Format the output strictly as follows:
            
            🟢 ESTIMATED ATS SCORE: [Give a score like 85/100 based on the provided data, and a 1-line tip to reach 100]
            
            👤 PROFESSIONAL SUMMARY
            (Write a powerful 3-4 sentence summary tailored to their target job. No fluff, just impact).
            
            🛠️ CORE COMPETENCIES & SKILLS
            (Organize their provided skills and add 4-5 missing highly-searched industry keywords).
            
            💼 PROFESSIONAL EXPERIENCE
            (Rewrite their rough work history into highly professional, action-driven bullet points. 
            Start EVERY bullet point with a strong action verb like Spearheaded, Orchestrated, Optimized, etc. 
            Add placeholders like [insert percentage here]% or [insert amount here] so they remember to add metrics).
            
            Do not include conversational text. Output the resume sections directly.`;

            const userPrompt = `Target Job Title: ${jobTitle}\nExperience Level: ${experience}\nProvided Skills: ${skills}\nRough Work History: ${workHistory}`;

            // 4. Fetch from Vercel Backend
            const response = await fetch('/api/groq-handler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            const data = await response.json();

            if (response.ok && data.result) {
                
                // VVIP Formatting: Highlighting specific sections to look like a premium software output
                let formattedText = data.result
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    // Highlight the ATS Score Badge
                    .replace(/🟢 ESTIMATED ATS SCORE:(.*?)\n/g, `<div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #10b981; padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 20px;">🟢 ATS SCORE:$1</div>`)
                    // Highlight Section Headers
                    .replace(/👤 PROFESSIONAL SUMMARY/g, `<span style="color: #38bdf8; font-weight: bold; font-size: 16px;">👤 PROFESSIONAL SUMMARY</span>`)
                    .replace(/🛠️ CORE COMPETENCIES & SKILLS/g, `<span style="color: #38bdf8; font-weight: bold; font-size: 16px; display:block; margin-top:15px;">🛠️ CORE COMPETENCIES & SKILLS</span>`)
                    .replace(/💼 PROFESSIONAL EXPERIENCE/g, `<span style="color: #38bdf8; font-weight: bold; font-size: 16px; display:block; margin-top:15px;">💼 PROFESSIONAL EXPERIENCE</span>`)
                    // Highlight placeholders so the user knows what to fill in
                    .replace(/\[(.*?)\]/g, `<span style="color: #facc15; background: rgba(250, 204, 21, 0.1); padding: 1px 4px; border-radius: 3px;">[$1]</span>`);

                outResume.innerHTML = formattedText;
                
                // 5. Deduct 1 Free Credit
                await userRef.update({
                    free_credits: firebase.firestore.FieldValue.increment(-1)
                });
            } else {
                throw new Error(data.error || "API error occurred while drafting resume.");
            }

        } catch (error) {
            console.error("Error:", error);
            outResume.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${error.message}</span>`;
        } finally {
            generateBtn.innerHTML = "✨ Generate ATS Draft";
            generateBtn.disabled = false;
        }
    });

    // 6. Copy and Download Functionality
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textToCopy = document.getElementById('outResume').innerText;
            if(textToCopy.includes("Provide your details") || textToCopy.includes("⚠️") || textToCopy.includes("Scanning ATS")) return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = "✅ Copied!";
                setTimeout(() => { copyBtn.innerText = originalText; }, 2000);
            });
        });
    }

    const downloadTxtBtn = document.getElementById('downloadTxtBtn');
    if (downloadTxtBtn) {
        downloadTxtBtn.addEventListener('click', () => {
            const text = document.getElementById('outResume').innerText;
            if(text.includes("Provide your details") || text.includes("⚠️") || text.includes("Scanning ATS")) return;
            
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const anchor = document.createElement('a');
            anchor.href = URL.createObjectURL(blob);
            anchor.download = 'ATS_Resume_Draft_ToolVerse.txt';
            anchor.click();
        });
    }
});
