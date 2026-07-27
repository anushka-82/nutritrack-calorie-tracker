import { useState } from 'react';
import { searchFood, type FoodSearchResult } from '../services/aiApi';
import type { PendingFood } from '../types';
import { defaultMeal } from '../types';
import { FoodResult } from './FoodResult';

const SUGGESTIONS = [
  'Butter Chicken', 'Dal Makhani', 'Chicken Biryani', 'Roti / Chapati',
  'Paneer Tikka', 'Samosa', 'Masala Dosa', 'Chole Bhature',
  'Palak Paneer', 'Aloo Paratha', 'Idli Sambar', 'Rajma Chawal',
  'Grilled Chicken', 'Brown Rice', 'Boiled Egg', 'Oatmeal',
  'Banana', 'Greek Yogurt',
];

function calcCalories(r: FoodSearchResult) {
  return Math.round((r.nutritionPer100g.calories * r.servingSize) / 100);
}

interface Props {
  onAdd: (food: PendingFood) => void;
  onError: (msg: string) => void;
}

export function FoodSearch({ onAdd, onError }: Props) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [selected, setSelected] = useState<PendingFood | null>(null);
  const [searched, setSearched] = useState(false);

  async function doSearch(term: string) {
    if (!term.trim()) return;

    setQuery(term);
    setSearching(true);
    setResults([]);
    setSelected(null);
    setSearched(true);

    try {
      const data = await searchFood(term);
      setResults(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Search failed. Try again.');
    } finally {
      setSearching(false);
    }
  }

  function selectResult(r: FoodSearchResult) {
    setSelected({
      name: r.name,
      baseServingSize: r.servingSize,
      servingSize: r.servingSize,
      nutritionPer100g: r.nutritionPer100g,
      meal: defaultMeal(),
    });
  }

  function handleAdd(food: PendingFood) {
    onAdd(food);
    setQuery('');
    setResults([]);
    setSelected(null);
    setSearched(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch(query)}
          placeholder="e.g. Butter Chicken, Dosa, Grilled Salmon…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
        />
        <button
          onClick={() => doSearch(query)}
          disabled={searching || !query.trim()}
          className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors shrink-0"
        >
          {searching ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            'Search'
          )}
        </button>
      </div>

      {!searched && (
        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium">Popular dishes</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => doSearch(s)}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition-colors font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {searching && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Looking up nutrition info for{' '}
          <span className="font-medium text-gray-600">"{query}"</span>…
        </div>
      )}

      {!searching && results.length > 0 && !selected && (
        <div className="space-y-2 animate-slide-up">
          <p className="text-xs text-gray-400 font-medium">
            {results.length} result{results.length !== 1 ? 's' : ''} — tap to select
          </p>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => selectResult(r)}
              className="w-full text-left p-3.5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
            >
              <div className="font-semibold text-gray-800 text-sm">{r.name}</div>
              <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-3">
                <span>{r.servingSize}g serving</span>
                <span className="text-gray-700 font-medium">{calcCalories(r)} kcal</span>
                <span className="text-blue-500">
                  P:{Math.round((r.nutritionPer100g.protein * r.servingSize) / 100)}g
                </span>
                <span className="text-amber-500">
                  C:{Math.round((r.nutritionPer100g.carbs * r.servingSize) / 100)}g
                </span>
                <span className="text-purple-500">
                  F:{Math.round((r.nutritionPer100g.fat * r.servingSize) / 100)}g
                </span>
              </div>
            </button>
          ))}
          <button
            onClick={() => { setResults([]); setSearched(false); setQuery(''); }}
            className="text-xs text-gray-400 hover:text-gray-600 mt-1"
          >
            ← Search again
          </button>
        </div>
      )}

      {!searching && searched && results.length === 0 && !selected && (
        <div className="text-center py-6 text-sm text-gray-400">
          No results found. Try a different search term.
        </div>
      )}

      {selected && (
        <FoodResult
          food={selected}
          onChange={setSelected}
          onAdd={handleAdd}
          onBack={() => setSelected(null)}
        />
      )}
    </div>
  );
}
