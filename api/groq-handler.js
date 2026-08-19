// =================================================================
// TOOLVERSE PRO - ADVANCED GROQ HANDLER (Load Balancing + Auto-Retry)
// =================================================================
export const maxDuration = 60; 

export default async function handler(req, res) {
    // 1. CORS Setup
    const allowedOrigins = ['https://toolverse-usa.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:5500'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*'); 
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tool-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

    try {
        const { systemPrompt, userPrompt, model } = req.body;
        const finalUserPrompt = userPrompt || 'Hello';
        let finalModel = model || "qwen/qwen3.6-27b";
        
        // =========================================================
        // 2. DYNAMIC TOKEN ROUTING (Bolt's Smart Strategy)
        // =========================================================
        let dynamicMaxTokens = 2000; // Default for normal tools
        let temperature = 0.5;
        
        const toolType = req.headers['x-tool-type'] || '';

        // Code Generator Detection (Max Power)
        if (toolType === 'code-generator' || (systemPrompt && systemPrompt.includes("10x AI Software Engineer"))) {
            finalModel = "qwen/qwen3.6-27b";
            dynamicMaxTokens = 6000;
            temperature = 0.2;
        } 
        // Voice Assistant Detection (Fast & Lightweight)
        else if (toolType === 'voice-assistant' || (systemPrompt && systemPrompt.includes("ToolVerse AI"))) {
            dynamicMaxTokens = 300;
            temperature = 0.7;
        }

        // =========================================================
        // 3. LOAD BALANCING WITH 5 API KEYS
        // =========================================================
        const API_KEYS = [
            process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3,
            process.env.GROQ_API_KEY_4,
            process.env.GROQ_API_KEY_5
        ].filter(Boolean);

        if (API_KEYS.length === 0) {
            return res.status(500).json({ result: "Server API keys missing." });
        }

        // =========================================================
        // 4. AUTO-RETRY LOGIC (If one key gives Error 429, try next!)
        // =========================================================
        let availableKeys = [...API_KEYS].sort(() => 0.5 - Math.random()); // Shuffle keys
        let maxRetries = 3; // Maximum attempts

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            if (availableKeys.length === 0) break;
            
            let currentKey = availableKeys[0]; // Pick the first available key

            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: finalModel,
                    messages: [
                        { role: 'system', content: systemPrompt || 'You are an AI assistant.' },
                        { role: 'user', content: finalUserPrompt }
                    ],
                    temperature: temperature,
                    max_tokens: dynamicMaxTokens
                })
            });

            if (groqResponse.ok) {
                const data = await groqResponse.json();
                let reply = data.choices[0].message.content;
                
                // Cleanup <think> tags for clean output
                reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                
                return res.status(200).json({ result: reply });
            } 
            else if (groqResponse.status === 429) {
                // Rate limit hit on this key! Remove it and try the next one.
                availableKeys.shift(); 
                continue; 
            } 
            else {
                const errText = await groqResponse.text();
                throw new Error(`API Error: ${errText}`);
            }
        }

        // If loop finishes and all keys hit 429 limits
        return res.status(429).json({ result: "System is highly busy right now. Please wait a few seconds and try again." });

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ result: `Connection Error. Please check network.` });
    }
}
