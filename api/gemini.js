export default async function handler(req, res) {
    // صرف POST ریکویسٹ کو اجازت دیں
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt } = req.body;
    
    // یہ وہ خفیہ چابی (Key) ہے جو ہم Vercel میں چھپائیں گے
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing in Vercel settings.' });
    }

    try {
        // گوگل جیمنی (Gemini) سے رابطہ
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // جیمنی کا جواب نکال کر واپس ویب سائٹ کو بھیجنا
        const aiText = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ result: aiText });

    } catch (error) {
        return res.status(500).json({ error: 'AI server is busy. Please try again.' });
    }
}

