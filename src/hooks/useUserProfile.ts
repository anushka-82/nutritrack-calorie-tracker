import { useState, useCallback } from 'react';
import type { UserProfile, DailyGoals } from '../types';

export function calcGoals(profile: UserProfile): DailyGoals {
  // Mifflin-St Jeor BMR
  const bmr =
    profile.sex === 'male'
      ? 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5
      : 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age - 161;

  const tdee = Math.round(bmr * 1.55);

  const calories =
    profile.goal === 'lose'
      ? Math.round(tdee - 500)
      : profile.goal === 'gain'
        ? Math.round(tdee + 300)
        : tdee;

  const protein = Math.round(profile.weightKg * (profile.goal === 'maintain' ? 1.4 : 1.8));
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat };
}

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem('nt-profile');
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(loadProfile);

  const saveProfile = useCallback((p: UserProfile) => {
    localStorage.setItem('nt-profile', JSON.stringify(p));
    setProfile(p);
  }, []);

  const goals = profile ? calcGoals(profile) : null;

  return { profile, saveProfile, goals };
}
