import { useState } from 'react';
import type { UserProfile, DailyGoals } from '../types';
import { PROFILE_COLORS } from '../types';
import { calcGoals } from '../hooks/useUserProfile';

interface Props {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onDelete: () => void;
  onSwitchProfile: () => void;
  onClose: () => void;
}

const GOALS = [
  { value: 'lose' as const, label: 'Lose Weight', emoji: '🔥' },
  { value: 'maintain' as const, label: 'Maintain', emoji: '⚖️' },
  { value: 'gain' as const, label: 'Gain Muscle', emoji: '💪' },
];

export function ProfileEdit({ profile, onSave, onDelete, onSwitchProfile, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age));
  const [sex, setSex] = useState(profile.sex);
  const [height, setHeight] = useState(String(profile.heightCm));
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [goal, setGoal] = useState(profile.goal);

  const preview: UserProfile = {
    ...profile,
    name: name.trim() || profile.name,
    age: parseInt(age) || profile.age,
    sex,
    heightCm: parseFloat(height) || profile.heightCm,
    weightKg: parseFloat(weight) || profile.weightKg,
    goal,
  };
  const calculated: DailyGoals = calcGoals(preview);

  function handleSave() {
    onSave(preview);
    setEditing(false);
  }

  const color = PROFILE_COLORS[profile.colorIndex % PROFILE_COLORS.length];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-8 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="font-bold text-gray-800 text-lg">Profile</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl p-1">✕</button>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {profile.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">{profile.name}</p>
              <p className="text-sm text-gray-400">
                {profile.age}y · {profile.sex} · {profile.weightKg}kg · {profile.heightCm}cm
              </p>
            </div>
          </div>

          {/* Calculated goals preview */}
          {!editing && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">Daily Targets</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{calcGoals(profile).calories}</p>
                  <p className="text-xs text-gray-400">kcal / day</p>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-blue-600 font-semibold">P</p>
                    <p className="text-sm font-bold text-gray-700">{calcGoals(profile).protein}g</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2">
                    <p className="text-xs text-amber-600 font-semibold">C</p>
                    <p className="text-sm font-bold text-gray-700">{calcGoals(profile).carbs}g</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2">
                    <p className="text-xs text-purple-600 font-semibold">F</p>
                    <p className="text-sm font-bold text-gray-700">{calcGoals(profile).fat}g</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit form */}
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 font-medium mb-1 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500 font-medium mb-1 block">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium mb-1 block">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as 'male' | 'female')}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium mb-1 block">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium mb-1 block">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 font-medium mb-2 block">Goal</label>
                <div className="grid grid-cols-3 gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                        goal === g.value
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-gray-100 text-gray-500'
                      }`}
                    >
                      <span className="text-lg">{g.emoji}</span>
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* New targets preview */}
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">New daily target</p>
                <p className="text-xl font-bold text-emerald-600">{calculated.calories} kcal</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  P:{calculated.protein}g · C:{calculated.carbs}g · F:{calculated.fat}g
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setEditing(true)}
                className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={onSwitchProfile}
                className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Switch Profile
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${profile.name}'s profile and all their data?`)) {
                    onDelete();
                  }
                }}
                className="w-full py-2.5 border border-red-100 text-red-400 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Delete Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
