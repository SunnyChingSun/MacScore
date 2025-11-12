import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Customization } from "@/types";

interface CustomizationState {
  customizations: Record<string, Customization[]>; // itemId -> customizations
  setCustomizations: (itemId: string, customizations: Customization[]) => void;
  getCustomizations: (itemId: string) => Customization[];
  clearCustomizations: (itemId: string) => void;
}

export const useCustomizationStore = create<CustomizationState>()(
  persist(
    (set, get) => ({
      customizations: {},

      setCustomizations: (itemId, customizations) =>
        set((state) => ({
          customizations: {
            ...state.customizations,
            [itemId]: customizations,
          },
        })),

      getCustomizations: (itemId) => {
        const state = get();
        return state.customizations[itemId] || [];
      },

      clearCustomizations: (itemId) =>
        set((state) => {
          const newCustomizations = { ...state.customizations };
          delete newCustomizations[itemId];
          return { customizations: newCustomizations };
        }),
    }),
    {
      name: "macscore-customization-storage",
    }
  )
);
