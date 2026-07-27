export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'pre-workout' | 'post-workout' | 'dinner';

export const MEAL_ORDER: MealType[] = [
  'breakfast', 'lunch', 'snack', 'pre-workout', 'post-workout', 'dinner',
];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  'pre-workout': 'Pre-Workout',
  'post-workout': 'Post-Workout',
  dinner: 'Dinner',
};

export const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  snack: '🍎',
  'pre-workout': '💪',
  'post-workout': '🏋️',
  dinner: '🌙',
};

export function defaultMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 12) return 'snack';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  if (h < 21) return 'dinner';
  return 'snack';
}

export interface FoodLogItem {
  id: string;
  name: string;
  servingSize: number;
  nutrition: NutritionInfo;
  addedAt: number;
  meal: MealType;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PendingFood {
  name: string;
  imagePreview?: string;
  baseServingSize: number;
  servingSize: number;
  nutritionPer100g: NutritionInfo;
  meal: MealType;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  goal: 'lose' | 'maintain' | 'gain';
  colorIndex: number;
}

export const PROFILE_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#f43f5e', '#14b8a6',
];
