export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, language } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in environment variables." });
    }

    // Pro Version Engineering Prompt
    const systemPrompt = `You are an elite, world-class Senior Staff Software Engineer. 
    Your job is to write production-ready, highly optimized, bug-free, and secure code.
    Always follow modern best practices and include concise professional comments.
    
    The user wants code for: "${prompt}"
    Preferred Language/Framework: "${language || 'Auto-detect best fit'}"

    Output STRICTLY as a JSON object with the exact following structure, and nothing else:
    {
      "thought_process": "1-2 sentences explaining your highly optimized approach.",
      "language": "The programming language name in lowercase (e.g., javascript, python, html, css)",
      "code": "The raw, perfectly formatted code. Do NOT wrap it in markdown code blocks (\`\`\`). Just the pure code string.",
      "instructions": "1-2 bullet points on how to run or implement this code."
    }`;

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
                    { role: "system", content: "You output valid JSON only. You are an expert programmer." },
                    { role: "user", content: systemPrompt }
                ],
                temperature: 0.2, // Temperature بہت کم رکھی ہے تاکہ کوڈ میں کوئی غلطی نہ ہو
                response_format: { type: "json_object" }
            })
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({ error: data.error?.message || "Groq API Error" });
        }

        let jsonString = data.choices[0].message.content.trim();
        if (jsonString.startsWith("```json")) {
            jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonString.startsWith("```")) {
            jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsedContent = JSON.parse(jsonString);
        return res.status(200).json(parsedContent);

    } catch (error) {
        return res.status(500).json({ error: "Failed to generate code. Please try again." });
    }
}
