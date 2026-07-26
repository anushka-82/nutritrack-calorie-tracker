import { useState, useCallback } from 'react';
import { NutritionSummary } from './components/NutritionSummary';
import { ImageUpload } from './components/ImageUpload';
import { FoodSearch } from './components/FoodSearch';
import { FoodLog } from './components/FoodLog';
import { GoalsModal } from './components/GoalsModal';
import { Toast } from './components/Toast';
import { useFoodLog } from './hooks/useFoodLog';
import type { DailyGoals, PendingFood } from './types';

const DEFAULT_GOALS: DailyGoals = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

function loadGoals(): DailyGoals {
  try {
    const raw = localStorage.getItem('nt-goals');
    return raw ? (JSON.parse(raw) as DailyGoals) : DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
}

type Tab = 'photo' | 'search';
type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function App() {
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goals, setGoals] = useState<DailyGoals>(loadGoals);
  const [activeTab, setActiveTab] = useState<Tab>('photo');
  const [toast, setToast] = useState<ToastState>(null);

  const { items, totals, addItem, removeItem, clearAll } = useFoodLog();

  function saveGoals(g: DailyGoals) {
    localStorage.setItem('nt-goals', JSON.stringify(g));
    setGoals(g);
  }

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  function handleAdd(food: PendingFood) {
    const s = food.servingSize;
    const n = food.nutritionPer100g;
    addItem({
      id: crypto.randomUUID(),
      name: food.name,
      servingSize: s,
      nutrition: {
        calories: Math.round((n.calories * s) / 100),
        protein: Math.round(((n.protein * s) / 100) * 10) / 10,
        carbs: Math.round(((n.carbs * s) / 100) * 10) / 10,
        fat: Math.round(((n.fat * s) / 100) * 10) / 10,
      },
      addedAt: Date.now(),
    });
    showToast(`${food.name} added!`, 'success');
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {showGoalsModal && (
        <GoalsModal
          goals={goals}
          onSave={saveGoals}
          onClose={() => setShowGoalsModal(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🥗</span>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-none">NutriTrack</h1>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{today}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 sm:hidden">{today}</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4 pb-12">
        {/* Summary */}
        <NutritionSummary
          totals={totals}
          goals={goals}
          onEditGoals={() => setShowGoalsModal(true)}
        />

        {/* Add food */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b">
            {(['photo', 'search'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === tab
                    ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/60'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'photo' ? '📷' : '🔍'}
                {tab === 'photo' ? 'Upload Photo' : 'Search Food'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'photo' ? (
              <ImageUpload
                onAdd={handleAdd}
                onError={(msg) => showToast(msg, 'error')}
              />
            ) : (
              <FoodSearch
                onAdd={handleAdd}
                onError={(msg) => showToast(msg, 'error')}
              />
            )}
          </div>
        </div>

        {/* Log */}
        <FoodLog items={items} onRemove={removeItem} onClear={clearAll} />
      </main>
    </div>
  );
}
