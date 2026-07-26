const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

async function callClaude(
  messages: Array<{ role: string; content: unknown }>,
  apiKey: string,
  maxTokens = 1024,
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json() as { content: Array<{ text: string }> };
  return data.content[0].text;
}

function extractJSON<T>(text: string, isArray: boolean): T {
  const pattern = isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(pattern);
  if (!match) throw new Error('Could not parse nutrition data from response');
  return JSON.parse(match[0]) as T;
}

export interface ImageAnalysisResult {
  name: string;
  estimatedGrams: number;
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
): Promise<ImageAnalysisResult> {
  const text = await callClaude(
    [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `Identify the food in this image and provide nutritional data.

Return ONLY valid JSON, no extra text:
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

Use authentic values for Indian dishes. Estimate the portion weight from visual cues (plate/bowl size, coverage). All values must be plain numbers, no units.`,
          },
        ],
      },
    ],
    apiKey,
    512,
  );

  return extractJSON<ImageAnalysisResult>(text, false);
}

export interface FoodSearchResult {
  name: string;
  servingSize: number;
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export async function searchFood(
  query: string,
  apiKey: string,
): Promise<FoodSearchResult[]> {
  const text = await callClaude(
    [
      {
        role: 'user',
        content: `Provide nutritional information for: "${query}"

Return ONLY a valid JSON array with 1-3 options (e.g. different preparations or serving sizes).
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

Use authentic values for Indian dishes (homemade recipes). All values must be plain numbers. No extra text.`,
      },
    ],
    apiKey,
  );

  return extractJSON<FoodSearchResult[]>(text, true);
}
