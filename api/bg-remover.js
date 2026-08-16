// =================================================================
// VVIP TOOLVERSE SERVERSIDE AI (HuggingFace Engine)
// =================================================================

export const config = {
    api: { bodyParser: { sizeLimit: '20mb' } } 
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { imageBase64 } = req.body;
        // Vercel سے آپ کی چھپی ہوئی API Key نکال رہے ہیں
        const API_KEY = process.env.HUGGINGFACE_API_KEY; 

        if (!API_KEY) {
            throw new Error("Server API Key missing in Vercel.");
        }

        // 1. تصویر کو بائنری میں تبدیل کریں
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        // 2. HuggingFace کو بھیجیں (Bria AI Model - Best in the world)
        const response = await fetch("https://api-inference.huggingface.co/models/briaai/RMBG-1.4", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: buffer
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Model is loading, try again in 10 seconds.");
        }

        // 3. رزلٹ واپس بھیجیں
        const imageBuffer = await response.arrayBuffer();
        const base64Result = Buffer.from(imageBuffer).toString('base64');

        return res.status(200).json({ 
            success: true, 
            result: `data:image/png;base64,${base64Result}` 
        });

    } catch (error) {
        return res.status(200).json({ success: false, error: error.message });
    }
}
