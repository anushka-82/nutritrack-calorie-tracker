import { useState } from 'react';
import { suggestFoods, type FoodSuggestion } from '../services/aiApi';
import type { NutritionInfo, DailyGoals, PendingFood } from '../types';
import { defaultMeal } from '../types';

interface Props {
  totals: NutritionInfo;
  goals: DailyGoals;
  goal: string;
  onAdd: (food: PendingFood) => void;
  onError: (msg: string) => void;
}

export function AISuggestions({ totals, goals, goal, onAdd, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [shown, setShown] = useState(false);

  const remaining = {
    calories: Math.max(0, goals.calories - totals.calories),
    protein: Math.max(0, goals.protein - totals.protein),
    carbs: Math.max(0, goals.carbs - totals.carbs),
    fat: Math.max(0, goals.fat - totals.fat),
  };

  async function fetchSuggestions() {
    setLoading(true);
    setShown(true);
    try {
      const data = await suggestFoods({
        remainingCalories: remaining.calories,
        remainingProtein: remaining.protein,
        remainingCarbs: remaining.carbs,
        remainingFat: remaining.fat,
        goal,
        nextMeal: defaultMeal(),
      });
      setSuggestions(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not load suggestions');
    } finally {
      setLoading(false);
    }
  }

  function addSuggestion(s: FoodSuggestion) {
    onAdd({
      name: s.name,
      baseServingSize: s.servingSize,
      servingSize: s.servingSize,
      nutritionPer100g: s.nutritionPer100g,
      meal: defaultMeal(),
    });
  }

  if (!shown) {
    return (
      <button
        onClick={fetchSuggestions}
        className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <span>✨</span>
        What should I eat next? ({remaining.calories} kcal remaining)
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
            onClick={() => { setSuggestions([]); fetchSuggestions(); }}
            className="text-xs text-emerald-500 hover:text-emerald-700 font-medium"
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
          Finding the best foods for your remaining macros…
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="divide-y">
          {suggestions.map((s, i) => {
            const cal = Math.round((s.nutritionPer100g.calories * s.servingSize) / 100);
            const p = Math.round((s.nutritionPer100g.protein * s.servingSize) / 100 * 10) / 10;
            const c = Math.round((s.nutritionPer100g.carbs * s.servingSize) / 100 * 10) / 10;
            const f = Math.round((s.nutritionPer100g.fat * s.servingSize) / 100 * 10) / 10;
            return (
              <div key={i} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
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
      )}
    </div>
  );
}
