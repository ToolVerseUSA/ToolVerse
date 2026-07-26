export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { description } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in environment variables." });
    }

    const systemPrompt = `You are an elite Regex Expert and Software Architect. The user wants a Regular Expression based on this description:
    "${description}"

    Provide the following precisely:
    1. The exact regex pattern (clean, without outer slashes unless necessary).
    2. A clear, step-by-step breakdown explanation of how the regex works.
    3. Ready-to-use JavaScript and Python implementation snippets.

    CRITICAL INSTRUCTION: Output your response strictly wrapped inside these XML tags:
    <regex>your_regex_pattern_here</regex>
    <explanation>Your detailed step-by-step breakdown here...</explanation>
    <jscode>javascript implementation snippet here</jscode>
    <pythoncode>python implementation snippet here</pythoncode>`;

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
                temperature: 0.2
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

        return res.status(200).json({
            regex: extractTag(content, 'regex'),
            explanation: extractTag(content, 'explanation'),
            jscode: extractTag(content, 'jscode'),
            pythoncode: extractTag(content, 'pythoncode')
        });

    } catch (error) {
        console.error("Regex API Error:", error);
        return res.status(500).json({ error: "Failed to generate regex with AI." });
    }
}
