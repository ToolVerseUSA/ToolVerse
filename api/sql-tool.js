export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { description, dbType, schemaContext } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in environment variables." });
    }

    const systemPrompt = `You are an elite Senior Database Administrator and Software Architect.
    The user wants an optimized database query for: ${dbType}.
    
    Database Schema/Context (if provided): 
    "${schemaContext || 'No specific schema provided, make logical assumptions for table/column names.'}"
    
    User's Request: 
    "${description}"

    Provide the following precisely:
    1. The exact, highly optimized query (SQL or NoSQL depending on the dbType chosen). Do not add markdown formatting inside the tags.
    2. A clear, step-by-step breakdown explanation of how the query works and why it is optimized.

    CRITICAL INSTRUCTION: Output your response strictly wrapped inside these XML tags:
    <query>your exact database query here without markdown ticks</query>
    <explanation>Your detailed step-by-step explanation here</explanation>`;

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
                    { role: "system", content: "You strictly follow instructions and return data wrapped in the requested XML tags. Never output markdown code blocks (```) inside the XML tags." },
                    { role: "user", content: systemPrompt }
                ],
                temperature: 0.2
            })
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({ error: data.error?.message || "Groq API Error" });
        }

        const content = data.choices[0].message.content;

        // Extract using XML tags
        const extractTag = (text, tag) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
            const match = text.match(regex);
            let extracted = match ? match[1].trim() : "";
            // Remove random markdown blocks if AI forgets rules
            extracted = extracted.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
            return extracted;
        };

        return res.status(200).json({
            query: extractTag(content, 'query'),
            explanation: extractTag(content, 'explanation')
        });

    } catch (error) {
        console.error("SQL API Error:", error);
        return res.status(500).json({ error: "Failed to generate query with AI." });
    }
}
