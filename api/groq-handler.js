// =================================================================
// VVIP GROQ API HANDLER - TOOLVERSE PRO (FINAL SMART ROUTER)
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
        const { systemPrompt, userPrompt, model, useWebSearch } = req.body;

        // =========================================================
        // 1. LIVE WEB SEARCH LOGIC (TAVILY API) 🌐
        // =========================================================
        let finalUserPrompt = userPrompt || 'Hello';

        if (useWebSearch) {
            const tavilyApiKey = process.env.TAVILY_API_KEY;
            
            if (!tavilyApiKey) {
                console.log("⚠️ Tavily API Key missing in Vercel!");
            } else {
                try {
                    const searchResponse = await fetch('https://api.tavily.com/search', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${tavilyApiKey}`
                        },
                        body: JSON.stringify({
                            query: userPrompt,
                            search_depth: "basic",
                            max_results: 3
                        })
                    });

                    if (searchResponse.ok) {
                        const searchData = await searchResponse.json();
                        const searchContext = searchData.results.map(r => `Title: ${r.title}\nContent: ${r.content}`).join('\n\n');
                        finalUserPrompt = `[LIVE WEB SEARCH RESULTS]\n${searchContext}\n\n[USER QUESTION]\n${userPrompt}\n\nInstructions: Answer the user's question using the live web search results provided above.`;
                    } else {
                        console.error("Tavily Error:", await searchResponse.text());
                    }
                } catch (searchError) {
                    console.error("Web Search Error:", searchError);
                }
            }
        }

        // =========================================================
        // 2. SMART ROUTER & TOKEN MANAGER 🧠 (The Magic Fix)
        // =========================================================
        let finalModel = model || "qwen/qwen3.6-27b"; 
        let dynamicMaxTokens = 2048; // عام ایجنٹس اور سرچ کے لیے سیف لمٹ

        // اگر کوڈ جنریٹر ہے تو اسے فل پاور دیں گے
        if (systemPrompt && systemPrompt.includes("10x AI Software Engineer")) {
            finalModel = "qwen/qwen3.6-27b"; 
            dynamicMaxTokens = 6000; // 🚀 کوڈ جنریٹر کے لیے 6000 ٹوکنز!
        } 
        
        // 3. LOAD BALANCING
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

        // 4. GROQ API CALL
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
                max_tokens: dynamicMaxTokens // 👈 اب یہ خود فیصلہ کرے گا!
            })
        });

        if (!groqResponse.ok) {
            const errData = await groqResponse.text();
            throw new Error(`Groq API Error ${groqResponse.status}: ${errData}`);
        }

        const data = await groqResponse.json();
        let reply = data.choices[0].message.content;

        // 5. BULLETPROOF <THINK> TAG CLEANER
        reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '');
        reply = reply.replace(/<think>[\s\S]*/gi, '');
        reply = reply.trim();

        return res.status(200).json({ result: reply });

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(200).json({ result: `[ERROR_LOG]\n${error.message}` });
    }
}
