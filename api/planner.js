export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { goal } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in environment variables." });
    }

    const prompt = `Break down this goal into 3 to 5 highly actionable steps: "${goal}". For each step, provide a short title and a 1-sentence practical description. Output strictly as a JSON object containing an array named 'steps' with 'title' and 'description' keys.`;

    try {
        const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a helpful task planning assistant that outputs strict JSON." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({ 
                error: data.error?.message || "Groq API Error" 
            });
        }

        const content = data.choices[0].message.content;
        const parsedContent = JSON.parse(content);
        
        // یہ لائن یقینی بنائے گی کہ چاہے 'steps' ہو یا ڈائریکٹ ارے، ڈیٹا بالکل ٹھیک پاس ہو
        const steps = parsedContent.steps || parsedContent.tasks || (Array.isArray(parsedContent) ? parsedContent : Object.values(parsedContent)[0]);

        return res.status(200).json({ steps: steps });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error during Groq processing." });
    }
}
