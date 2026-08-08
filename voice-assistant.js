// ==========================================
// VVIP VOICE ASSISTANT MODULE - TOOLVERSE PRO
// ==========================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const voiceModal = document.getElementById('voice-modal');
const statusText = document.getElementById('voice-status');
const transcriptText = document.getElementById('voice-text');
const waveIcon = document.getElementById('wave-icon');

let isProcessing = false; 
let isModalOpen = false; 

if (recognition) {
    recognition.continuous = false;
    recognition.lang = 'en-US'; 
    recognition.interimResults = false;

    // 1. جب یوزر بولنا شروع کرے
    recognition.onstart = () => {
        isProcessing = true;
        statusText.innerText = "Listening...";
        statusText.style.color = "#4ade80"; // Green
        waveIcon.style.color = "#4ade80";
        waveIcon.classList.add('fa-beat-fade');
        waveIcon.classList.remove('fa-bounce', 'fa-flip');
    };

    // 2. جب آواز بند ہو
    recognition.onspeechend = () => {
        recognition.stop();
    };

    // 3. جب کمانڈ AI کو جائے
    recognition.onresult = async (event) => {
        const userCommand = event.results[0][0].transcript;
        transcriptText.innerHTML = `<span style="color: white; font-weight: bold;">You:</span> ${userCommand}`;
        
        statusText.innerText = "Thinking...";
        statusText.style.color = "#f59e0b"; // Yellow
        waveIcon.style.color = "#f59e0b";
        waveIcon.classList.remove('fa-beat-fade');
        waveIcon.classList.add('fa-bounce');

        // AI سے جواب منگوانا
        const aiResponse = await sendToAI(userCommand);
        
        statusText.innerText = "Speaking...";
        statusText.style.color = "#38bdf8"; // Blue
        waveIcon.style.color = "#38bdf8";
        waveIcon.classList.remove('fa-bounce');
        waveIcon.classList.add('fa-flip');

        transcriptText.innerHTML += `<br><br><span style="color: #38bdf8; font-weight: bold;">AI:</span> ${aiResponse}`;
        speakText(aiResponse);
    };

    // 4. خاموشی یا ایرر پر ہینڈلنگ
    recognition.onerror = (event) => {
        isProcessing = false;
        if (event.error === 'no-speech' && isModalOpen) {
            statusText.innerText = "Tap the Wave icon to speak";
            statusText.style.color = "#94a3b8";
            waveIcon.style.color = "#94a3b8";
            waveIcon.classList.remove('fa-beat-fade', 'fa-bounce', 'fa-flip');
            return;
        }
        statusText.innerText = "Error: " + event.error;
        statusText.style.color = "#ff4757"; 
        waveIcon.style.color = "#ff4757";
        waveIcon.classList.remove('fa-beat-fade', 'fa-bounce', 'fa-flip');
    };
}

// ماڈل اوپن کرنے کا فنکشن
function toggleVoiceModal() {
    if (!recognition) { 
        alert("⚠️ Voice Assistant is not supported in your browser."); 
        return; 
    }
    isModalOpen = true;
    voiceModal.style.display = 'flex';
    transcriptText.innerHTML = "Speak your command...";
    forceStartRecognition();
}

// ماڈل کلوز کرنے کا فنکشن
function closeVoiceModal() {
    isModalOpen = false;
    isProcessing = false;
    if(recognition) recognition.stop();
    window.speechSynthesis.cancel(); 
    voiceModal.style.display = 'none';
    
    waveIcon.classList.remove('fa-beat-fade', 'fa-bounce', 'fa-flip');
    waveIcon.style.color = "#38bdf8";
}

// Manual Override - یوزر آئیکن پر کلک کر کے خود مائیک آن کر سکے گا
waveIcon.style.cursor = "pointer";
waveIcon.onclick = () => {
    if (!isProcessing && isModalOpen) {
        forceStartRecognition();
    }
};

function forceStartRecognition() {
    if (isProcessing) return;
    try {
        recognition.start();
    } catch(e) {
        console.log("Mic is already preparing...");
    }
}

// AI کے ٹیکسٹ کو آواز میں بدلنے کا فنکشن
function speakText(text) {
    if (!window.speechSynthesis) {
        statusText.innerText = "Audio not supported.";
        isProcessing = false;
        return;
    }

    window.speechSynthesis.cancel(); 
    const cleanText = text.replace(/[*#_`]/g, ''); 
    const msg = new SpeechSynthesisUtterance(cleanText);
    
    msg.lang = 'en-US'; 

    msg.onend = () => {
        isProcessing = false;
        if (!isModalOpen) return; 
        
        // ⚡ VVIP FIX: آٹو مائیک سٹارٹ کرنے کے بجائے یوزر کو ٹیپ کرنے کا آپشن دیا ہے تاکہ موبائل کا مائیک لاک نہ ہو
        statusText.innerText = "Tap the Wave icon to speak again";
        statusText.style.color = "#94a3b8";
        waveIcon.classList.remove('fa-flip');
        waveIcon.style.color = "#94a3b8";
    };

    msg.onerror = () => {
        isProcessing = false;
    };

    window.speechSynthesis.speak(msg);
}

// Groq Model سے کنکشن
async function sendToAI(command) {
    try {
        const response = await fetch('/api/groq-handler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // ⚡ VVIP PROMPT: زبانوں کا پکا اور فول پروف علاج
                systemPrompt: "You are 'ToolVerse AI', a highly intelligent voice assistant. CRITICAL LANGUAGE RULE: You MUST exactly match the user's language. IF the user's input is strictly English (e.g., 'how to learn english', 'what is your name'), you MUST reply in pure English. IF the user's input contains Urdu or Hindi (e.g., 'kaise ho', 'kya kar rahe ho'), you MUST reply in Roman Urdu/Hindi using English alphabets. Keep your answer to ONE short sentence. DO NOT use markdown.",
                userPrompt: command,
                model: 'llama-3.3-70b-versatile'
            })
        });
        
        if (!response.ok) throw new Error("API Network Error");
        const data = await response.json();
        return data.result || "Sorry, I missed that.";
    } catch (error) {
        return "Connection issue. Please try again.";
    }
}
