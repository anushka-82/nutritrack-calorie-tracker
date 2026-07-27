import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3001;
const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const VISION_MODEL = 'qwen/qwen3.6-27b';
const TEXT_MODEL = 'llama-3.3-70b-versatile';

app.use(express.json({ limit: '15mb' }));

async function callGroq(messages: unknown[], model: string, maxTokens = 1024, extraParams: Record<string, unknown> = {}): Promise<string> {
  if (!GROQ_KEY) throw new Error('GROQ_API_KEY is not set on the server');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0.1, messages, ...extraParams }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Groq error ${res.status}`);
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

function parseJSON<T>(text: string, isArray: boolean): T {
  const stripped = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const cleaned = stripped.replace(/```json|```/g, '').trim();
  const m = cleaned.match(isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/);
  if (!m) throw new Error('Could not parse nutrition data');
  return JSON.parse(m[0]) as T;
}

app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };
    if (!imageBase64 || !mimeType) {
      res.status(400).json({ error: 'imageBase64 and mimeType are required' });
      return;
    }

    const text = await callGroq([
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
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
    ], VISION_MODEL, 1024, { reasoning_effort: 'none' });

    res.json(parseJSON(text, false));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Analysis failed' });
  }
});

app.post('/api/search-food', async (req, res) => {
  try {
    const { query } = req.body as { query?: string };
    if (!query?.trim()) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const text = await callGroq([
      {
        role: 'user',
        content: `Provide nutritional information for: "${query}"

Return ONLY a valid JSON array with 1-3 options:
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
    ], TEXT_MODEL);

    res.json(parseJSON(text, true));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Search failed' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`✅  Server running at http://localhost:${PORT}`);
  if (!GROQ_KEY) console.warn('⚠️   GROQ_API_KEY is not set — add it to your .env file');
});
