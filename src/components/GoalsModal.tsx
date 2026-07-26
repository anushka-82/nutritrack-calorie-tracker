import { useState } from 'react';
import type { DailyGoals } from '../types';

interface Props {
  goals: DailyGoals;
  onSave: (goals: DailyGoals) => void;
  onClose: () => void;
}

export function GoalsModal({ goals, onSave, onClose }: Props) {
  const [values, setValues] = useState({ ...goals });

  function set(key: keyof DailyGoals, val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) setValues((v) => ({ ...v, [key]: n }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Daily Goals</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>

        {(
          [
            { key: 'calories', label: 'Calories', unit: 'kcal', color: 'text-emerald-600' },
            { key: 'protein', label: 'Protein', unit: 'g', color: 'text-blue-600' },
            { key: 'carbs', label: 'Carbs', unit: 'g', color: 'text-amber-600' },
            { key: 'fat', label: 'Fat', unit: 'g', color: 'text-purple-600' },
          ] as const
        ).map(({ key, label, unit, color }) => (
          <div key={key}>
            <label className={`block text-sm font-semibold mb-1.5 ${color}`}>
              {label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
                min="1"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-sm text-gray-400 w-8">{unit}</span>
            </div>
          </div>
        ))}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(values);
              onClose();
            }}
            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
          >
            Save Goals
          </button>
        </div>
      </div>
    </div>
  );
}
