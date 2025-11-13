import { create } from "zustand";
import { Customization } from "@/types";

interface CustomizationState {
  customizations: Record<string, Customization[]>;
  getCustomizations: (itemId: string) => Customization[] | undefined;
  setCustomizations: (itemId: string, customizations: Customization[]) => void;
  clearCustomizations: (itemId: string) => void;
}

export const useCustomizationStore = create<CustomizationState>((set, get) => ({
  customizations: {},
  getCustomizations: (itemId: string) => {
    return get().customizations[itemId];
  },
  setCustomizations: (itemId: string, customizations: Customization[]) => {
    set((state) => ({
      customizations: {
        ...state.customizations,
        [itemId]: customizations,
      },
    }));
  },
  clearCustomizations: (itemId: string) => {
    set((state) => {
      const { [itemId]: _, ...rest } = state.customizations;
      return { customizations: rest };
    });
  },
}));

