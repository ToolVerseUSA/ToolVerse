export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { goal, triggerType } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in environment variables." });
    }

    const systemPrompt = `You are an elite Autonomous AI Agent Architect and Workflow Automation Expert.
    Your job is to take a high-level user goal and design a complete, multi-step automated agent workflow.

    The user's automation goal: "${goal}"
    Trigger Type: "${triggerType || 'Scheduled / Event-driven'}"

    CRITICAL INSTRUCTION: DO NOT output JSON. Format your EXACT response using the following XML tags. Keep all line breaks, spaces, and formatting perfectly intact inside the code tags.

    <thought>
    1-2 sentences explaining how you decompose this goal into autonomous agent steps.
    </thought>

    <workflow_title>
    A catchy, professional title for this automation workflow.
    </workflow_title>

    <steps>
    Provide 3 to 5 detailed sequential steps the AI Agent will execute. Use bullet points or numbered lists.
    </steps>

    <code>
    Write the production-ready Node.js or Python automation script that powers this agentic workflow.
    </code>

    <monitoring>
    1-2 sentences on how to monitor errors and scale this automation.
    </monitoring>`;

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
                    { role: "system", content: "You are an expert AI agent workflow designer." },
                    { role: "user", content: systemPrompt }
                ],
                temperature: 0.3
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

        let thought = extractTag(content, 'thought') || "Workflow structured successfully.";
        let title = extractTag(content, 'workflow_title') || "Autonomous Agent Pipeline";
        let steps = extractTag(content, 'steps') || "1. Initialize trigger\n2. Execute core logic\n3. Output results";
        let code = extractTag(content, 'code') || "// No code required.";
        let monitoring = extractTag(content, 'monitoring') || "Check logs regularly.";

        if (code.startsWith("```")) {
            code = code.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "").trim();
        }

        return res.status(200).json({
            thought,
            title,
            steps,
            code,
            monitoring
        });

    } catch (error) {
        console.error("AI Agent Error:", error);
        return res.status(500).json({ error: "Failed to generate AI agent workflow. Please try again." });
    }
}
