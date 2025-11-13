import { create } from "zustand";

interface UIState {
  activeItemId: string | null;
  selectedRestaurantId: string | null;
  searchQuery: string;
  openCustomizer: (itemId: string) => void;
  closeCustomizer: () => void;
  setSelectedRestaurantId: (restaurantId: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeItemId: null,
  selectedRestaurantId: null,
  searchQuery: "",
  openCustomizer: (itemId: string) => set({ activeItemId: itemId }),
  closeCustomizer: () => set({ activeItemId: null }),
  setSelectedRestaurantId: (restaurantId: string | null) =>
    set({ selectedRestaurantId: restaurantId }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
}));

