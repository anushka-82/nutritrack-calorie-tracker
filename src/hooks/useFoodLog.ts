import { useState, useEffect, useCallback } from 'react';
import type { FoodLogItem, NutritionInfo } from '../types';

function dayKey(profileId: string, date: string) {
  return `nt-log-${profileId}-${date}`;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function load(profileId: string): FoodLogItem[] {
  try {
    const raw = localStorage.getItem(dayKey(profileId, todayDate()));
    return raw ? (JSON.parse(raw) as FoodLogItem[]) : [];
  } catch {
    return [];
  }
}

export function useFoodLog(profileId: string) {
  const [items, setItems] = useState<FoodLogItem[]>(() => load(profileId));

  // Reload when switching profiles
  useEffect(() => {
    setItems(load(profileId));
  }, [profileId]);

  useEffect(() => {
    localStorage.setItem(dayKey(profileId, todayDate()), JSON.stringify(items));
  }, [items, profileId]);

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

export function loadDayLog(profileId: string, date: string): FoodLogItem[] {
  try {
    const raw = localStorage.getItem(dayKey(profileId, date));
    return raw ? (JSON.parse(raw) as FoodLogItem[]) : [];
  } catch {
    return [];
  }
}

export function getLoggedDates(profileId: string): Set<string> {
  const dates = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const prefix = `nt-log-${profileId}-`;
    if (key.startsWith(prefix)) {
      const date = key.slice(prefix.length);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const items = loadDayLog(profileId, date);
        if (items.length > 0) dates.add(date);
      }
    }
  }
  return dates;
}
