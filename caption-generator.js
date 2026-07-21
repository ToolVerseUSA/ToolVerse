document.getElementById('generateBtn').addEventListener('click', async function() {
    
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
    this.innerHTML = "⏳ AI is Writing...";
    this.disabled = true;

    // 1. AI Prompt Create Karna
    let emojiInstruction = "";
    if (emojiChoice === "No") emojiInstruction = "Do NOT use any emojis.";
    else if (emojiChoice === "Few") emojiInstruction = "Use only 1 or 2 emojis.";
    else emojiInstruction = "Use highly engaging and relevant emojis.";

    const promptText = `Act as an expert social media manager. Write a highly engaging caption for ${platform}. The topic is: "${topic}". The tone of the caption should be ${tone}. ${emojiInstruction} Please include relevant hashtags at the end. Make it ready to publish.`;

    try {
        // 2. Vercel Backend (Gemini) ko request bhejna
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: promptText })
        });

        const data = await response.json();

        if (data.reply) {
            // 3. AI ka Jawab Screen par dikhana
            outputCaption.innerText = data.reply;
            
            // 4. GAMIFICATION: 3x Mining Boost (Tokens Award)
            awardToolTokens(1.50); // Har AI generate par 1.50 $TOOL milenge
            
        } else {
            outputCaption.innerText = "Error: Could not generate caption. Please try again.";
        }

    } catch (error) {
        console.error("AI Connection Error:", error);
        outputCaption.innerText = "Error connecting to AI. Please check your internet connection.";
    }

    // Reset Button
    this.innerHTML = "✨ Generate";
    this.disabled = false;
});

// $TOOL Token Reward Logic
function awardToolTokens(amount) {
    // Purana balance check karo
    let currentBalance = parseFloat(localStorage.getItem('toolBalance')) || 0;
    
    // Naye tokens add karo
    currentBalance += amount;
    
    // Naya balance save karo
    localStorage.setItem('toolBalance', currentBalance.toFixed(3));
    
    // UI update karna (Agar id 'toolBalance' hai to)
    const balanceElements = document.querySelectorAll('.tool-balance-display'); // You can change this class to match your HTML
    balanceElements.forEach(el => {
        el.innerText = currentBalance.toFixed(3);
    });
    
    console.log(`🎉 +${amount} $TOOL Mined! New Balance: ${currentBalance}`);
}

// Clear Button (Same as before)
document.getElementById('clearBtn').addEventListener('click', function() {
    document.getElementById('topicInput').value = "";
    document.getElementById('outputCaption').innerText = "Your generated caption will appear here. Select your options and hit generate!";
    document.getElementById('platformBadge').innerText = "Instagram";
});

// Copy to Clipboard (Same as before)
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
        
