import { create } from "zustand";
import { MealItem, NutritionData } from "@/types";
import { sumNutrition } from "@/lib/services/nutrition";
import { calculateHealthScore } from "@/lib/services/scoring";

interface MealState {
  items: MealItem[];
  addItem: (item: MealItem) => void;
  updateItem: (id: string, updates: Partial<MealItem>) => void;
  removeItem: (id: string) => void;
  clearMeal: () => void;
  getTotalNutrition: () => NutritionData;
  getTotalScore: () => number;
}

export const useMealStore = create<MealState>((set, get) => ({
  items: [],
  addItem: (item: MealItem) => {
    set((state) => ({
      items: [...state.items, item],
    }));
  },
  updateItem: (id: string, updates: Partial<MealItem>) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },
  removeItem: (id: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
  clearMeal: () => {
    set({ items: [] });
  },
  getTotalNutrition: () => {
    const { items } = get();
    if (items.length === 0) {
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
    const nutritionArray = items.map((item) => item.nutrition);
    return sumNutrition(nutritionArray);
  },
  getTotalScore: () => {
    const { items } = get();
    if (items.length === 0) {
      return 50; // Default score for empty meal
    }
    const totalNutrition = get().getTotalNutrition();
    return calculateHealthScore(totalNutrition);
  },
}));

