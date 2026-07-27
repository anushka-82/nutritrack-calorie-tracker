import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const VISION_MODEL = 'qwen/qwen3.6-27b';

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

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server' });
  }

  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'imageBase64 and mimeType are required' });
  }

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 512,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              {
                type: 'text',
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
      }),
    });

    if (!groqRes.ok) {
      const err = (await groqRes.json().catch(() => ({}))) as { error?: { message?: string } };
      return res.status(502).json({ error: err.error?.message ?? `Groq error ${groqRes.status}` });
    }

    const data = (await groqRes.json()) as { choices: Array<{ message: { content: string } }> };
    const text = data.choices[0].message.content;
    return res.json(parseJSON(text, false));
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Analysis failed' });
  }
}
