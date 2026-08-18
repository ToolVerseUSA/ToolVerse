// =================================================================
// VVIP GROQ API HANDLER - TOOLVERSE PRO (SMART ROUTER)
// =================================================================
export const maxDuration = 60; // 👈 VVIP Timeout Unlocker

export default async function handler(req, res) {
    // 1. VVIP SECURITY: CORS Protection
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

        // =========================================================
        // VVIP SMART ROUTER (ماڈلز کو کنٹرول کرنے والا دماغ)
        // =========================================================
        let finalModel = model || "qwen/qwen3.6-27b";
        
        // 1. اگر Code Generator کی باری ہے (ہیوی کوڈنگ) تو Llama 3 استعمال کرو
        if (systemPrompt && systemPrompt.includes("10x AI Software Engineer")) {
            finalModel = "llama3-70b-8192";
        } 
        // 2. باقی تمام پرانے/خراب ماڈلز کو پکڑ کر واپس Qwen پر رکھو (تاکہ Data Analyst خراب نہ ہو)
        else if (finalModel.includes("versatile") || finalModel.toLowerCase().includes("llama-3.3")) {
            finalModel = "qwen/qwen3.6-27b";
        }

        // 2. VVIP LOAD BALANCING (KEY POOLING)
        const API_KEYS = [
            process.env.GROQ_API_KEY,      
            process.env.GROQ_API_KEY_2,    
            process.env.GROQ_API_KEY_3,    
            process.env.GROQ_API_KEY_4,    
            process.env.GROQ_API_KEY_5     
        ].filter(Boolean); 

        if (API_KEYS.length === 0) {
            return res.status(200).json({ 
                result: "⚠️ Server API keys are not configured. Please contact the administrator." 
            });
        }

        const randomKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];

        // 3. SEND REQUEST TO GROQ API
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
                    { role: 'user', content: userPrompt || 'Hello' }
                ],
                temperature: 0.4, 
                max_tokens: 3500  // سب کے لیے سیف لمٹ
            })
        });

        // 4. ERROR HANDLING
        if (!groqResponse.ok) {
            if (groqResponse.status === 429) {
                return res.status(200).json({ 
                    result: "🚦 The server is experiencing extremely high traffic. Please wait a few seconds and try again." 
                });
            }
            throw new Error(`API Connection Failed: ${groqResponse.status}`);
        }

        const data = await groqResponse.json();
        let reply = data.choices[0].message.content;

        // Remove <think> blocks if any
        reply = reply.replace(/<think>[\s\S]*?<\/think>\n*/gi, '').trim();

        // 5. SUCCESS RESPONSE
        return res.status(200).json({ result: reply });

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(200).json({ 
            result: "🔌 Network connection is overloaded right now. Attempting to reconnect, please try again." 
        });
    }
}
