import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function parseJSON<T>(text: string, isArray: boolean): T {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const m = cleaned.match(isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/);
  if (!m) throw new Error('Could not parse nutrition data from AI response');
  return JSON.parse(m[0]) as T;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
  }

  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'imageBase64 and mimeType are required' });
  }

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              {
                text: `Identify the food in this image and provide nutritional data.

Return ONLY valid JSON, no markdown or extra text:
{
  "name": "food name",
  "estimatedGrams": estimated_portion_weight_as_number,
  "nutritionPer100g": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}

Use authentic values for Indian dishes. Estimate portion weight from visual cues. All values must be plain numbers.`,
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
      }),
    });

    if (!geminiRes.ok) {
      const err = (await geminiRes.json().catch(() => ({}))) as { error?: { message?: string } };
      return res.status(502).json({ error: err.error?.message ?? `Gemini error ${geminiRes.status}` });
    }

    const data = (await geminiRes.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    const text = data.candidates[0].content.parts[0].text;
    return res.json(parseJSON(text, false));
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Analysis failed' });
  }
}
