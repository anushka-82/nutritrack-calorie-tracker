import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL = 'llama-3.3-70b-versatile';
const OFF_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

interface FoodResult {
  name: string;
  servingSize: number;
  source: 'database' | 'ai';
  nutritionPer100g: { calories: number; protein: number; carbs: number; fat: number };
}

// Search Open Food Facts — free, no API key, verified nutritional data
async function searchOpenFoodFacts(query: string): Promise<FoodResult[]> {
  const params = new URLSearchParams({
    action: 'process',
    search_terms: query,
    json: '1',
    page_size: '10',
    fields: 'product_name,nutriments,serving_quantity,serving_size',
  });

  const res = await fetch(`${OFF_URL}?${params}`, {
    headers: { 'User-Agent': 'NutriTrack/1.0 (calorie tracker app)' },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { products?: Record<string, unknown>[] };
  const products = data.products ?? [];

  const results: FoodResult[] = [];
  for (const p of products) {
    const n = p.nutriments as Record<string, unknown> | undefined;
    const name = (p.product_name as string | undefined)?.trim();

    if (
      !name ||
      !n ||
      typeof n['energy-kcal_100g'] !== 'number' ||
      typeof n['proteins_100g'] !== 'number' ||
      typeof n['carbohydrates_100g'] !== 'number' ||
      typeof n['fat_100g'] !== 'number'
    ) continue;

    const cal = Math.round(n['energy-kcal_100g'] as number);
    if (cal <= 0 || cal > 900) continue; // skip clearly wrong values

    const servingQty = parseFloat(p.serving_quantity as string);
    const servingSize = isNaN(servingQty) || servingQty <= 0 ? 100 : Math.round(servingQty);

    results.push({
      name,
      servingSize,
      source: 'database',
      nutritionPer100g: {
        calories: cal,
        protein: Math.round((n['proteins_100g'] as number) * 10) / 10,
        carbs: Math.round((n['carbohydrates_100g'] as number) * 10) / 10,
        fat: Math.round((n['fat_100g'] as number) * 10) / 10,
      },
    });

    if (results.length === 3) break;
  }

  return results;
}

// Groq AI fallback — handles Indian dishes and anything not in Open Food Facts
async function searchWithGroq(query: string, groqKey: string): Promise<FoodResult[]> {
  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`,
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
    throw new Error(err.error?.message ?? `Groq error ${groqRes.status}`);
  }

  const data = (await groqRes.json()) as { choices: Array<{ message: { content: string } }> };
  const text = data.choices[0].message.content;
  const cleaned = text.replace(/```json|```/g, '').trim();
  const m = cleaned.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('Could not parse nutrition data from AI response');

  const parsed = JSON.parse(m[0]) as Array<{
    name: string; servingSize: number;
    nutritionPer100g: { calories: number; protein: number; carbs: number; fat: number };
  }>;

  return parsed.map((item) => ({ ...item, source: 'ai' as const }));
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
    // Try Open Food Facts first
    const dbResults = await searchOpenFoodFacts(query.trim()).catch(() => []);

    if (dbResults.length > 0) {
      return res.json(dbResults);
    }

    // Nothing useful in the database — fall back to AI (good for Indian dishes)
    const aiResults = await searchWithGroq(query.trim(), GROQ_KEY);
    return res.json(aiResults);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Search failed' });
  }
}
