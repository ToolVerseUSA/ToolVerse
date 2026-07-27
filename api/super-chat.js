// api/super-chat.js

export default async function handler(req, res) {
    // صرف POST ریکویسٹ کو اجازت دیں
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, model } = req.body;

    try {
        // Vercel Environment Variable سے Groq API Key لیں گے
        const groqApiKey = process.env.GROQ_API_KEY; 

        // Groq API (Llama-3) کو ریکویسٹ بھیج رہے ہیں
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-70b-8192", // Groq کا تیز ترین ماڈل
                messages: [
                    { role: "system", content: "You are ToolVerse Super AI, an extremely smart, highly advanced, and helpful assistant. Provide clear and concise answers." },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        
        // فرنٹ اینڈ کو جواب واپس بھیجیں
        if (data.choices && data.choices.length > 0) {
            res.status(200).json({ reply: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: 'Invalid response from AI provider' });
        }

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
