export default async function handler(req, res) {
    // 1. CORS اور میتھڈ چیک
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { systemPrompt, userPrompt } = req.body;

    // 2. چیک کریں کہ کیا Vercel کو API Key مل رہی ہے؟
    if (!process.env.GROQ_API_KEY) {
        console.error("🚨 Missing GROQ_API_KEY in Vercel Environment Variables");
        return res.status(500).json({ error: 'API Key is missing in Vercel settings.' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Groq کا سب سے تیز اور سٹیبل ماڈل
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        const data = await response.json();

        // 3. اگر Groq نے کوئی ایرر دیا (جیسے لمٹ ختم ہونا یا Key غلط ہونا)
        if (!response.ok) {
            console.error("🚨 Groq API Error:", data);
            // یہ اصل ایرر آپ کی ویب سائٹ کی سکرین پر بھیجے گا
            return res.status(response.status).json({ 
                error: data.error?.message || 'Error from Groq API server' 
            });
        }

        // 4. اگر سب کچھ پرفیکٹ ہے تو جواب بھیجیں
        if (data.choices && data.choices.length > 0) {
            res.status(200).json({ result: data.choices[0].message.content });
        } else {
            throw new Error("Groq returned an empty response.");
        }

    } catch (error) {
        console.error("🚨 Server Crash Error:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error in Vercel' });
    }
}
