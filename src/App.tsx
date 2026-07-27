import { useState, useCallback } from 'react';
import { NutritionSummary } from './components/NutritionSummary';
import { ImageUpload } from './components/ImageUpload';
import { FoodSearch } from './components/FoodSearch';
import { FoodLog } from './components/FoodLog';
import { GoalsModal } from './components/GoalsModal';
import { Toast } from './components/Toast';
import { Onboarding } from './components/Onboarding';
import { AISuggestions } from './components/AISuggestions';
import { ProfileSwitcher } from './components/ProfileSwitcher';
import { ProfileEdit } from './components/ProfileEdit';
import { HistoryView } from './components/HistoryView';
import { useFoodLog } from './hooks/useFoodLog';
import { useProfiles } from './hooks/useProfiles';
import type { DailyGoals, PendingFood, UserProfile } from './types';
import { PROFILE_COLORS } from './types';

type Tab = 'photo' | 'search';
type MainView = 'today' | 'history';
type ToastState = { message: string; type: 'success' | 'error' } | null;

function loadManualGoals(profileId: string): DailyGoals | null {
  try {
    const raw = localStorage.getItem(`nt-goals-${profileId}`);
    return raw ? (JSON.parse(raw) as DailyGoals) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const { profiles, activeProfile, goals: profileGoals, saveProfile, addProfile, removeProfile, switchProfile } =
    useProfiles();

  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [manualGoals, setManualGoals] = useState<DailyGoals | null>(
    () => (activeProfile ? loadManualGoals(activeProfile.id) : null),
  );
  const [activeTab, setActiveTab] = useState<Tab>('photo');
  const [mainView, setMainView] = useState<MainView>('today');
  const [toast, setToast] = useState<ToastState>(null);

  const profileId = activeProfile?.id ?? '__none__';
  const { items, totals, addItem, removeItem, clearAll } = useFoodLog(profileId);

  const goals: DailyGoals = manualGoals ?? profileGoals ?? { calories: 2000, protein: 150, carbs: 250, fat: 65 };

  function saveGoals(g: DailyGoals) {
    if (!activeProfile) return;
    localStorage.setItem(`nt-goals-${activeProfile.id}`, JSON.stringify(g));
    setManualGoals(g);
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

  function handleOnboardingComplete(data: Omit<UserProfile, 'id' | 'colorIndex'>) {
    const newProfile = addProfile(data);
    switchProfile(newProfile.id);
    setManualGoals(null);
    setShowOnboarding(false);
    setShowProfileSwitcher(false);
  }

  function handleSelectProfile(profile: UserProfile) {
    switchProfile(profile.id);
    setManualGoals(loadManualGoals(profile.id));
    setShowProfileSwitcher(false);
    setMainView('today');
  }

  function handleDeleteProfile() {
    if (!activeProfile) return;
    removeProfile(activeProfile.id);
    setShowProfileEdit(false);
    setShowProfileSwitcher(true);
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  const color = activeProfile
    ? PROFILE_COLORS[activeProfile.colorIndex % PROFILE_COLORS.length]
    : '#10b981';

  // No profile selected → show switcher (or onboarding if adding new)
  if (!activeProfile || showProfileSwitcher) {
    if (showOnboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
    }
    return (
      <ProfileSwitcher
        profiles={profiles}
        onSelect={handleSelectProfile}
        onAddNew={() => setShowOnboarding(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {showGoalsModal && (
        <GoalsModal goals={goals} onSave={saveGoals} onClose={() => setShowGoalsModal(false)} />
      )}

      {showProfileEdit && (
        <ProfileEdit
          profile={activeProfile}
          onSave={(p) => { saveProfile(p); setShowProfileEdit(false); }}
          onDelete={handleDeleteProfile}
          onSwitchProfile={() => { setShowProfileEdit(false); setShowProfileSwitcher(true); }}
          onClose={() => setShowProfileEdit(false)}
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
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400 sm:hidden">{today}</p>
            <button
              onClick={() => setShowProfileEdit(true)}
              title="My Profile"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: color }}
            >
              {activeProfile.name?.[0]?.toUpperCase() ?? '?'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4 pb-24">
        {mainView === 'today' ? (
          <>
            <NutritionSummary totals={totals} goals={goals} onEditGoals={() => setShowGoalsModal(true)} />

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
                  <ImageUpload onAdd={handleAdd} onError={(msg) => showToast(msg, 'error')} />
                ) : (
                  <FoodSearch onAdd={handleAdd} onError={(msg) => showToast(msg, 'error')} />
                )}
              </div>
            </div>

            {items.length > 0 && totals.calories < goals.calories && (
              <AISuggestions
                totals={totals}
                goals={goals}
                goal={activeProfile.goal}
                loggedItems={items}
                onAdd={handleAdd}
                onError={(msg) => showToast(msg, 'error')}
              />
            )}

            <FoodLog items={items} onRemove={removeItem} onClear={clearAll} />
          </>
        ) : (
          <HistoryView profileId={activeProfile.id} goals={goals} />
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 z-10">
        <div className="max-w-xl mx-auto flex">
          {([
            { view: 'today' as const, label: 'Today', icon: '🍽️' },
            { view: 'history' as const, label: 'History', icon: '📅' },
          ]).map(({ view, label, icon }) => (
            <button
              key={view}
              onClick={() => setMainView(view)}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${
                mainView === view ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span className="text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
