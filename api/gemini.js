export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version, x-goog-api-key'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/interactions';

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                model: 'gemini-3.6-flash',
                input: prompt,
                generation_config: {
                    thinking_level: 'low'
                }
            })
        });

        const data = await apiResponse.json();

        if (data.error) {
            console.error('Google API Error:', data.error);
            return res.status(500).json({ error: 'Google API Error', details: data.error.message || data.error });
        }

        // 🌟 FINAL FIX: Naye JSON structure se sirf caption nikalne ka tareeqa
        let reply = "";
        
        if (data.steps && data.steps.length > 0) {
            // Find that specific step which contains the text
            const outputStep = data.steps.find(step => step.type === 'model_output');
            if (outputStep && outputStep.content && outputStep.content.length > 0) {
                reply = outputStep.content[0].text;
            }
        } else if (data.candidates && data.candidates[0].content) {
            reply = data.candidates[0].content.parts[0].text; 
        }

        // Agar phir bhi empty ho to fallback
        if (!reply) {
            reply = "Caption generate ho gaya hai lekin text extract nahi ho saka. " + JSON.stringify(data);
        }

        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
            }
