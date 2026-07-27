import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3001;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

app.use(express.json({ limit: '15mb' })); // images need headroom

// ── Gemini helpers ─────────────────────────────────────────────────────────

async function callGemini(parts: unknown[]): Promise<string> {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY is not set on the server');

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Gemini error ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0].content.parts[0].text;
}

function parseJSON<T>(text: string, isArray: boolean): T {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const m = cleaned.match(isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/);
  if (!m) throw new Error('Could not parse nutrition data from AI response');
  return JSON.parse(m[0]) as T;
}

// ── API routes ─────────────────────────────────────────────────────────────

app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body as {
      imageBase64?: string;
      mimeType?: string;
    };
    if (!imageBase64 || !mimeType) {
      res.status(400).json({ error: 'imageBase64 and mimeType are required' });
      return;
    }

    const text = await callGemini([
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
    ]);

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

    const text = await callGemini([
      {
        text: `Provide nutritional information for: "${query}"

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
    ]);

    res.json(parseJSON(text, true));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Search failed' });
  }
});

// ── Serve built frontend in production ─────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`✅  Server running at http://localhost:${PORT}`);
  if (!GEMINI_KEY) {
    console.warn('⚠️   GEMINI_API_KEY is not set — add it to your .env file');
  }
});
