export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodLogItem {
  id: string;
  name: string;
  servingSize: number;
  nutrition: NutritionInfo;
  addedAt: number;
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
}
