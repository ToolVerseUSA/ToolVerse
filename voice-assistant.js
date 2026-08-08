// ==========================================
// VVIP VOICE ASSISTANT MODULE - TOOLVERSE PRO
// ==========================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const voiceModal = document.getElementById('voice-modal');
const statusText = document.getElementById('voice-status');
const transcriptText = document.getElementById('voice-text');
const waveIcon = document.getElementById('wave-icon');

let isProcessing = false; // System کو اوورلوڈ ہونے سے بچانے کے لیے

if (recognition) {
    recognition.continuous = false;
    // Browser کی ڈیفالٹ زبان استعمال کرے گا، لیکن AI یوزر کی زبان میں ہی جواب دے گا
    recognition.lang = navigator.language || 'en-US'; 
    recognition.interimResults = false;

    // 1. جب یوزر بولنا شروع کرے گا
    recognition.onstart = () => {
        isProcessing = true;
        statusText.innerText = "Listening...";
        statusText.style.color = "#4ade80"; // Green
        waveIcon.style.color = "#4ade80";
        waveIcon.classList.add('fa-beat-fade'); // لائیو اینیمیشن
        transcriptText.innerHTML = "Speak your command...";
    };

    // 2. جب یوزر بولنا بند کر دے
    recognition.onspeechend = () => {
        recognition.stop();
    };

    // 3. جب یوزر کی آواز ٹیکسٹ میں بدل جائے اور AI کو بھیجی جائے
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

    // 4. ایرر ہینڈلنگ (اگر مائیک خراب ہو یا پرمیشن نہ ہو)
    recognition.onerror = (event) => {
        statusText.innerText = "Microphone Error";
        statusText.style.color = "#ff4757"; // Red
        waveIcon.style.color = "#ff4757";
        waveIcon.classList.remove('fa-beat-fade', 'fa-bounce', 'fa-flip');
        transcriptText.innerText = `Error: ${event.error}. Please allow microphone access.`;
        isProcessing = false;
        
        setTimeout(closeVoiceModal, 4000);
    };
}

// ماڈل اوپن کرنے کا فنکشن
function toggleVoiceModal() {
    if (!recognition) { 
        alert("⚠️ Voice Assistant is not supported in your current browser. Please use Google Chrome, Edge, or Safari."); 
        return; 
    }
    if (isProcessing) return; // اگر پہلے سے چل رہا ہے تو دوبارہ کلک کام نہیں کرے گا
    
    voiceModal.style.display = 'flex';
    recognition.start();
}

// ماڈل کلوز کرنے کا فنکشن
function closeVoiceModal() {
    if(recognition) recognition.stop();
    window.speechSynthesis.cancel();
    voiceModal.style.display = 'none';
    isProcessing = false;
    
    // UI کو نارمل حالت میں لانا
    waveIcon.classList.remove('fa-beat-fade', 'fa-bounce', 'fa-flip');
    waveIcon.style.color = "#38bdf8";
}

// AI کے ٹیکسٹ کو آواز میں بدلنے کا فول پروف فنکشن
function speakText(text) {
    if (!window.speechSynthesis) {
        statusText.innerText = "Audio not supported on this device.";
        setTimeout(closeVoiceModal, 4000);
        return;
    }

    // AI اکثر مارک ڈاؤن لگا دیتا ہے جو بولنے میں برا لگتا ہے، یہ اسے صاف کرے گا
    const cleanText = text.replace(/[*#_`]/g, '');

    const msg = new SpeechSynthesisUtterance(cleanText);
    
    msg.onend = () => {
        statusText.innerText = "Done.";
        statusText.style.color = "#10b981";
        waveIcon.classList.remove('fa-flip');
        setTimeout(closeVoiceModal, 3000);
    };

    msg.onerror = () => {
        statusText.innerText = "Done.";
        setTimeout(closeVoiceModal, 3000);
    };

    window.speechSynthesis.speak(msg);
}

// Groq 70B Model سے کنکشن (فاسٹ اور بہترین جواب کے لیے)
async function sendToAI(command) {
    try {
        const response = await fetch('/api/groq-handler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // VVIP PROMPT: یہ AI کو سختی سے ہدایت دے گا کہ مختصر اور یوزر کی زبان میں بات کرے
                systemPrompt: "You are 'ToolVerse AI', a highly intelligent, polite, and premium voice assistant. Your job is to guide the user and answer their questions. CRITICAL RULE: You MUST reply in the exact same language the user speaks to you (e.g., if the user speaks Urdu, reply in Urdu. If English, reply in English). Keep your responses conversational, very concise (1 to 2 short sentences maximum), and completely free of special formatting like markdown, asterisks, or bold text so it reads cleanly as natural audio.",
                userPrompt: command,
                model: 'llama-3.3-70b-versatile'
            })
        });
        
        if (!response.ok) throw new Error("API Rate Limit or Network Error");
        
        const data = await response.json();
        return data.result || "I'm sorry, I couldn't process that right now.";
    } catch (error) {
        console.error("Voice AI Error:", error);
        return "Sorry, I am facing a connection issue right now. Please try again.";
    }
}
