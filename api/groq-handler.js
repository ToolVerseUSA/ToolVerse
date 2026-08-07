export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // VVIP Update: Frontend سے model کا نام بھی ریسیو کریں گے
    const { systemPrompt, userPrompt, model } = req.body;

    if (!process.env.GROQ_API_KEY) {
        console.error("🚨 Missing GROQ_API_KEY");
        return res.status(500).json({ error: 'API Key is missing in Vercel settings.' });
    }

    // ==========================================
    // VVIP MODEL ROUTING LOGIC
    // ==========================================
    let groqModel = "llama-3.3-70b-versatile"; // Default Fast Model

    // اگر یوزر نے 405B (VVIP Scale) سلیکٹ کیا ہے
    if (model === "llama3_405b") {
        groqModel = "llama-3.1-405b-reasoning";
    } 
    // مستقبل میں GPT-4o یا Gemini کے لیے یہاں APIs لگیں گے، 
    // فی الحال وہ بغیر کسی ایرر کے Groq کے سب سے بیسٹ ماڈل پر چلیں گے۔

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // 👇 اب یہ ڈائنامک (Dynamic) ہو گیا ہے 👇
                model: groqModel, 
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                // 👇 PDF کے لمبے جوابات کے لیے ٹوکنز بڑھا دیے گئے ہیں 👇
                max_tokens: 4000 
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
