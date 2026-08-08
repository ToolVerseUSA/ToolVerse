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
let isModalOpen = false; // یہ چیک کرنے کے لیے کہ یوزر نے ونڈو بند تو نہیں کی

if (recognition) {
    recognition.continuous = false;
    recognition.lang = 'en-US'; // English حروف کو کیچ کرنے کے لیے بہترین
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

    // 4. خاموشی یا ایرر پر آٹو ری سٹارٹ
    recognition.onerror = (event) => {
        if (event.error === 'no-speech' && isModalOpen) {
            // اگر یوزر خاموش ہے تو بند مت کرو، دوبارہ مائیک آن کرو
            setTimeout(() => { if(isModalOpen) recognition.start(); }, 1000);
            return;
        }
        statusText.innerText = "Error: " + event.error;
        statusText.style.color = "#ff4757"; 
        waveIcon.style.color = "#ff4757";
        waveIcon.classList.remove('fa-beat-fade', 'fa-bounce', 'fa-flip');
        isProcessing = false;
    };
}

// ماڈل اوپن کرنے کا فنکشن
function toggleVoiceModal() {
    if (!recognition) { 
        alert("⚠️ Voice Assistant is not supported in your current browser."); 
        return; 
    }
    isModalOpen = true;
    voiceModal.style.display = 'flex';
    transcriptText.innerHTML = "Speak your command...";
    if (!isProcessing) recognition.start();
}

// ماڈل کلوز کرنے کا فنکشن
function closeVoiceModal() {
    isModalOpen = false;
    if(recognition) recognition.stop();
    window.speechSynthesis.cancel(); // AI کو چپ کروانا
    voiceModal.style.display = 'none';
    isProcessing = false;
    
    // UI ری سیٹ
    waveIcon.classList.remove('fa-beat-fade', 'fa-bounce', 'fa-flip');
    waveIcon.style.color = "#38bdf8";
}

// AI کے ٹیکسٹ کو آواز میں بدلنے کا فنکشن
function speakText(text) {
    if (!window.speechSynthesis) {
        statusText.innerText = "Audio not supported.";
        isProcessing = false;
        return;
    }

    window.speechSynthesis.cancel(); 
    const cleanText = text.replace(/[*#_`]/g, ''); // فالتو نشانات صاف کرنا
    const msg = new SpeechSynthesisUtterance(cleanText);
    
    msg.lang = 'en-US'; // Roman Urdu/Sindhi کے لیے سب سے بہترین آواز

    // ⚡ VVIP FIX: جب AI بولنا ختم کرے، تو دوبارہ مائیک آن کرو (Continuous Loop)
    msg.onend = () => {
        if (!isModalOpen) return; // اگر یوزر نے Close کر دیا ہے تو مائیک آن مت کرو
        
        statusText.innerText = "Listening again...";
        statusText.style.color = "#4ade80";
        waveIcon.classList.remove('fa-flip');
        
        setTimeout(() => {
            if(isModalOpen) recognition.start();
        }, 500); // آدھے سیکنڈ بعد مائیک دوبارہ آن ہو جائے گا
    };

    msg.onerror = () => {
        if(isModalOpen) recognition.start();
    };

    window.speechSynthesis.speak(msg);
}

// Groq 70B Model سے کنکشن
async function sendToAI(command) {
    try {
        const response = await fetch('/api/groq-handler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // ⚡ VVIP PROMPT: زبانوں کا پکا علاج
                systemPrompt: "You are 'ToolVerse AI', a highly intelligent and polite voice assistant. CRITICAL RULES: 1. Keep your answer to ONE short sentence only. 2. If the user speaks English, reply in English. 3. If the user speaks Urdu, Hindi, Punjabi or Sindhi, YOU MUST REPLY IN ROMAN URDU/HINDI (using English alphabets, e.g., 'Main theek hu, aap batayein me apki kya madad karu'). NEVER use Arabic/Urdu script because the text-to-speech engine cannot read it. DO NOT use markdown formatting.",
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
