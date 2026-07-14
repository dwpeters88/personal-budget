import { create } from 'zustand';
import type { ViewId } from '../types';
import { KV } from '../config/kv';
import { monthKeyFromDate } from '../utils/helpers';

interface AppState {
  currentView: ViewId;
  selectedMonth: string;
  dataVersion: number;
  navigate: (view: ViewId) => void;
  setSelectedMonth: (monthKey: string) => void;
  bumpDataVersion: () => void;
}

export const useApp = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedMonth: KV.selectedMonth.read() || monthKeyFromDate(),
  dataVersion: 0,
  navigate: (view) => set({ currentView: view }),
  setSelectedMonth: (monthKey) => {
    KV.selectedMonth.write(monthKey);
    set({ selectedMonth: monthKey });
  },
  bumpDataVersion: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
}));
