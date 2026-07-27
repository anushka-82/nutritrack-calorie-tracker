import type { UserProfile } from '../types';
import { PROFILE_COLORS } from '../types';

interface Props {
  profiles: UserProfile[];
  onSelect: (profile: UserProfile) => void;
  onAddNew: () => void;
}

export function ProfileSwitcher({ profiles, onSelect, onAddNew }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-5xl mb-3">🥗</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">NutriTrack</h1>
      <p className="text-gray-400 text-sm mb-10">
        {profiles.length === 0 ? 'Create your profile to get started' : "Who's tracking today?"}
      </p>

      <div className="flex flex-wrap justify-center gap-6 max-w-sm">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onSelect(profile)}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-md group-hover:scale-105 transition-transform"
              style={{ backgroundColor: PROFILE_COLORS[profile.colorIndex % PROFILE_COLORS.length] }}
            >
              {profile.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-600 transition-colors">
              {profile.name}
            </span>
            <span className="text-xs text-gray-400">
              {profile.goal === 'lose' ? '🔥 Losing' : profile.goal === 'gain' ? '💪 Gaining' : '⚖️ Maintaining'}
            </span>
          </button>
        ))}

        {/* Add new profile */}
        <button
          onClick={onAddNew}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-3xl text-gray-300 group-hover:border-emerald-300 group-hover:text-emerald-400 transition-colors">
            +
          </div>
          <span className="text-sm font-semibold text-gray-400 group-hover:text-emerald-500 transition-colors">
            Add Profile
          </span>
        </button>
      </div>
    </div>
  );
}
