// File: api/planner.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { goal } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in Vercel environment variables." });
    }

    const prompt = `Break down this goal into 3 to 5 highly actionable steps: "${goal}". For each step, provide a short title and a 1-sentence practical description. Output strictly as a JSON array with 'title' and 'description' keys.`;

    try {
        // یہاں ہم نے آفیشل اور سب سے سورس فری ٹیر ماڈل 'gemini-1.5-flash' کا بالکل درست v1beta اینڈ پوائنٹ لگایا ہے
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({ 
                error: data.error?.message || "Google AI API Error" 
            });
        }

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error during AI processing." });
    }
}
