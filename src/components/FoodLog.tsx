import type { FoodLogItem } from '../types';

interface Props {
  items: FoodLogItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function FoodLog({ items, onRemove, onClear }: Props) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <div className="text-4xl mb-3">🍽️</div>
        <p className="text-gray-500 font-medium">No foods logged yet</p>
        <p className="text-gray-400 text-sm mt-1">Add your first meal above!</p>
      </div>
    );
  }

  const totalCal = items.reduce((s, i) => s + i.nutrition.calories, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Today's Log
        </h2>
        <button
          onClick={() => {
            if (confirm("Clear all foods from today's log?")) onClear();
          }}
          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="divide-y">
        {items.map((item) => {
          const time = new Date(item.addedAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <div
              key={item.id}
              className="px-4 py-3 flex items-start justify-between hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                  <span className="text-xs text-gray-300">{time}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {item.servingSize}g ·{' '}
                  <span className="text-blue-500">P:{item.nutrition.protein}g</span> ·{' '}
                  <span className="text-amber-500">C:{item.nutrition.carbs}g</span> ·{' '}
                  <span className="text-purple-500">F:{item.nutrition.fat}g</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-gray-700 text-sm">
                  {item.nutrition.calories} kcal
                </span>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-gray-200 hover:text-red-400 transition-colors text-lg leading-none font-light group-hover:text-gray-300"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
        <span className="font-bold text-gray-800 text-sm">
          {totalCal.toLocaleString()} kcal total
        </span>
      </div>
    </div>
  );
}
