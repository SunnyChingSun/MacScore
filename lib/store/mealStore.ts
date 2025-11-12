import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MealItem, Customization, NutritionData } from "@/types";
import { sumNutrition } from "@/lib/services/nutrition";
import { calculateHealthScore } from "@/lib/services/scoring";
import { ScoreProfile } from "@/types";

interface MealState {
  items: MealItem[];
  selectedScoreProfileId: string | null;
  addItem: (item: MealItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<MealItem>) => void;
  clearMeal: () => void;
  getTotalNutrition: () => NutritionData;
  getTotalScore: () => number;
  setScoreProfile: (profileId: string) => void;
}

export const useMealStore = create<MealState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedScoreProfileId: null,

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      clearMeal: () =>
        set({
          items: [],
        }),

      getTotalNutrition: () => {
        const state = get();
        if (state.items.length === 0) {
          return {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sodium: 0,
            fiber: 0,
            sugar: 0,
          };
        }
        return sumNutrition(state.items.map((item) => item.nutrition));
      },

      getTotalScore: () => {
        const state = get();
        const totalNutrition = state.getTotalNutrition();
        // Use default weights for client-side calculation
        // In production, this would fetch the profile from the store or API
        const defaultProfile = {
          id: "default",
          name: "Default",
          calories_weight: 0.20,
          protein_weight: 0.15,
          carbs_weight: 0.15,
          fat_weight: 0.15,
          sodium_weight: 0.15,
          fiber_weight: 0.10,
          sugar_weight: 0.10,
          is_default: true,
          created_at: new Date(),
        };
        return calculateHealthScore(totalNutrition, defaultProfile);
      },

      setScoreProfile: (profileId) =>
        set({
          selectedScoreProfileId: profileId,
        }),
    }),
    {
      name: "macscore-meal-storage",
      partialize: (state) => ({
        items: state.items,
        selectedScoreProfileId: state.selectedScoreProfileId,
      }),
    }
  )
);
