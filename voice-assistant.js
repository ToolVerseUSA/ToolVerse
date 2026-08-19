// ==========================================
// VVIP VOICE ASSISTANT MODULE - TOOLVERSE PRO (FINAL)
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
        if(statusText) { statusText.innerHTML = "Listening..."; statusText.style.color = "#4ade80"; }
        if(waveIcon) { waveIcon.className = "fa-solid fa-waveform fa-beat-fade"; waveIcon.style.color = "#4ade80"; }
    };

    // 2. جب آواز بند ہو
    recognition.onspeechend = () => {
        recognition.stop();
    };

    // 3. جب کمانڈ AI کو جائے
    recognition.onresult = async (event) => {
        const userCommand = event.results[0][0].transcript;
        if(transcriptText) transcriptText.innerHTML = `<span style="color: white; font-weight: bold;">You:</span> ${userCommand}`;
        
        if(statusText) { statusText.innerHTML = "Thinking..."; statusText.style.color = "#f59e0b"; }
        if(waveIcon) { waveIcon.className = "fa-solid fa-waveform fa-bounce"; waveIcon.style.color = "#f59e0b"; }

        // AI سے جواب منگوانا
        const aiResponse = await sendToAI(userCommand);
        
        if(statusText) { statusText.innerHTML = "Speaking..."; statusText.style.color = "#38bdf8"; }
        if(waveIcon) { waveIcon.className = "fa-solid fa-waveform fa-flip"; waveIcon.style.color = "#38bdf8"; }

        if(transcriptText) transcriptText.innerHTML += `<br><br><span style="color: #38bdf8; font-weight: bold;">AI:</span> ${aiResponse}`;
        speakText(aiResponse);
    };

    // 4. خاموشی یا ایرر پر ہینڈلنگ
    recognition.onerror = (event) => {
        isProcessing = false;
        if (event.error === 'no-speech' && isModalOpen) {
            showTapToSpeakUI();
            return;
        }
        if(statusText) { statusText.innerHTML = "Error: " + event.error; statusText.style.color = "#ff4757"; }
        if(waveIcon) { waveIcon.className = "fa-solid fa-microphone-slash"; waveIcon.style.color = "#ff4757"; }
    };
}

// 🚀 ماڈل اوپن کرنے کا فنکشن 
window.toggleVoiceModal = function() {
    if (!recognition) { 
        alert("⚠️ Voice Assistant is not supported in your browser."); 
        return; 
    }
    isModalOpen = true;
    if(voiceModal) voiceModal.style.display = 'flex';
    if(transcriptText) transcriptText.innerHTML = "Speak your command...";
    forceStartRecognition();
};

// 🚀 ماڈل کلوز کرنے کا فنکشن 
window.closeVoiceModal = function() {
    isModalOpen = false;
    isProcessing = false;
    if(recognition) recognition.stop();
    window.speechSynthesis.cancel(); 
    if(voiceModal) voiceModal.style.display = 'none';
    
    if(waveIcon) { waveIcon.className = "fa-solid fa-waveform"; waveIcon.style.color = "#38bdf8"; }
    if(statusText) statusText.innerHTML = "Listening...";
};

// یوزر کو واضح دکھانے کے لیے UI فنکشن
function showTapToSpeakUI() {
    if (!isModalOpen) return;
    
    if(waveIcon) { waveIcon.className = "fa-solid fa-microphone fa-fade"; waveIcon.style.color = "#38bdf8"; }
    if(statusText) statusText.innerHTML = `<span style="display: inline-block; background: rgba(56, 189, 248, 0.1); border: 1px solid #38bdf8; padding: 8px 25px; border-radius: 30px; font-size: 1.2rem; cursor: pointer; color: #38bdf8; box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);">👇 Tap to Speak</span>`;
}

// Manual Override - آئیکن یا بٹن پر کلک
if(waveIcon) {
    waveIcon.style.cursor = "pointer";
    waveIcon.onclick = () => { if (!isProcessing && isModalOpen) forceStartRecognition(); };
}
if(statusText) {
    statusText.onclick = () => { if (!isProcessing && isModalOpen) forceStartRecognition(); };
}

function forceStartRecognition() {
    if (isProcessing) return;
    try {
        recognition.start();
    } catch(e) {
        console.log("Mic is already preparing...");
    }
}

// AI کے ٹیکسٹ کو آواز میں بدلنے کا فنکشن (Voice Match)
function speakText(text) {
    if (!window.speechSynthesis) {
        if(statusText) statusText.innerHTML = "Audio not supported.";
        isProcessing = false;
        return;
    }

    window.speechSynthesis.cancel(); 
    const cleanText = text.replace(/[*#_`]/g, ''); 
    const msg = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    const regionalVoice = voices.find(v => v.lang.includes('ur') || v.lang.includes('hi'));

    if (regionalVoice) {
        msg.voice = regionalVoice;
        msg.lang = regionalVoice.lang;
    } else {
        msg.lang = 'en-US';
    }

    msg.rate = 1.0; 

    msg.onend = () => {
        isProcessing = false;
        if (!isModalOpen) return; 
        showTapToSpeakUI();
    };

    msg.onerror = () => {
        isProcessing = false;
        if(isModalOpen) showTapToSpeakUI();
    };

    window.speechSynthesis.speak(msg);
}

// 🚀 Groq Model سے کنکشن (100% Foolproof Answer Extraction)
async function sendToAI(command) {
    try {
        const response = await fetch('/api/groq-handler', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Tool-Type': 'voice-assistant' 
            },
            body: JSON.stringify({
                systemPrompt: "You are 'ToolVerse AI', a helpful voice assistant. CRITICAL RULE: You MUST wrap your final spoken reply strictly inside [ANSWER] and [/ANSWER] tags. Example: [ANSWER]Main theek hoon, aap bataien?[/ANSWER]. Do not include the user's prompt in your answer. Give a direct 1-sentence reply matching the user's language.",
                userPrompt: command,
                model: 'qwen/qwen3.6-27b' 
            })
        });
        
        if (!response.ok) throw new Error("API Network Error");
        const data = await response.json();
        
        let cleanResult = data.result || "Sorry, I missed that.";
        
        // 🛑 نیا اور پکا فلٹر: صرف [ANSWER] کے اندر والی بات نکالے گا 🛑
        const answerMatch = cleanResult.match(/\[ANSWER\]([\s\S]*?)\[\/ANSWER\]/i);
        
        if (answerMatch && answerMatch[1]) {
            cleanResult = answerMatch[1]; 
        } else {
            let lines = cleanResult.split('\n').filter(line => line.trim() !== '');
            cleanResult = lines[lines.length - 1]; 
        }

        // آخری صفائی 
        return cleanResult.replace(/[*#_`~-]/g, '').trim();

    } catch (error) {
        return "Connection issue. Please try again.";
    }
}
