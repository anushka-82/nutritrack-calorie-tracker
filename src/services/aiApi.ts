async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Server error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface ImageAnalysisItem {
  name: string;
  estimatedGrams: number;
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function analyzeImage(
  imageBase64: string,
  mimeType: string,
): Promise<ImageAnalysisItem[]> {
  return post('/api/analyze-image', { imageBase64, mimeType });
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

export function searchFood(query: string): Promise<FoodSearchResult[]> {
  return post('/api/search-food', { query });
}

export interface FoodSuggestion {
  name: string;
  reason: string;
  servingSize: number;
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function suggestFoods(params: {
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  goal: string;
  nextMeal: string;
}): Promise<FoodSuggestion[]> {
  return post('/api/suggest-foods', params);
}
