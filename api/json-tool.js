export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { rawJson, action } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in environment variables." });
    }

    let systemPrompt = "";
    
    // Action 1: Fix broken JSON using AI
    if (action === "fix") {
        systemPrompt = `You are an elite data engineer. The user has provided an invalid, broken, or messy JSON string. 
        Your task is to fix all syntax errors (missing quotes, trailing commas, unescaped characters, missing brackets) and return the perfectly valid, beautifully indented JSON.
        
        Raw Data: 
        ${rawJson}
        
        CRITICAL INSTRUCTION: Do NOT output anything else. Output ONLY the valid JSON wrapped strictly inside <code> XML tags.
        <code>
        { ...valid json here... }
        </code>`;
    } 
    // Action 2: Explain JSON Schema using AI
    else if (action === "explain") {
        systemPrompt = `You are a Senior Software Architect. The user has provided a JSON object.
        Analyze its structure and provide a highly professional, concise, and easy-to-understand explanation of its schema, what this data likely represents, and its key fields.
        
        JSON Data:
        ${rawJson}
        
        CRITICAL INSTRUCTION: Output your professional explanation wrapped strictly inside <explanation> XML tags.
        <explanation>
        Your response here...
        </explanation>`;
    }

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
                    { role: "system", content: "You strictly follow instructions and return data wrapped in the requested XML tags." },
                    { role: "user", content: systemPrompt }
                ],
                temperature: 0.1 // Extremely low temperature for accurate JSON fixing
            })
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({ error: data.error?.message || "Groq API Error" });
        }

        const content = data.choices[0].message.content;

        const extractTag = (text, tag) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
            const match = text.match(regex);
            return match ? match[1].trim() : "";
        };

        if (action === "fix") {
            let fixedCode = extractTag(content, 'code') || "{}";
            if (fixedCode.startsWith("```")) {
                fixedCode = fixedCode.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "").trim();
            }
            return res.status(200).json({ result: fixedCode });
        } else {
            return res.status(200).json({ result: extractTag(content, 'explanation') });
        }

    } catch (error) {
        console.error("JSON API Error:", error);
        return res.status(500).json({ error: "Failed to process JSON with AI." });
    }
}
