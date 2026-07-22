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

        // 🌟 NAYA 2026 API URL
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/interactions';

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey // Key ab header mein jayegi (jese aapne curl mein dikhaya)
            },
            body: JSON.stringify({
                // 🚨 UPDATE: Pro se Flash par shift kar diya gaya hai taake Quota Exceeded ka error na aaye
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

        // Naye API ka response structure pakarne ke liye smart logic
        let reply = "";
        
        if (data.output) {
            reply = data.output; // Agar response mein seedha output aata hai
        } else if (data.candidates && data.candidates[0].content) {
            reply = data.candidates[0].content.parts[0].text; // Purana structure
        } else {
            // Agar naya structure in dono se mukhtalif hua, to hum poora data screen par dikha denge
            // taake humein pata chal jaye ke text kahan chupa hai
            reply = JSON.stringify(data); 
        }

        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
