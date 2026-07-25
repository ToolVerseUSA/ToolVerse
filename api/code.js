export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, language } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in environment variables." });
    }

    // Updated Prompt: Strictly telling AI NOT to minify the code and preserve line breaks properly.
    const systemPrompt = `You are an elite, world-class Senior Staff Software Engineer. 
    Your job is to write production-ready, highly optimized, bug-free, and secure code.
    
    The user wants code for: "${prompt}"
    Preferred Language/Framework: "${language || 'Auto-detect best fit'}"

    Output STRICTLY as a valid JSON object. 
    CRITICAL INSTRUCTION FOR "code" FIELD: DO NOT minify the code. You MUST preserve all indentation, formatting, and line breaks. Escape newlines properly as \\n inside the JSON string. Do NOT wrap the code in markdown (\`\`\`).

    {
      "thought_process": "1-2 sentences explaining your approach.",
      "language": "The programming language name in lowercase (e.g., javascript, python, html, css)",
      "code": "The fully formatted, multi-line code goes here.",
      "instructions": "1-2 bullet points on how to run this code."
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
                temperature: 0.3, // Slightly increased to avoid single-line loops
                response_format: { type: "json_object" }
            })
        });

        const data = await apiResponse.json();

        // Handle Groq specific JSON formatting errors gracefully
        if (data.error && data.error.message.includes("Failed to generate JSON")) {
            return res.status(500).json({ error: "AI formatting error. Please click generate again." });
        }

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({ error: data.error?.message || "Groq API Error" });
        }

        let jsonString = data.choices[0].message.content.trim();
        
        // Clean markdown if AI stubbornly includes it
        if (jsonString.startsWith("```json")) {
            jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonString.startsWith("```")) {
            jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsedContent = JSON.parse(jsonString);
        return res.status(200).json(parsedContent);

    } catch (error) {
        console.error("Code Generation Error:", error);
        return res.status(500).json({ error: "Failed to parse code properly. Please try clicking generate again." });
    }
}
