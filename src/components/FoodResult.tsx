import type { PendingFood } from '../types';

interface Props {
  food: PendingFood;
  onChange: (food: PendingFood) => void;
  onAdd: (food: PendingFood) => void;
  onBack?: () => void;
}

function scale(base: number, serving: number): number {
  return Math.round((base * serving) / 100 * 10) / 10;
}

export function FoodResult({ food, onChange, onAdd, onBack }: Props) {
  const { nutritionPer100g: n, servingSize } = food;
  const calories = Math.round((n.calories * servingSize) / 100);
  const protein = scale(n.protein, servingSize);
  const carbs = scale(n.carbs, servingSize);
  const fat = scale(n.fat, servingSize);

  function adjustServing(delta: number) {
    onChange({ ...food, servingSize: Math.max(25, food.servingSize + delta) });
  }

  function setServing(val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) onChange({ ...food, servingSize: n });
  }

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-4 animate-slide-up">
      <div className="flex items-start justify-between gap-2">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1"
            >
              ← Back to results
            </button>
          )}
          <h3 className="font-semibold text-gray-800 text-sm leading-snug">{food.name}</h3>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-emerald-600">{calories}</span>
          <span className="text-xs text-gray-400 ml-1">kcal</span>
        </div>
      </div>

      {food.imagePreview && (
        <img
          src={food.imagePreview}
          alt={food.name}
          className="w-full h-32 object-cover rounded-lg"
        />
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white rounded-lg p-2">
          <div className="text-xs text-blue-600 font-semibold">Protein</div>
          <div className="text-sm font-bold text-gray-800">{protein}g</div>
        </div>
        <div className="bg-white rounded-lg p-2">
          <div className="text-xs text-amber-600 font-semibold">Carbs</div>
          <div className="text-sm font-bold text-gray-800">{carbs}g</div>
        </div>
        <div className="bg-white rounded-lg p-2">
          <div className="text-xs text-purple-600 font-semibold">Fat</div>
          <div className="text-sm font-bold text-gray-800">{fat}g</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 shrink-0">Serving:</span>
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => adjustServing(-25)}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg leading-none font-medium transition-colors"
          >
            −
          </button>
          <div className="flex items-center flex-1 min-w-0">
            <input
              type="number"
              value={food.servingSize}
              onChange={(e) => setServing(e.target.value)}
              min="1"
              className="w-full text-center border border-gray-200 rounded-lg py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <span className="ml-2 text-sm text-gray-400 shrink-0">g</span>
          </div>
          <button
            onClick={() => adjustServing(25)}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg leading-none font-medium transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={() => onAdd(food)}
        className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
      >
        Add to Today's Log
      </button>
    </div>
  );
}
