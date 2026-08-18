// =================================================================
// VVIP GROQ API HANDLER - TOOLVERSE PRO (FINAL FIX)
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

        // =========================================================
        // SMART ROUTER (128K Heavy-Duty King)
        // =========================================================
        let finalModel = model || "llama-3.1-8b-instant"; 
        
        if (systemPrompt && systemPrompt.includes("10x AI Software Engineer")) {
            // Groq کا سب سے لیٹسٹ اور بڑی میموری والا ماڈل جو کبھی نہیں کٹے گا
            finalModel = "llama-3.3-70b-versatile"; 
        } 
        else {
            // باقی پرانے ٹولز (Data Analyst وغیرہ) اپنے پرانے ماڈل پر ہی رہیں گے
            finalModel = model || "llama-3.1-8b-instant"; 
        }

        // 2. LOAD BALANCING
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

        // 3. GROQ API CALL
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
                max_tokens: 6000 // اب ہم اسے پوری پاور دے سکتے ہیں
            })
        });

        // 4. ERROR HANDLING
        if (!groqResponse.ok) {
            const errData = await groqResponse.text();
            throw new Error(`Groq API Error ${groqResponse.status}: ${errData}`);
        }

        const data = await groqResponse.json();
        let reply = data.choices[0].message.content;

        reply = reply.replace(/<think>[\s\S]*?<\/think>\n*/gi, '').trim();

        return res.status(200).json({ result: reply });

    } catch (error) {
        console.error("Backend Error:", error);
        const errorMsg = `[THOUGHTS]
Server encountered a critical error. Scanning details...
[/THOUGHTS]
[LANGUAGE]
javascript
[/LANGUAGE]
[CODE]
/* 
===========================================
 ⚠️ SYSTEM ERROR REPORT 
===========================================
عمران بھائی، مسئلہ یہ ہے:

${error.message}

===========================================
*/
[/CODE]
[INSTRUCTIONS]
Please read the exact error above to find the root cause.
[/INSTRUCTIONS]`;

        return res.status(200).json({ result: errorMsg });
    }
}
