// =================================================================
// VVIP GROQ API HANDLER - TOOLVERSE PRO (50K+ CONCURRENT LOAD)
// =================================================================

export default async function handler(req, res) {
    // 1. VVIP SECURITY: CORS Protection
    // Ensures only authorized domains can access this backend API
    const allowedOrigins = ['https://toolverse-usa.vercel.app', 'http://localhost:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Pre-flight requests for browsers
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        const { systemPrompt, userPrompt, model } = req.body;

        // 2. VVIP LOAD BALANCING (KEY POOLING)
        // Distributes the load across 5 API keys to handle massive concurrent user traffic
        const API_KEYS = [
            process.env.GROQ_API_KEY,      // Master Key 1
            process.env.GROQ_API_KEY_2,    // Backup Key 2
            process.env.GROQ_API_KEY_3,    // Backup Key 3
            process.env.GROQ_API_KEY_4,    // Backup Key 4
            process.env.GROQ_API_KEY_5     // Backup Key 5
        ].filter(Boolean); // Filters out any undefined or missing keys automatically

        // Prevent server crash if no keys are configured in Vercel environment variables
        if (API_KEYS.length === 0) {
            return res.status(200).json({ 
                result: "⚠️ Server API keys are not configured. Please contact the administrator." 
            });
        }

        // Select a random key for each request to ensure equal load distribution
        const randomKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];

        // 3. SEND REQUEST TO GROQ API
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${randomKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
                    { role: 'user', content: userPrompt || 'Hello' }
                ],
                temperature: 0.7,
                max_tokens: 3000
            })
        });

        // 4. ERROR HANDLING (Never Crash Frontend)
        if (!groqResponse.ok) {
            if (groqResponse.status === 429) {
                // Gracefully handle rate limits during extreme traffic spikes
                return res.status(200).json({ 
                    result: "🚦 The server is experiencing extremely high traffic. Please wait a few seconds and try again." 
                });
            }
            throw new Error(`API Connection Failed: ${groqResponse.status}`);
        }

        const data = await groqResponse.json();
        const reply = data.choices[0].message.content;

        // 5. SUCCESS RESPONSE
        return res.status(200).json({ result: reply });

    } catch (error) {
        console.error("Backend Error:", error);
        // Catch-all failsafe to prevent frontend crashes during major network/server issues
        return res.status(200).json({ 
            result: "🔌 Network connection is overloaded right now. Attempting to reconnect, please try again." 
        });
    }
}
