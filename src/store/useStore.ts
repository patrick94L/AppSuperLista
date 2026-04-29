import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AppState {
  user: User | null;
  familyId: string | null;
  familyName: string | null;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
  setFamily: (id: string | null, name: string | null) => void;
  setAuthReady: (ready: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  familyId: null,
  familyName: null,
  isAuthReady: false,
  setUser: (user) => set({ user }),
  setFamily: (id, name) => set({ familyId: id, familyName: name }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
}));
