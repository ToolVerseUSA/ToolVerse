document.getElementById('generateBtn').addEventListener('click', function() {
    
    // Get values
    const platform = document.getElementById('platformInput').value;
    const topic = document.getElementById('topicInput').value;
    const tone = document.getElementById('toneInput').value;
    const emojiChoice = document.getElementById('emojiInput').value;
    
    const outputCaption = document.getElementById('outputCaption');
    const platformBadge = document.getElementById('platformBadge');

    // Validation
    if (topic.trim() === "") {
        outputCaption.innerHTML = "<span style='color:red;'>Please enter a topic for your post first!</span>";
        return;
    }

    // Update Platform Badge in Mockup
    platformBadge.innerText = platform;

    // Loading effect
    const originalBtnText = this.innerHTML;
    this.innerHTML = "⏳ Generating...";
    this.disabled = true;

    // Simulate AI Delay (1.2 seconds)
    setTimeout(() => {
        
        let generatedText = "";
        let hashtags = "\n\n#ToolVerse #AI #" + topic.replace(/\s+/g, '').substring(0, 15) + " #" + tone;

        // Basic Templates based on Tone
        if (tone === "Engaging") {
            generatedText = `Stop scrolling! 🛑 You need to hear this about ${topic}.\n\nI just found out a massive secret that changed the game for me. If you are not paying attention to this, you're missing out big time.\n\nWhat are your thoughts on this? Let me know below! 👇`;
        } 
        else if (tone === "Professional") {
            generatedText = `I am excited to share my latest thoughts on ${topic}.\n\nIn today's fast-paced digital landscape, understanding the nuances of this subject is crucial for long-term success and growth. It's time to adapt and innovate.\n\nLet's connect and discuss.`;
        }
        else if (tone === "Funny") {
            generatedText = `Me trying to understand ${topic}... 🤯\n\nHonestly, I thought I had it all figured out, but here we are. Send help (or coffee)! ☕\n\nWho else can relate?`;
        }
        else if (tone === "Motivational") {
            generatedText = `Your daily reminder that mastering ${topic} can change your life! 🌟\n\nDon't let the fear of the unknown stop you. Take one small step today, stay consistent, and watch the magic happen. You've got this!\n\nDouble tap if you agree! ❤️`;
        }
        else {
            generatedText = `Did you know this about ${topic}?\n\nHere's a quick breakdown:\n1️⃣ Point one\n2️⃣ Point two\n3️⃣ Point three\n\nSave this post for later so you don't forget! 📌`;
        }

        // Adjust Emojis based on selection
        if (emojiChoice === "No") {
            // Remove all emojis (simple regex)
            generatedText = generatedText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        } else if (emojiChoice === "Few") {
            // Just keep it as is, but maybe remove the middle ones in a real AI. 
            // For now, template has a few.
        }

        // Output final result
        outputCaption.innerText = generatedText + hashtags;

        // Reset Button
        this.innerHTML = "✨ Generate";
        this.disabled = false;

    }, 1200);
});

// Clear Button
document.getElementById('clearBtn').addEventListener('click', function() {
    document.getElementById('topicInput').value = "";
    document.getElementById('outputCaption').innerText = "Your generated caption will appear here. Select your options and hit generate!";
    document.getElementById('platformBadge').innerText = "Instagram";
});

// Copy to Clipboard
document.getElementById('copyBtn').addEventListener('click', function() {
    const captionText = document.getElementById('outputCaption').innerText;
    
    if(captionText.includes("Your generated caption will appear here")) return;

    navigator.clipboard.writeText(captionText).then(() => {
        const status = document.getElementById('copyStatus');
        status.classList.add('show');
        
        setTimeout(() => {
            status.classList.remove('show');
        }, 2000);
    });
});
