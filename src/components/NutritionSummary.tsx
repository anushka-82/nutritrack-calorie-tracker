import type { DailyGoals, NutritionInfo } from '../types';

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
}

function MacroBar({ label, value, goal, color, unit = 'g' }: MacroBarProps) {
  const pct = Math.min((value / goal) * 100, 100);
  const over = value > goal;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={over ? 'text-orange-500 font-semibold' : 'text-gray-400'}>
          {value}{unit}
          <span className="text-gray-300"> / </span>
          {goal}{unit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-orange-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  totals: NutritionInfo;
  goals: DailyGoals;
  onEditGoals: () => void;
}

export function NutritionSummary({ totals, goals, onEditGoals }: Props) {
  const calPct = Math.min((totals.calories / goals.calories) * 100, 100);
  const remaining = goals.calories - totals.calories;

  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - calPct / 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Today's Summary
        </h2>
        <button
          onClick={onEditGoals}
          className="text-xs text-gray-400 hover:text-emerald-600 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50"
        >
          Edit goals
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Calorie ring */}
        <div className="relative w-36 h-36 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#F3F4F6" strokeWidth="11" />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={totals.calories > goals.calories ? '#FB923C' : '#10B981'}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-800 leading-none">
              {totals.calories.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">/ {goals.calories.toLocaleString()}</span>
            <span className="text-xs text-gray-500 mt-1 font-medium">kcal</span>
          </div>
        </div>

        {/* Remaining label + macro bars */}
        <div className="flex-1 w-full space-y-4">
          <p className="text-sm text-center sm:text-left">
            {remaining > 0 ? (
              <>
                <span className="font-semibold text-emerald-600">
                  {remaining.toLocaleString()} kcal
                </span>{' '}
                <span className="text-gray-400">remaining</span>
              </>
            ) : (
              <span className="font-semibold text-orange-500">
                {Math.abs(remaining).toLocaleString()} kcal over goal
              </span>
            )}
          </p>

          <div className="space-y-3">
            <MacroBar
              label="Protein"
              value={totals.protein}
              goal={goals.protein}
              color="bg-blue-500"
            />
            <MacroBar
              label="Carbs"
              value={totals.carbs}
              goal={goals.carbs}
              color="bg-amber-500"
            />
            <MacroBar
              label="Fat"
              value={totals.fat}
              goal={goals.fat}
              color="bg-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
