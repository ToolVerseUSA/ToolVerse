// =================================================================
// VVIP GROQ API HANDLER - TOOLVERSE PRO (FINAL FIX + LIVE SEARCH)
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
        // یہاں ہم نے useWebSearch کا سگنل فرنٹ اینڈ سے ریسیو کرنے کی سیٹنگ کر دی ہے
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
                    // Tavily API کو کال کر کے لائیو ڈیٹا لانا
                    const searchResponse = await fetch('https://api.tavily.com/search', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'api-key': tavilyApiKey
                        },
                        body: JSON.stringify({
                            query: userPrompt,
                            search_depth: "basic",
                            max_results: 3
                        })
                    });

                    if (searchResponse.ok) {
                        const searchData = await searchResponse.json();
                        // انٹرنیٹ سے آنے والے رزلٹس کو ایک جگہ اکٹھا کرنا
                        const searchContext = searchData.results.map(r => `Title: ${r.title}\nContent: ${r.content}`).join('\n\n');
                        
                        // یوزر کے سوال کے ساتھ لائیو انٹرنیٹ کا ڈیٹا جوڑ کر ماڈل کو بھیجنا
                        finalUserPrompt = `[LIVE WEB SEARCH RESULTS]\n${searchContext}\n\n[USER QUESTION]\n${userPrompt}\n\nInstructions: Answer the user's question using the live web search results provided above.`;
                    }
                } catch (searchError) {
                    console.error("Web Search Error:", searchError);
                    // اگر سرچ میں کوئی مسئلہ آئے تو پرانا پرامپٹ ہی چلے گا
                }
            }
        }

        // =========================================================
        // SMART ROUTER (100% Working & Supported Model)
        // =========================================================
        let finalModel = model || "qwen/qwen3.6-27b"; 
        
        if (systemPrompt && systemPrompt.includes("10x AI Software Engineer")) {
            // Code Generator کے لیے 100% سپورٹڈ اور سٹیبل ماڈل
            finalModel = "qwen/qwen3.6-27b"; 
        } 
        else {
            // باقی پرانے ٹولز (Data Analyst وغیرہ) اپنے پرانے ماڈل پر ہی رہیں گے
            finalModel = model || "qwen/qwen3.6-27b"; 
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
                    // یہاں اب ہم finalUserPrompt بھیجیں گے جس میں لائیو سرچ شامل ہو گی (اگر آن ہوئی تو)
                    { role: 'user', content: finalUserPrompt } 
                ],
                temperature: 0.4, 
                max_tokens: 6000
            })
        });

        // 4. ERROR HANDLING
        if (!groqResponse.ok) {
            const errData = await groqResponse.text();
            throw new Error(`Groq API Error ${groqResponse.status}: ${errData}`);
        }

        const data = await groqResponse.json();
        let reply = data.choices[0].message.content;

        // =========================================================
        // BULLETPROOF <THINK> TAG CLEANER (Upgraded)
        // =========================================================
        // 1. Remove standard closed <think> tags
        reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '');
        // 2. Remove any unclosed or leftover <think> tags
        reply = reply.replace(/<think>[\s\S]*/gi, '');
        // 3. Clean up any leading/trailing garbage or extra spaces
        reply = reply.trim();

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
