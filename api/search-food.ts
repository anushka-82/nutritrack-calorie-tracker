import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL = 'llama-3.3-70b-versatile';

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

  const { query } = req.body as { query?: string };
  if (!query?.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        max_tokens: 1024,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: `Provide nutritional information for: "${query}"

Return ONLY a valid JSON array with 1-3 options (different preparations or sizes):
[
  {
    "name": "specific dish name",
    "servingSize": typical_serving_in_grams,
    "nutritionPer100g": {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  }
]

Use authentic values for Indian dishes (homemade recipes). All values must be plain numbers. No markdown or extra text.`,
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
    return res.json(parseJSON(text, true));
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Search failed' });
  }
}
