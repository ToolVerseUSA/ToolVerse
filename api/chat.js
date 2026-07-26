export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, system } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Message prompt is required' });
    }

    try {
        // Fetching response from Groq API (Llama-3.3-70b)
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // The ultra-fast Llama model
                messages: [
                    { 
                        role: 'system', 
                        content: system || 'You are a helpful, smart AI assistant.' 
                    },
                    { 
                        role: 'user', 
                        content: prompt 
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch from Groq API');
        }

        // Extracting the AI's reply
        const reply = data.choices[0].message.content;

        // Sending the reply back to the frontend Agent Studio
        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Agent Studio API Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
