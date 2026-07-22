document.getElementById('generateBtn').addEventListener('click', async function() {
    
    const platform = document.getElementById('platformInput').value;
    const topic = document.getElementById('topicInput').value;
    const tone = document.getElementById('toneInput').value;
    const emojiChoice = document.getElementById('emojiInput').value;
    
    const outputCaption = document.getElementById('outputCaption');
    const platformBadge = document.getElementById('platformBadge');

    if (topic.trim() === "") {
        outputCaption.innerHTML = "<span style='color:red;'>Please enter a topic for your post first!</span>";
        return;
    }

    platformBadge.innerText = platform;

    this.innerHTML = "⏳ AI is Writing...";
    this.disabled = true;

    let emojiInstruction = "";
    if (emojiChoice === "No") emojiInstruction = "Do NOT use any emojis.";
    else if (emojiChoice === "Few") emojiInstruction = "Use only 1 or 2 emojis.";
    else emojiInstruction = "Use highly engaging and relevant emojis.";

    const promptText = `Act as an expert social media manager. Write a highly engaging caption for ${platform}. The topic is: "${topic}". The tone of the caption should be ${tone}. ${emojiInstruction} Please include relevant hashtags at the end. Make it ready to publish.`;

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: promptText })
        });

        const data = await response.json();

        if (data.reply) {
            outputCaption.innerText = data.reply;
            awardToolTokens(1.50);
        } else {
            // 🚨 HIDDEN ERROR KO SCREEN PAR DIKHANE WALA CODE 🚨
            console.error("Backend Error:", data);
            outputCaption.innerText = `🚨 Error: ${data.error || 'Unknown'} | Details: ${JSON.stringify(data.details || data)}`;
        }

    } catch (error) {
        outputCaption.innerText = `🚨 Connection Error: ${error.message}`;
    }

    this.innerHTML = "✨ Generate";
    this.disabled = false;
});

function awardToolTokens(amount) {
    let currentBalance = parseFloat(localStorage.getItem('toolBalance')) || 0;
    currentBalance += amount;
    localStorage.setItem('toolBalance', currentBalance.toFixed(3));
    
    const balanceElements = document.querySelectorAll('.tool-balance-display');
    balanceElements.forEach(el => {
        el.innerText = currentBalance.toFixed(3);
    });
}

document.getElementById('clearBtn').addEventListener('click', function() {
    document.getElementById('topicInput').value = "";
    document.getElementById('outputCaption').innerText = "Your generated caption will appear here. Select your options and hit generate!";
    document.getElementById('platformBadge').innerText = "Instagram";
});

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
