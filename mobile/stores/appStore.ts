import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface BeautyParams {
  smoothing: number;
  brightening: number;
  sharpening: number;
  blemishRemoval: number;
}

interface AppState {
  apiUrl: string;
  setApiUrl: (url: string) => void;
  params: BeautyParams;
  setParams: (p: Partial<BeautyParams>) => void;
  presets: { name: string; params: BeautyParams }[];
  savePreset: (name: string, params: BeautyParams) => void;
  deletePreset: (name: string) => void;
  loadPresets: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  apiUrl: "http://localhost:8000",
  setApiUrl: (url) => set({ apiUrl: url }),
  params: { smoothing: 50, brightening: 30, sharpening: 20, blemishRemoval: 0 },
  setParams: (p) => set((s) => ({ params: { ...s.params, ...p } })),
  presets: [],
  savePreset: async (name, params) => {
    const presets = [...get().presets.filter((p) => p.name !== name), { name, params }];
    set({ presets });
    await AsyncStorage.setItem("glowup_presets", JSON.stringify(presets));
  },
  deletePreset: async (name) => {
    const presets = get().presets.filter((p) => p.name !== name);
    set({ presets });
    await AsyncStorage.setItem("glowup_presets", JSON.stringify(presets));
  },
  loadPresets: async () => {
    try {
      const data = await AsyncStorage.getItem("glowup_presets");
      if (data) set({ presets: JSON.parse(data) });
    } catch {}
  },
}));
