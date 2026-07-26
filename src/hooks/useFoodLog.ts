import { useState, useEffect, useCallback } from 'react';
import type { FoodLogItem, NutritionInfo } from '../types';

function todayKey() {
  return `nt-log-${new Date().toISOString().slice(0, 10)}`;
}

function load(): FoodLogItem[] {
  try {
    const raw = localStorage.getItem(todayKey());
    return raw ? (JSON.parse(raw) as FoodLogItem[]) : [];
  } catch {
    return [];
  }
}

export function useFoodLog() {
  const [items, setItems] = useState<FoodLogItem[]>(load);

  useEffect(() => {
    localStorage.setItem(todayKey(), JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: FoodLogItem) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearAll = useCallback(() => setItems([]), []);

  const totals: NutritionInfo = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.nutrition.calories,
      protein: Math.round((acc.protein + item.nutrition.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + item.nutrition.carbs) * 10) / 10,
      fat: Math.round((acc.fat + item.nutrition.fat) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return { items, totals, addItem, removeItem, clearAll };
}
