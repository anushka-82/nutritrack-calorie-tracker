import { useState, useCallback } from 'react';
import { NutritionSummary } from './components/NutritionSummary';
import { ImageUpload } from './components/ImageUpload';
import { FoodSearch } from './components/FoodSearch';
import { FoodLog } from './components/FoodLog';
import { GoalsModal } from './components/GoalsModal';
import { Toast } from './components/Toast';
import { Onboarding } from './components/Onboarding';
import { AISuggestions } from './components/AISuggestions';
import { useFoodLog } from './hooks/useFoodLog';
import { useUserProfile } from './hooks/useUserProfile';
import { calcGoals } from './hooks/useUserProfile';
import type { DailyGoals, PendingFood, UserProfile } from './types';

function loadGoals(): DailyGoals | null {
  try {
    const raw = localStorage.getItem('nt-goals');
    return raw ? (JSON.parse(raw) as DailyGoals) : null;
  } catch {
    return null;
  }
}

type Tab = 'photo' | 'search';
type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function App() {
  const { profile, saveProfile, goals: profileGoals } = useUserProfile();
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [manualGoals, setManualGoals] = useState<DailyGoals | null>(loadGoals);
  const [activeTab, setActiveTab] = useState<Tab>('photo');
  const [toast, setToast] = useState<ToastState>(null);

  const { items, totals, addItem, removeItem, clearAll } = useFoodLog();

  // Goals: manual override > profile-derived > defaults
  const goals: DailyGoals = manualGoals ?? profileGoals ?? { calories: 2000, protein: 150, carbs: 250, fat: 65 };

  function saveGoals(g: DailyGoals) {
    localStorage.setItem('nt-goals', JSON.stringify(g));
    setManualGoals(g);
  }

  function handleOnboardingComplete(p: UserProfile) {
    saveProfile(p);
    // Set goals from profile unless already manually overridden
    if (!manualGoals) {
      // Goals will be derived from profile automatically
    }
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
      meal: food.meal,
    });
    showToast(`${food.name} added to ${food.meal}!`, 'success');
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Show onboarding for new users
  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

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
              <p className="text-xs text-gray-400 mt-0.5">
                {profile.name ? `Hi, ${profile.name}!` : today}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400 hidden sm:block">{today}</p>
            <button
              onClick={() => saveProfile({ ...profile })}
              title="Profile"
              className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold hover:bg-emerald-200 transition-colors"
            >
              {profile.name?.[0]?.toUpperCase() ?? '?'}
            </button>
          </div>
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

        {/* AI Suggestions — show when something has been logged */}
        {items.length > 0 && totals.calories < goals.calories && (
          <AISuggestions
            totals={totals}
            goals={goals}
            goal={profile.goal}
            loggedItems={items}
            onAdd={handleAdd}
            onError={(msg) => showToast(msg, 'error')}
          />
        )}

        {/* Log */}
        <FoodLog items={items} onRemove={removeItem} onClear={clearAll} />
      </main>
    </div>
  );
}
