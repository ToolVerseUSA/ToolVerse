export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { systemPrompt, userPrompt } = req.body;

    if (!process.env.GROQ_API_KEY) {
        console.error("🚨 Missing GROQ_API_KEY");
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
                // 👇 یہاں میں نے Groq کا لیٹسٹ اور فاسٹ ماڈل اپڈیٹ کر دیا ہے 👇
                model: "llama-3.3-70b-versatile", 
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("🚨 Groq API Error:", data);
            return res.status(response.status).json({ 
                error: data.error?.message || 'Error from Groq API server' 
            });
        }

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
