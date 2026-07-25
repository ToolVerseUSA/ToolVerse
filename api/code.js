export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, language } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in environment variables." });
    }

    // Bulletproof Prompt: Using XML Tags instead of JSON to prevent escaping errors
    const systemPrompt = `You are an elite, world-class Senior Staff Software Engineer.
    Your job is to write production-ready, highly optimized, bug-free, and secure code.

    The user wants code for: "${prompt}"
    Preferred Language/Framework: "${language || 'Auto-detect best fit'}"

    CRITICAL INSTRUCTION: DO NOT output JSON. Format your EXACT response using the following tags. Keep all line breaks, spaces, and formatting perfectly intact inside the <code> tag.

    <thought>
    1-2 sentences explaining your highly optimized approach.
    </thought>

    <lang>
    the_language_name_in_lowercase (e.g., javascript, python, html, css)
    </lang>

    <code>
    Write the fully formatted, beautifully indented multi-line code here. Do NOT use markdown code blocks (\`\`\`).
    </code>

    <instructions>
    1-2 bullet points on how to run or implement this code.
    </instructions>`;

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
                    { role: "system", content: "You follow formatting instructions strictly. You are an expert programmer." },
                    { role: "user", content: systemPrompt }
                ],
                temperature: 0.3
                // JSON فارمیٹ کو یہاں سے ہٹا دیا گیا ہے تاکہ ایرر نہ آئے
            })
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({ error: data.error?.message || "Groq API Error" });
        }

        const content = data.choices[0].message.content;

        // Regex Parser: ماڈل کے ٹیکسٹ میں سے ٹیگز کو محفوظ طریقے سے نکالنے کا فنکشن
        const extractTag = (text, tag) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
            const match = text.match(regex);
            return match ? match[1].trim() : "";
        };

        let thought = extractTag(content, 'thought') || "Optimized approach applied.";
        let lang = extractTag(content, 'lang') || "javascript";
        let code = extractTag(content, 'code') || "// Error generating code.";
        let instructions = extractTag(content, 'instructions') || "Run in the appropriate environment.";

        // اگر ماڈل ضد میں آ کر ``` (markdown) لگا دے تو اسے ہٹانے کا لاجک
        if (code.startsWith("```")) {
            code = code.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "").trim();
        }

        // آخر میں ہم خود فرنٹ اینڈ کو پرفیکٹ JSON بنا کر بھیج دیں گے
        return res.status(200).json({
            thought_process: thought,
            language: lang,
            code: code,
            instructions: instructions
        });

    } catch (error) {
        console.error("Code Generation Error:", error);
        return res.status(500).json({ error: "Failed to generate code. Please try again." });
    }
}
