import { useState } from 'react';
import { suggestFoods, type FoodSuggestion } from '../services/aiApi';
import type { NutritionInfo, DailyGoals, PendingFood, FoodLogItem, MealType } from '../types';
import { MEAL_ORDER, MEAL_LABELS, MEAL_EMOJIS } from '../types';

interface Props {
  totals: NutritionInfo;
  goals: DailyGoals;
  goal: string;
  loggedItems: FoodLogItem[];
  onAdd: (food: PendingFood) => void;
  onError: (msg: string) => void;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function getRemainingMeals(loggedItems: FoodLogItem[]): MealType[] {
  const loggedMeals = new Set(loggedItems.map((i) => i.meal));
  const h = new Date().getHours();

  return MEAL_ORDER.filter((m) => {
    if (loggedMeals.has(m)) return false;
    switch (m) {
      case 'breakfast': return h < 11;
      case 'lunch': return h < 15;
      case 'snack': return h < 21;
      case 'pre-workout': return h < 19;
      case 'post-workout': return h < 21;
      case 'dinner': return h < 22;
      default: return true;
    }
  });
}

export function AISuggestions({ totals, goals, goal, loggedItems, onAdd, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [shown, setShown] = useState(false);

  const remaining = {
    calories: Math.max(0, goals.calories - totals.calories),
    protein: round1(Math.max(0, goals.protein - totals.protein)),
    carbs: round1(Math.max(0, goals.carbs - totals.carbs)),
    fat: round1(Math.max(0, goals.fat - totals.fat)),
  };

  const remainingMeals = getRemainingMeals(loggedItems);

  async function fetchSuggestions() {
    setLoading(true);
    setShown(true);
    setSuggestions([]);
    try {
      const meals = remainingMeals.length > 0 ? remainingMeals : ['snack', 'dinner'];
      const data = await suggestFoods({
        remainingCalories: remaining.calories,
        remainingProtein: remaining.protein,
        remainingCarbs: remaining.carbs,
        remainingFat: remaining.fat,
        goal,
        remainingMeals: meals,
      });
      setSuggestions(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not load suggestions');
    } finally {
      setLoading(false);
    }
  }

  function addSuggestion(s: FoodSuggestion) {
    const meal = (MEAL_ORDER.includes(s.meal as MealType) ? s.meal : remainingMeals[0] ?? 'snack') as MealType;
    onAdd({
      name: s.name,
      baseServingSize: s.servingSize,
      servingSize: s.servingSize,
      nutritionPer100g: s.nutritionPer100g,
      meal,
    });
  }

  // Group suggestions by meal
  const grouped = suggestions.reduce<Record<string, FoodSuggestion[]>>((acc, s) => {
    const m = s.meal ?? 'snack';
    (acc[m] ??= []).push(s);
    return acc;
  }, {});

  const mealGroups = Object.entries(grouped).sort(
    ([a], [b]) => MEAL_ORDER.indexOf(a as MealType) - MEAL_ORDER.indexOf(b as MealType),
  );

  if (!shown) {
    const mealList = remainingMeals.length > 0
      ? remainingMeals.map((m) => MEAL_LABELS[m]).join(', ')
      : 'remaining meals';
    return (
      <button
        onClick={fetchSuggestions}
        className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <span>✨</span>
        What to eat for {mealList}? ({remaining.calories} kcal left)
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>✨</span>
          <h2 className="text-sm font-semibold text-gray-700">AI Suggestions</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{remaining.calories} kcal left</span>
          <button
            onClick={fetchSuggestions}
            className="text-xs text-emerald-500 hover:text-emerald-700 font-medium disabled:opacity-40"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Remaining macros */}
      <div className="px-4 py-2.5 bg-gray-50 border-b grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-blue-500 font-semibold">Protein left</div>
          <div className="text-sm font-bold text-gray-700">{remaining.protein}g</div>
        </div>
        <div>
          <div className="text-xs text-amber-500 font-semibold">Carbs left</div>
          <div className="text-sm font-bold text-gray-700">{remaining.carbs}g</div>
        </div>
        <div>
          <div className="text-xs text-purple-500 font-semibold">Fat left</div>
          <div className="text-sm font-bold text-gray-700">{remaining.fat}g</div>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-emerald-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Planning meals for the rest of your day…
        </div>
      )}

      {!loading && mealGroups.length > 0 && (
        <div>
          {mealGroups.map(([meal, items]) => (
            <div key={meal}>
              {/* Meal header */}
              <div className="px-4 py-2 bg-gray-50 border-y border-gray-100 flex items-center gap-2">
                <span>{MEAL_EMOJIS[meal as MealType] ?? '🍽️'}</span>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {MEAL_LABELS[meal as MealType] ?? meal}
                </span>
              </div>
              <div className="divide-y">
                {items.map((s, i) => {
                  const cal = Math.round((s.nutritionPer100g.calories * s.servingSize) / 100);
                  const p = round1((s.nutritionPer100g.protein * s.servingSize) / 100);
                  const c = round1((s.nutritionPer100g.carbs * s.servingSize) / 100);
                  const f = round1((s.nutritionPer100g.fat * s.servingSize) / 100);
                  return (
                    <div key={i} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{s.reason}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {s.servingSize}g ·{' '}
                            <span className="text-blue-500">P:{p}g</span> ·{' '}
                            <span className="text-amber-500">C:{c}g</span> ·{' '}
                            <span className="text-purple-500">F:{f}g</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="font-bold text-gray-700 text-sm">{cal} kcal</span>
                          <button
                            onClick={() => addSuggestion(s)}
                            className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
