// voice-assistant.js
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
    recognition.continuous = false;
    recognition.lang = 'ur-PK'; // Default Urdu
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
        const userCommand = event.results[0][0].transcript;
        document.getElementById('voice-text').innerText = "You: " + userCommand;
        
        document.getElementById('voice-status').innerText = "Thinking...";
        const aiResponse = await sendToAI(userCommand);
        
        document.getElementById('voice-status').innerText = "Speaking...";
        speakText(aiResponse);
    };
}

function toggleVoiceModal() {
    if (!recognition) { alert("Voice is not supported in this browser."); return; }
    document.getElementById('voice-modal').style.display = 'flex';
    recognition.start();
}

function closeVoiceModal() {
    document.getElementById('voice-modal').style.display = 'none';
    window.speechSynthesis.cancel();
}

function speakText(text) {
    const msg = new SpeechSynthesisUtterance(text);
    // AI کونسے ملک کی زبان میں بولے؟
    msg.lang = 'ur-PK'; 
    window.speechSynthesis.speak(msg);
    document.getElementById('voice-status').innerText = "Done.";
    setTimeout(closeVoiceModal, 3000);
}

async function sendToAI(command) {
    try {
        const response = await fetch('/api/groq-handler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // یہاں AI کو حکم دیں کہ یوزر جس زبان میں بات کرے اسی میں جواب دے
                systemPrompt: "You are a smart AI Voice Assistant for ToolVerse. Respond in the same language the user speaks. Keep answers concise and helpful.",
                userPrompt: command,
                model: 'llama-3.3-70b-versatile'
            })
        });
        const data = await response.json();
        return data.result || "I couldn't understand that.";
    } catch (e) {
        return "Sorry, connection error.";
    }
}
