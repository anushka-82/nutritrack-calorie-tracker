import { useState, useMemo } from 'react';
import { loadDayLog, getLoggedDates } from '../hooks/useFoodLog';
import type { DailyGoals, FoodLogItem } from '../types';
import { MEAL_ORDER, MEAL_LABELS, MEAL_EMOJIS, type MealType } from '../types';

interface Props {
  profileId: string;
  goals: DailyGoals;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function HistoryView({ profileId, goals }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loggedDates = useMemo(() => getLoggedDates(profileId), [profileId]);

  const selectedItems: FoodLogItem[] = useMemo(
    () => (selectedDate ? loadDayLog(profileId, selectedDate) : []),
    [profileId, selectedDate],
  );

  const selectedTotals = useMemo(
    () =>
      selectedItems.reduce(
        (acc, item) => ({
          calories: acc.calories + item.nutrition.calories,
          protein: Math.round((acc.protein + item.nutrition.protein) * 10) / 10,
          carbs: Math.round((acc.carbs + item.nutrition.carbs) * 10) / 10,
          fat: Math.round((acc.fat + item.nutrition.fat) * 10) / 10,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [selectedItems],
  );

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    const now = new Date();
    if (viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Grouped by meal for selected day
  const grouped = MEAL_ORDER.reduce<Record<MealType, FoodLogItem[]>>(
    (acc, meal) => { acc[meal] = selectedItems.filter((i) => (i.meal ?? 'snack') === meal); return acc; },
    {} as Record<MealType, FoodLogItem[]>,
  );
  const mealsWithItems = MEAL_ORDER.filter((m) => grouped[m].length > 0);

  const isCanGoNext = !(viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth >= today.getMonth()));

  return (
    <div className="space-y-4">
      {/* Calendar card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            ‹
          </button>
          <h2 className="font-semibold text-gray-800 text-sm">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={nextMonth}
            disabled={!isCanGoNext}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-30 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const dateStr = formatDate(viewYear, viewMonth, day);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const hasLog = loggedDates.has(dateStr);
            const isSelected = selectedDate === dateStr;

            const dayItems = hasLog ? loadDayLog(profileId, dateStr) : [];
            const dayCal = dayItems.reduce((s, it) => s + it.nutrition.calories, 0);
            const pct = hasLog ? Math.min(1, dayCal / goals.calories) : 0;
            const dotColor = pct >= 0.9 ? 'bg-emerald-400' : pct >= 0.5 ? 'bg-amber-400' : 'bg-gray-300';

            return (
              <button
                key={dateStr}
                onClick={() => !isFuture && setSelectedDate(isSelected ? null : dateStr)}
                disabled={isFuture}
                className={`relative flex flex-col items-center py-1.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-white'
                    : isToday
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : isFuture
                        ? 'text-gray-200 cursor-default'
                        : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium">{day}</span>
                {hasLog && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white/70' : dotColor}`} />
                )}
                {!hasLog && <div className="w-1.5 h-1.5 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 pb-3 flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Goal reached
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            Partial
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-slide-up">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </h3>
            <button onClick={() => setSelectedDate(null)} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
          </div>

          {selectedItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No food logged this day</div>
          ) : (
            <>
              {/* Day totals */}
              <div className="px-4 py-3 bg-gray-50 border-b grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-xs text-emerald-600 font-semibold">Calories</div>
                  <div className="text-sm font-bold text-gray-800">{selectedTotals.calories}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-500 font-semibold">Protein</div>
                  <div className="text-sm font-bold text-gray-800">{selectedTotals.protein}g</div>
                </div>
                <div>
                  <div className="text-xs text-amber-500 font-semibold">Carbs</div>
                  <div className="text-sm font-bold text-gray-800">{selectedTotals.carbs}g</div>
                </div>
                <div>
                  <div className="text-xs text-purple-500 font-semibold">Fat</div>
                  <div className="text-sm font-bold text-gray-800">{selectedTotals.fat}g</div>
                </div>
              </div>

              {/* Items grouped by meal */}
              {mealsWithItems.map((meal) => (
                <div key={meal}>
                  <div className="px-4 py-2 bg-gray-50 border-y border-gray-100 flex items-center gap-2">
                    <span>{MEAL_EMOJIS[meal]}</span>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {MEAL_LABELS[meal]}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {grouped[meal].reduce((s, i) => s + i.nutrition.calories, 0)} kcal
                    </span>
                  </div>
                  <div className="divide-y">
                    {grouped[meal].map((item) => (
                      <div key={item.id} className="px-4 py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            {item.servingSize}g ·{' '}
                            <span className="text-blue-500">P:{item.nutrition.protein}g</span> ·{' '}
                            <span className="text-amber-500">C:{item.nutrition.carbs}g</span> ·{' '}
                            <span className="text-purple-500">F:{item.nutrition.fat}g</span>
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          {item.nutrition.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
