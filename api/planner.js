// File: api/planner.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { goal } = req.body;
    
    // یہ لائن Vercel سے آپ کی محفوظ کی گئی اصلی Key خود اٹھا لے گی
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: "API Key missing in Vercel" });

    const prompt = `Break down this goal into 3 to 5 highly actionable steps: "${goal}". For each step, provide a short title and a 1-sentence practical description. Output strictly as a JSON array with 'title' and 'description' keys.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.error?.message || "Google API Error" });
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}
