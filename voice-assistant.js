// =================================================================
// VVIP GROQ API HANDLER - TOOLVERSE PRO (SMART TOKEN ROUTER)
// =================================================================
export const maxDuration = 60; 

export default async function handler(req, res) {
    const allowedOrigins = ['https://toolverse-usa.vercel.app', 'http://localhost:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        const { systemPrompt, userPrompt, model } = req.body;
        const finalUserPrompt = userPrompt || 'Hello';
        let finalModel = model || "qwen/qwen3.6-27b"; 

        // =========================================================
        // SMART TOKEN ROUTER (MAGIC FIX) 🧠
        // =========================================================
        let dynamicMaxTokens = 2000; // عام ٹولز کے لیے درمیانی سیف لمٹ

        if (systemPrompt && systemPrompt.includes("10x AI Software Engineer")) {
            // 🚀 Code Generator کے لیے فل پاور (کوئی کوڈ نہیں کٹے گا)
            finalModel = "qwen/qwen3.6-27b"; 
            dynamicMaxTokens = 6000; 
        } 
        else if (systemPrompt && systemPrompt.includes("ToolVerse AI")) {
            // 🎙️ Voice Assistant کے لیے انتہائی کم ٹوکنز (کبھی Error 429 نہیں آئے گا)
            dynamicMaxTokens = 300; 
        }
        
        // =========================================================
        // LOAD BALANCING
        // =========================================================
        const API_KEYS = [
            process.env.GROQ_API_KEY,      
            process.env.GROQ_API_KEY_2,    
            process.env.GROQ_API_KEY_3,    
            process.env.GROQ_API_KEY_4,    
            process.env.GROQ_API_KEY_5     
        ].filter(Boolean); 

        if (API_KEYS.length === 0) {
            throw new Error("Server API keys are not configured in Vercel!");
        }

        const randomKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];

        // =========================================================
        // GROQ API CALL
        // =========================================================
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${randomKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: finalModel, 
                messages: [
                    { role: 'system', content: systemPrompt || 'You are an elite developer.' },
                    { role: 'user', content: finalUserPrompt } 
                ],
                temperature: 0.4, 
                max_tokens: dynamicMaxTokens // 👈 اب یہ خود فیصلہ کرے گا کہ کسے کتنے ٹوکنز دینے ہیں!
            })
        });

        if (!groqResponse.ok) {
            const errData = await groqResponse.text();
            throw new Error(`Groq API Error ${groqResponse.status}: ${errData}`);
        }

        const data = await groqResponse.json();
        let reply = data.choices[0].message.content;

        // BULLETPROOF <THINK> TAG CLEANER
        reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '');
        reply = reply.replace(/<think>[\s\S]*/gi, '');
        reply = reply.trim();

        return res.status(200).json({ result: reply });

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(200).json({ result: `[ERROR_LOG]\n${error.message}` });
    }
}
