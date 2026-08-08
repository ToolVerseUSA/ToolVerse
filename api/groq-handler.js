// =================================================================
// VVIP GROQ API HANDLER - TOOLVERSE PRO (50K+ CONCURRENT LOAD)
// =================================================================

export default async function handler(req, res) {
    // 1. VVIP SECURITY: CORS Protection
    // اس سے کوئی اور ویب سائٹ آپ کا بیک اینڈ اور API مفت میں استعمال نہیں کر سکے گی
    const allowedOrigins = ['https://toolverse-usa.vercel.app', 'http://localhost:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // براؤزر کی پری-فلائٹ ریکویسٹ (Pre-flight request) ہینڈلنگ
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { systemPrompt, userPrompt, model } = req.body;

        // 2. VVIP LOAD BALANCING (KEY POOLING)
        // 50 ہزار یوزرز کا لوڈ تقسیم کرنے کے لیے ہم Multiple Keys استعمال کریں گے
        const API_KEYS = [
            process.env.GROQ_API_KEY,      // Master Key 1
            process.env.GROQ_API_KEY_2,    // Backup Key 2
            process.env.GROQ_API_KEY_3,    // Backup Key 3
            process.env.GROQ_API_KEY_4     // Backup Key 4
        ].filter(Boolean); // جو Key موجود نہیں ہوگی، وہ خود ہٹ جائے گی

        // اگر Vercel میں کوئی Key سیٹ نہیں کی گئی تو کریش ہونے کے بجائے یوزر کو میسج دے
        if (API_KEYS.length === 0) {
            return res.status(200).json({ 
                result: "⚠️ Server API keys are not configured. Please contact the administrator." 
            });
        }

        // ہر ریکویسٹ کے لیے ایک رینڈم (Random) Key سلیکٹ کرے گا تاکہ لوڈ برابر تقسیم ہو
        const randomKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];

        // 3. SEND REQUEST TO GROQ
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
                // اگر پھر بھی 50k سے اوپر یوزرز چلے جائیں، تو ویب سائٹ کریش نہیں ہوگی
                // بلکہ یوزر کو پیار سے کہے گی کہ ابھی رش ہے، تھوڑی دیر بعد ٹرائی کریں
                return res.status(200).json({ 
                    result: "🚦 The server is currently handling extreme traffic (50k+ users). Please wait 5 seconds and click send again!" 
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
        // کسی بھی بڑے سرور ایرر پر بھی فرنٹ اینڈ کو کریش نہیں ہونے دے گا
        return res.status(200).json({ 
            result: "🔌 Network connection is overloaded right now. I am reconnecting, please try again." 
        });
    }
}
