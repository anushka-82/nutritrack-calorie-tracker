import { useState, useCallback } from 'react';
import type { UserProfile } from '../types';
import { calcGoals } from './useUserProfile';
export { calcGoals };

function migrateFoodLogs(profileId: string) {
  const toMigrate: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && /^nt-log-\d{4}-\d{2}-\d{2}$/.test(key)) {
      toMigrate.push(key);
    }
  }
  toMigrate.forEach((key) => {
    const date = key.replace('nt-log-', '');
    const data = localStorage.getItem(key);
    if (data) {
      localStorage.setItem(`nt-log-${profileId}-${date}`, data);
      localStorage.removeItem(key);
    }
  });
  // Also migrate goals
  const oldGoals = localStorage.getItem('nt-goals');
  if (oldGoals) {
    localStorage.setItem(`nt-goals-${profileId}`, oldGoals);
    localStorage.removeItem('nt-goals');
  }
}

function loadProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem('nt-profiles');
    if (raw) return JSON.parse(raw) as UserProfile[];

    // Migrate old single-profile format
    const oldRaw = localStorage.getItem('nt-profile');
    if (oldRaw) {
      const old = JSON.parse(oldRaw) as Partial<UserProfile>;
      const profile: UserProfile = {
        id: crypto.randomUUID(),
        name: old.name ?? 'Me',
        age: old.age ?? 25,
        sex: old.sex ?? 'female',
        heightCm: old.heightCm ?? 165,
        weightKg: old.weightKg ?? 60,
        goal: old.goal ?? 'maintain',
        colorIndex: 0,
      };
      migrateFoodLogs(profile.id);
      localStorage.setItem('nt-profiles', JSON.stringify([profile]));
      localStorage.setItem('nt-active-profile', profile.id);
      localStorage.removeItem('nt-profile');
      return [profile];
    }
    return [];
  } catch {
    return [];
  }
}

function loadActiveId(): string | null {
  return localStorage.getItem('nt-active-profile');
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>(loadProfiles);
  const [activeId, setActiveId] = useState<string | null>(loadActiveId);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? null;
  const goals = activeProfile ? calcGoals(activeProfile) : null;

  const saveProfile = useCallback((profile: UserProfile) => {
    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === profile.id);
      const next = exists
        ? prev.map((p) => (p.id === profile.id ? profile : p))
        : [...prev, profile];
      localStorage.setItem('nt-profiles', JSON.stringify(next));
      return next;
    });
  }, []);

  const addProfile = useCallback(
    (data: Omit<UserProfile, 'id' | 'colorIndex'>) => {
      const profile: UserProfile = {
        ...data,
        id: crypto.randomUUID(),
        colorIndex: Math.floor(Math.random() * 6),
      };
      setProfiles((prev) => {
        const next = [...prev, profile];
        localStorage.setItem('nt-profiles', JSON.stringify(next));
        return next;
      });
      return profile;
    },
    [],
  );

  const removeProfile = useCallback(
    (id: string) => {
      // Delete all food logs for this profile
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`nt-log-${id}-`)) toDelete.push(key);
      }
      toDelete.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem(`nt-goals-${id}`);

      setProfiles((prev) => {
        const next = prev.filter((p) => p.id !== id);
        localStorage.setItem('nt-profiles', JSON.stringify(next));
        return next;
      });

      if (activeId === id) {
        setActiveId(null);
        localStorage.removeItem('nt-active-profile');
      }
    },
    [activeId],
  );

  const switchProfile = useCallback((id: string | null) => {
    setActiveId(id);
    if (id) {
      localStorage.setItem('nt-active-profile', id);
    } else {
      localStorage.removeItem('nt-active-profile');
    }
  }, []);

  return { profiles, activeProfile, goals, saveProfile, addProfile, removeProfile, switchProfile };
}
