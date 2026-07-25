export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { notes } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key missing in environment variables." });
    }

    const prompt = `Act as an elite Executive Assistant and Project Manager. Analyze the following raw meeting notes/transcript and extract a highly structured, professional meeting minutes report. 
    Raw Notes: "${notes}"
    
    Output STRICTLY as a JSON object with the exact following structure, and nothing else:
    {
      "summary": "A rich, 3-sentence executive summary of the overall meeting.",
      "decisions": ["Decision 1", "Decision 2"],
      "action_items": [
        { "task": "Task description", "assignee": "Name or Unassigned", "deadline": "Date/ASAP" }
      ],
      "open_questions": ["Any unresolved topics or questions"]
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
                    { role: "system", content: "You are a highly capable AI assistant that outputs valid JSON only. Do not wrap the response in markdown blocks." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.5,
                response_format: { type: "json_object" }
            })
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({ 
                error: data.error?.message || "Groq API Error" 
            });
        }

        const content = data.choices[0].message.content;
        
        let jsonString = content.trim();
        if (jsonString.startsWith("```json")) {
            jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonString.startsWith("```")) {
            jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsedContent = JSON.parse(jsonString);
        return res.status(200).json(parsedContent);

    } catch (error) {
        return res.status(500).json({ error: "Failed to generate meeting minutes. Please try again." });
    }
}
