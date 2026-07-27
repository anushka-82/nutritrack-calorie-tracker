import { useState } from 'react';
import type { UserProfile, DailyGoals } from '../types';
import { calcGoals } from '../hooks/useUserProfile';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

type Step = 'identity' | 'body' | 'goal' | 'summary';

const STEP_ORDER: Step[] = ['identity', 'body', 'goal', 'summary'];

const GOALS = [
  { value: 'lose' as const, label: 'Lose Weight', emoji: '🔥', desc: 'Calorie deficit (-500 kcal/day)' },
  { value: 'maintain' as const, label: 'Maintain Weight', emoji: '⚖️', desc: 'Stay at current weight' },
  { value: 'gain' as const, label: 'Gain Muscle', emoji: '💪', desc: 'Calorie surplus (+300 kcal/day)' },
];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('identity');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

  const profile: UserProfile = {
    name: name.trim() || 'User',
    age: parseInt(age) || 25,
    sex,
    heightCm: parseFloat(height) || 170,
    weightKg: parseFloat(weight) || 70,
    goal,
  };

  const calculated: DailyGoals = calcGoals(profile);
  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🥗</div>
          <h1 className="text-2xl font-bold text-gray-800">NutriTrack</h1>
          <p className="text-gray-400 text-sm mt-1">Your AI-powered calorie tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Progress */}
          <div className="flex justify-center gap-2 mb-6">
            {STEP_ORDER.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIndex ? 'w-8 bg-emerald-500' : i < stepIndex ? 'w-4 bg-emerald-300' : 'w-4 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {step === 'identity' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Welcome! Let's get started</h2>
                <p className="text-sm text-gray-400">We'll personalize your calorie targets</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1.5 block font-medium">Your name</label>
                <input
                  type="text"
                  placeholder="e.g. Anushka"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  autoFocus
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2 font-medium">Biological sex</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['male', 'female'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        sex === s
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      {s === 'male' ? '♂ Male' : '♀ Female'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep('body')}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 'body' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Body measurements</h2>
                <p className="text-sm text-gray-400">Used to calculate your calorie needs</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1.5 block font-medium">Age (years)</label>
                <input
                  type="number"
                  placeholder="e.g. 24"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="10" max="100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1.5 block font-medium">Height (cm)</label>
                <input
                  type="number"
                  placeholder="e.g. 165"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min="100" max="250"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1.5 block font-medium">Weight (kg)</label>
                <input
                  type="number"
                  placeholder="e.g. 60"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="30" max="300"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('identity')}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep('goal')}
                  disabled={!age || !height || !weight}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors text-sm"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 'goal' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">What's your goal?</h2>
                <p className="text-sm text-gray-400">We'll adjust your calorie target accordingly</p>
              </div>
              <div className="space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      goal === g.value
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{g.emoji}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm">{g.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{g.desc}</div>
                      </div>
                      {goal === g.value && <span className="text-emerald-500 font-bold text-lg">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('body')}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep('summary')}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors text-sm"
                >
                  Calculate →
                </button>
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <p className="text-gray-500 text-sm">
                  Hi {name.trim() || 'there'}! Your daily target:
                </p>
                <div className="text-5xl font-bold text-emerald-600 my-3">
                  {calculated.calories.toLocaleString()}
                </div>
                <p className="text-gray-400 text-sm">calories / day</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Protein</div>
                  <div className="text-xl font-bold text-gray-800 mt-0.5">{calculated.protein}g</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3">
                  <div className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Carbs</div>
                  <div className="text-xl font-bold text-gray-800 mt-0.5">{calculated.carbs}g</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Fat</div>
                  <div className="text-xl font-bold text-gray-800 mt-0.5">{calculated.fat}g</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 text-center leading-relaxed">
                Based on your profile &amp;{' '}
                <span className="font-semibold text-gray-700">
                  {goal === 'lose' ? 'weight loss' : goal === 'gain' ? 'muscle gain' : 'maintenance'}
                </span>{' '}
                goal. You can edit this anytime.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('goal')}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={() => onComplete(profile)}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors text-sm"
                >
                  Start Tracking! 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
