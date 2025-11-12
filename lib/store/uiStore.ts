import { create } from "zustand";

interface UIState {
  isCustomizerOpen: boolean;
  activeItemId: string | null;
  searchQuery: string;
  selectedRestaurantId: string | null;
  openCustomizer: (itemId: string) => void;
  closeCustomizer: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedRestaurantId: (restaurantId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCustomizerOpen: false,
  activeItemId: null,
  searchQuery: "",
  selectedRestaurantId: null,

  openCustomizer: (itemId) =>
    set({
      isCustomizerOpen: true,
      activeItemId: itemId,
    }),

  closeCustomizer: () =>
    set({
      isCustomizerOpen: false,
      activeItemId: null,
    }),

  setSearchQuery: (query) =>
    set({
      searchQuery: query,
    }),

  setSelectedRestaurantId: (restaurantId) =>
    set({
      selectedRestaurantId: restaurantId,
    }),
}));
