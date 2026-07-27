// api/super-chat.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, model } = req.body;

    try {
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            return res.status(500).json({ error: 'API Key missing in Vercel settings.' });
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", 
                messages: [
                    { 
                        role: "system", 
                        // AI کو سمپل ٹیکسٹ بھیجنے کی ہدایت
                        content: "You are ToolVerse Super AI, a helpful assistant. ALWAYS format your responses in clean, plain text with proper line breaks. DO NOT use markdown symbols like asterisks (**), hashes (###), or backticks. Just use simple text and empty lines to separate paragraphs and lists." 
                    },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Groq API Error:", data.error);
            return res.status(500).json({ error: data.error.message || 'Groq API rejected the request.' });
        }
        
        if (data.choices && data.choices.length > 0) {
            res.status(200).json({ reply: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: 'Empty response from AI.' });
        }

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: 'Internal Server Error check Vercel Logs.' });
    }
}
