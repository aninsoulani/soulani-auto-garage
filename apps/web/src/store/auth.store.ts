import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@/types/api.types';

interface AuthStore {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    { name: 'soulani-auth' }
  )
);
