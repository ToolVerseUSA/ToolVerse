export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { goal } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in environment variables." });
    }

    const prompt = `Act as an expert growth strategist and senior content producer. Break down this goal into 4 to 5 elite, highly detailed, and actionable steps: "${goal}". For each step, provide a catchy title and a rich, professional, 2-sentence practical description focusing on high retention, modern workflows, and strategic optimization. Output strictly as a JSON object containing an array named 'steps' with 'title' and 'description' keys.`;

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
                    { role: "system", content: "You are a helpful assistant that outputs valid JSON only, with no extra text." },
                    { role: "user", content: prompt }
                ],
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
        
        // صاف کرنے کا طریقہ تاکہ اگر ماڈل کے ساتھ اضافی ٹیکسٹ آئے تو وہ نکل جائے
        let jsonString = content.trim();
        if (jsonString.startsWith("```json")) {
            jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonString.startsWith("```")) {
            jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsedContent = JSON.parse(jsonString);
        const steps = parsedContent.steps || parsedContent.tasks || (Array.isArray(parsedContent) ? parsedContent : Object.values(parsedContent)[0]);

        return res.status(200).json({ steps: steps });

    } catch (error) {
        return res.status(500).json({ error: "Failed to parse JSON response from AI." });
    }
}
