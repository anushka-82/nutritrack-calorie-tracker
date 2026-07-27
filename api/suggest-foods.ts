import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL = 'llama-3.3-70b-versatile';

function parseJSON<T>(text: string): T {
  const stripped = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const cleaned = stripped.replace(/```json|```/g, '').trim();
  const m = cleaned.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('Could not parse suggestions from AI response');
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

  const { remainingCalories, remainingProtein, remainingCarbs, remainingFat, goal, nextMeal } =
    req.body as {
      remainingCalories?: number;
      remainingProtein?: number;
      remainingCarbs?: number;
      remainingFat?: number;
      goal?: string;
      nextMeal?: string;
    };

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
        temperature: 0.4,
        messages: [
          {
            role: 'user',
            content: `Suggest 4 foods for someone tracking their diet.

Remaining macros for today:
- Calories: ${remainingCalories} kcal
- Protein: ${remainingProtein}g
- Carbs: ${remainingCarbs}g
- Fat: ${remainingFat}g
- Goal: ${goal} (lose = weight loss, maintain = maintenance, gain = muscle gain)
- Next meal: ${nextMeal}

Return ONLY a valid JSON array of 4 suggestions. Include Indian dishes where appropriate:
[
  {
    "name": "food name",
    "reason": "one short sentence why this fits their remaining macros",
    "servingSize": typical_serving_in_grams,
    "nutritionPer100g": {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  }
]

No markdown, no extra text. All values must be plain numbers.`,
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
    return res.json(parseJSON(text));
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Suggestion failed' });
  }
}
