"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/uiStore";
import { useMealStore } from "@/lib/store/mealStore";
import { useCustomizationStore } from "@/lib/store/customizationStore";
import { Item, Ingredient, Customization, MealItem, NutritionData, Restaurant } from "@/types";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ScoreMeter } from "@/components/score-display/ScoreMeter";
import { NutritionBars } from "@/components/score-display/NutritionBars";
import { MacronutrientPieChart } from "@/components/score-display/MacronutrientPieChart";
import { AppImage } from "@/components/ui/Image";
import { detectItemType, groupIngredientsByCategory } from "@/lib/utils/itemType";
import { createCustomizationFlow, CustomizationCategory } from "@/lib/utils/customizationFlow";
import { CategorySection } from "./CategorySection";

// API functions
async function getItemDetails(id: string) {
  const response = await fetch(`/api/items/${id}`);
  if (!response.ok) throw new Error("Failed to fetch item");
  return response.json();
}

async function customizeItem(
  id: string,
  customizations: Customization[]
): Promise<{ nutrition: NutritionData; score: number }> {
  const response = await fetch(`/api/items/${id}/customize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customizations }),
  });
  if (!response.ok) throw new Error("Failed to customize item");
  return response.json();
}

// Helper function to format quantity: whole numbers without decimals, decimals as-is
function formatQuantity(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  const str = value.toString();
  if (str.includes('.')) {
    return str.replace(/\.?0+$/, '');
  }
  return str;
}

export function ItemCustomizer() {
  const { activeItemId, closeCustomizer } = useUIStore();
  const { items, addItem, updateItem } = useMealStore();
  const { getCustomizations, setCustomizations, clearCustomizations } = useCustomizationStore();

  // Quantity state
  const [quantity, setQuantity] = useState<number>(1.0);
  const [quantityInput, setQuantityInput] = useState<string>("1");

  // Local customizations state
  const [localCustomizations, setLocalCustomizations] = useState<Customization[]>([]);

  // Multiplier inputs state
  const [multiplierInputs, setMultiplierInputs] = useState<Record<string, string>>({});

  // Fetch item details
  const { data: itemData, isLoading, error } = useQuery({
    queryKey: ["item", activeItemId],
    queryFn: () => getItemDetails(activeItemId!),
    enabled: !!activeItemId,
  });

  // Customize mutation
  const customizeMutation = useMutation({
    mutationFn: (customizations: Customization[]) => {
      if (!activeItemId) {
        throw new Error("No active item ID");
      }
      return customizeItem(activeItemId, customizations);
    },
    retry: 1,
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });

  // Fetch score for items without ingredients (must be called unconditionally)
  const scoreQuery = useQuery({
    queryKey: ["score", itemData?.item?.id],
    queryFn: () => fetch(`/api/score/${itemData!.item.id}`).then((res) => res.json()),
    enabled: !!itemData?.item?.id && (itemData?.ingredients?.length === 0),
  });

  // Initialize from existing meal item or stored customizations
  useEffect(() => {
    if (!activeItemId || !itemData) return;

    const existingMealItem = items.find((i: MealItem) => i.item_id === activeItemId);
    const storedCustomizations = getCustomizations(activeItemId);
    const itemIngredients = itemData.itemIngredients || [];

      if (existingMealItem) {
      setLocalCustomizations(existingMealItem.customizations);
      setQuantity(existingMealItem.quantity || 1.0);
      setQuantityInput(formatQuantity(existingMealItem.quantity || 1.0));
      
      // Initialize multiplier inputs
      const inputs: Record<string, string> = {};
      itemIngredients.forEach((ii: { ingredient_id: string; quantity_g: number }) => {
        const customization = existingMealItem.customizations.find((c) => c.ingredient_id === ii.ingredient_id);
        if (customization?.action === "modify" && customization.multiplier !== undefined) {
          inputs[ii.ingredient_id] = customization.multiplier.toString();
      } else {
          inputs[ii.ingredient_id] = "1.0";
        }
      });
      setMultiplierInputs(inputs);
    } else if (storedCustomizations) {
      setLocalCustomizations(storedCustomizations);
      setQuantity(1.0);
      setQuantityInput("1");
      
      // Initialize multiplier inputs
      const inputs: Record<string, string> = {};
      itemIngredients.forEach((ii: { ingredient_id: string; quantity_g: number }) => {
        const customization = storedCustomizations.find((c) => c.ingredient_id === ii.ingredient_id);
        if (customization?.action === "modify" && customization.multiplier !== undefined) {
          inputs[ii.ingredient_id] = customization.multiplier.toString();
        } else {
          inputs[ii.ingredient_id] = "1.0";
        }
      });
      setMultiplierInputs(inputs);
    } else {
      setLocalCustomizations([]);
      setQuantity(1.0);
      setQuantityInput("1");
      
      // Initialize multiplier inputs to 1.0
      const inputs: Record<string, string> = {};
      itemIngredients.forEach((ii: { ingredient_id: string; quantity_g: number }) => {
        inputs[ii.ingredient_id] = "1.0";
      });
      setMultiplierInputs(inputs);
    }
  }, [activeItemId, items, getCustomizations, itemData]);

  // Auto-customize when customizations change (including initial load)
  useEffect(() => {
    if (!activeItemId || !itemData) {
      customizeMutation.reset();
      return;
    }

    // Always call API to get nutrition, even with empty customizations
      const timeoutId = setTimeout(() => {
        customizeMutation.mutate(localCustomizations);
    }, 300); // Debounce

      return () => clearTimeout(timeoutId);
  }, [localCustomizations, activeItemId, itemData]);

  // If no item is selected, don't render anything
  if (!activeItemId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
        <ErrorMessage message="Failed to load item details. Please try again." />
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={closeCustomizer}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  // No data
  if (!itemData || !itemData.item) {
    return null;
  }

  const item: Item = itemData.item;
  const restaurant: Restaurant | null = itemData.restaurant || null;
  const ingredients: Ingredient[] = itemData.ingredients || [];
  const allIngredients: Ingredient[] = itemData.allIngredients || [];
  const itemIngredients = itemData.itemIngredients || [];

  // Detect item type and group ingredients
  const itemType = detectItemType(item, restaurant);
  const groupedIngredients = groupIngredientsByCategory(
    allIngredients.length > 0 ? allIngredients : ingredients,
    itemType
  );

  // Create customization flow based on item type
  const customizationFlow = createCustomizationFlow(
    item,
    restaurant,
    itemType,
    groupedIngredients,
    itemIngredients,
    allIngredients.length > 0 ? allIngredients : ingredients
  );

  // If no ingredients, show a simplified view with quantity selector
  if (ingredients.length === 0) {
    const handleAddWithoutCustomization = async () => {
      try {
        // Calculate score
        const scoreResponse = await fetch(`/api/score/${item.id}`);
        if (!scoreResponse.ok) {
          console.error("Failed to calculate score");
          return;
        }
        const scoreData = await scoreResponse.json();

        // Apply quantity multiplier to nutrition
        const adjustedNutrition: NutritionData = {
          calories: item.base_calories * quantity,
          protein: item.base_protein * quantity,
          carbs: item.base_carbs * quantity,
          fat: item.base_fat * quantity,
          sodium: item.base_sodium * quantity,
          fiber: item.base_fiber * quantity,
          sugar: item.base_sugar * quantity,
        };

        // Update or add to meal
        const existingMealItem = items.find((i: MealItem) => i.item_id === activeItemId);
        if (existingMealItem) {
          updateItem(existingMealItem.id, {
            nutrition: adjustedNutrition,
            score: scoreData.score,
            quantity: quantity,
          });
        } else {
        const mealItem: MealItem = {
            id: `meal-${Date.now()}`,
            item_id: activeItemId,
          item,
          customizations: [],
            nutrition: adjustedNutrition,
            score: scoreData.score,
            quantity: quantity,
          };
          addItem(mealItem);
        }

        closeCustomizer();
      } catch (error) {
        console.error("Error adding item to meal:", error);
      }
    };

    const baseNutrition: NutritionData = {
            calories: item.base_calories,
            protein: item.base_protein,
            carbs: item.base_carbs,
            fat: item.base_fat,
            sodium: item.base_sodium,
            fiber: item.base_fiber,
            sugar: item.base_sugar,
    };

    const displayNutrition: NutritionData = {
      calories: baseNutrition.calories * quantity,
      protein: baseNutrition.protein * quantity,
      carbs: baseNutrition.carbs * quantity,
      fat: baseNutrition.fat * quantity,
      sodium: baseNutrition.sodium * quantity,
      fiber: baseNutrition.fiber * quantity,
      sugar: baseNutrition.sugar * quantity,
    };

    const score = scoreQuery.data?.score || 50;

    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <AppImage
              src={item.image_url}
              alt={item.name}
              width={80}
              height={80}
              className="rounded-lg w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0"
              objectFit="cover"
              fallback={<div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-gray-100 rounded-lg text-2xl sm:text-3xl">🍔</div>}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 break-words">{item.name}</h2>
              {item.description && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Qty:</label>
              <input
                type="number"
                min="1"
                max="10"
                step="1"
                value={quantityInput}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setQuantityInput(inputValue);
                  const value = parseFloat(inputValue);
                  if (!isNaN(value) && value > 0) {
                    setQuantity(Math.max(1, Math.min(10, value)));
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  if (isNaN(value) || value < 1) {
                    setQuantity(1.0);
                    setQuantityInput("1");
                  } else if (value > 10) {
                    setQuantity(10);
                    setQuantityInput("10");
                  } else {
                    setQuantity(value);
                    setQuantityInput(formatQuantity(value));
                  }
                }}
                className="w-16 sm:w-20 px-2 sm:px-3 py-2 text-center text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-macscore-red focus:border-transparent touch-manipulation"
              />
            </div>
            <ScoreMeter score={score} size="sm" showLabel={false} />
          </div>
        </div>

        {/* Nutrition Display */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
            Nutrition
          </h3>
          <MacronutrientPieChart nutrition={displayNutrition} />
          <div className="mt-4 sm:mt-6">
            <NutritionBars nutrition={displayNutrition} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
          <Button
            variant="ghost"
            size="md"
            onClick={closeCustomizer}
            className="touch-manipulation min-h-[44px] sm:min-h-[40px]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleAddWithoutCustomization}
            className="touch-manipulation min-h-[44px] sm:min-h-[40px]"
          >
            Add to Meal
          </Button>
        </div>
      </div>
    );
  }

  // Handle ingredient swap (replace one ingredient with another)
  const handleIngredientSwap = (
    oldIngredientId: string,
    newIngredientId: string,
    baseQuantity: number
  ) => {
    // Create new customizations array with the swap
    const newCustomizations = localCustomizations
      .filter(
        (c: Customization) =>
          c.ingredient_id !== oldIngredientId && c.ingredient_id !== newIngredientId
      )
      .concat([
        { ingredient_id: oldIngredientId, action: "remove" },
        { ingredient_id: newIngredientId, action: "add", quantity_g: baseQuantity },
      ]);
    
    // Update state - the useEffect will trigger the mutation automatically
    setLocalCustomizations(newCustomizations);
  };
  
  // Get current ingredient after customizations (handles swaps)
  const getCurrentIngredient = (category: Ingredient[], itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>): Ingredient | null => {
    // Check if ingredient was swapped
    const swappedIngredient = localCustomizations.find(
      (c: Customization) => c.action === "add" && category.some((ing) => ing.id === c.ingredient_id)
    );
    if (swappedIngredient) {
      return category.find((ing) => ing.id === swappedIngredient.ingredient_id) || null;
    }
    
    // Check if current ingredient was removed
    const removedIngredient = localCustomizations.find(
      (c: Customization) => c.action === "remove" && category.some((ing) => ing.id === c.ingredient_id)
    );
    if (removedIngredient) {
      // If removed, return the first available option
      return category.find((ing) => ing.id !== removedIngredient.ingredient_id) || category[0] || null;
    }
    
    // Find current ingredient from item
    const currentItemIngredient = itemIngredients.find((ii) =>
      category.some((ing) => ing.id === ii.ingredient_id)
    );
    if (currentItemIngredient) {
      return category.find((ing) => ing.id === currentItemIngredient.ingredient_id) || null;
    }
    
    return category[0] || null;
  };

  // Handle ingredient customization
  const handleIngredientChange = (
    ingredientId: string,
    action: "add" | "remove" | "modify",
    value?: number
  ) => {
    setLocalCustomizations((prev) => {
      // Filter out any existing customizations for this ingredient
      const filtered = prev.filter((c: Customization) => c.ingredient_id !== ingredientId);
      
      if (action === "remove") {
        // Add remove action to the array so isIngredientRemoved works correctly
        // and nutrition calculation can subtract the ingredient
        return [
          ...filtered,
          { ingredient_id: ingredientId, action: "remove" },
        ];
      }
      
      if (action === "modify" && value !== undefined) {
        const itemIngredient = itemIngredients.find((ii: { ingredient_id: string; quantity_g: number }) => ii.ingredient_id === ingredientId);
        if (itemIngredient) {
          const multiplier = value / itemIngredient.quantity_g;
          return [
            ...filtered,
            { ingredient_id: ingredientId, action: "modify", multiplier },
          ];
        }
      }
      
      if (action === "add" && value !== undefined) {
        return [
          ...filtered,
          { ingredient_id: ingredientId, action: "add", quantity_g: value },
        ];
      }
      
      return filtered;
    });
  };

  // Get ingredient multiplier
  const getIngredientMultiplier = (ingredientId: string): number => {
    const customization = localCustomizations.find((c) => c.ingredient_id === ingredientId);
    if (customization?.action === "modify" && customization.multiplier !== undefined) {
      return customization.multiplier;
    }
    return 1.0;
  };

  // Check if ingredient is removed
  const isIngredientRemoved = (ingredientId: string): boolean => {
    return localCustomizations.some(
      (c: Customization) => c.ingredient_id === ingredientId && c.action === "remove"
    );
  };

  // Handle add to meal
  const handleAddToMeal = () => {
    // Use mutation data if available, otherwise use base nutrition values
    // This ensures the button always works, even if mutation is pending or failed
    let nutritionData: { nutrition: NutritionData; score: number };
    
    if (customizeMutation.data) {
      // Use calculated nutrition from mutation
      nutritionData = customizeMutation.data;
    } else {
      // Use base nutrition values from item as fallback
      nutritionData = {
        nutrition: {
          calories: item.base_calories || 0,
          protein: item.base_protein || 0,
          carbs: item.base_carbs || 0,
          fat: item.base_fat || 0,
          sodium: item.base_sodium || 0,
          fiber: item.base_fiber || 0,
          sugar: item.base_sugar || 0,
        },
        score: scoreQuery.data?.score || 50,
      };
    }

    // Add item to meal immediately
    addItemToMeal(nutritionData);
  };

  const addItemToMeal = (data: { nutrition: NutritionData; score: number }) => {
    // Apply quantity multiplier to nutrition
    const adjustedNutrition: NutritionData = {
      calories: data.nutrition.calories * quantity,
      protein: data.nutrition.protein * quantity,
      carbs: data.nutrition.carbs * quantity,
      fat: data.nutrition.fat * quantity,
      sodium: data.nutrition.sodium * quantity,
      fiber: data.nutrition.fiber * quantity,
      sugar: data.nutrition.sugar * quantity,
    };

    // Store customizations
    setCustomizations(activeItemId, localCustomizations);

    // Update or add to meal
    const existingMealItem = items.find((i: MealItem) => i.item_id === activeItemId);
    if (existingMealItem) {
      // Update existing meal item
      updateItem(existingMealItem.id, {
        customizations: localCustomizations,
        nutrition: adjustedNutrition,
        score: data.score, // Score doesn't change with quantity
        quantity: quantity,
      });
    } else {
      // Add new meal item
      const mealItem: MealItem = {
        id: `meal-${Date.now()}`,
        item_id: activeItemId,
        item,
        customizations: localCustomizations,
        nutrition: adjustedNutrition,
        score: data.score,
        quantity: quantity,
      };
      addItem(mealItem);
    }

    closeCustomizer();
  };

  // Check if we're editing an existing meal item
  const existingMealItem = items.find((i: MealItem) => i.item_id === activeItemId);
  const isEditing = !!existingMealItem;

  // Calculate base nutrition (ensure all values are numbers)
  const baseNutrition = customizeMutation.data?.nutrition || {
    calories: item.base_calories ?? 0,
    protein: item.base_protein ?? 0,
    carbs: item.base_carbs ?? 0,
    fat: item.base_fat ?? 0,
    sodium: item.base_sodium ?? 0,
    fiber: item.base_fiber ?? 0,
    sugar: item.base_sugar ?? 0,
  };

  // Apply quantity multiplier to display nutrition (ensure valid numbers)
  const displayNutrition: NutritionData = {
    calories: Math.max(0, (baseNutrition.calories ?? 0) * quantity),
    protein: Math.max(0, (baseNutrition.protein ?? 0) * quantity),
    carbs: Math.max(0, (baseNutrition.carbs ?? 0) * quantity),
    fat: Math.max(0, (baseNutrition.fat ?? 0) * quantity),
    sodium: Math.max(0, (baseNutrition.sodium ?? 0) * quantity),
    fiber: Math.max(0, (baseNutrition.fiber ?? 0) * quantity),
    sugar: Math.max(0, (baseNutrition.sugar ?? 0) * quantity),
  };

  const score = customizeMutation.data?.score || 50;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <AppImage
              src={item.image_url}
              alt={item.name}
            width={80}
            height={80}
            className="rounded-lg w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0"
            objectFit="cover"
            fallback={<div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-gray-100 rounded-lg text-2xl sm:text-3xl">🍔</div>}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 break-words">{item.name}</h2>
            {item.description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Qty:</label>
            <input
              type="number"
              min="1"
              max="10"
              step="1"
              value={quantityInput}
              onChange={(e) => {
                const inputValue = e.target.value;
                setQuantityInput(inputValue);
                const value = parseFloat(inputValue);
                if (!isNaN(value) && value > 0) {
                  setQuantity(Math.max(1, Math.min(10, value)));
                }
              }}
              onBlur={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 1) {
                  setQuantity(1.0);
                  setQuantityInput("1");
                } else if (value > 10) {
                  setQuantity(10);
                  setQuantityInput("10");
                } else {
                  setQuantity(value);
                  setQuantityInput(formatQuantity(value));
                }
              }}
              className="w-16 sm:w-20 px-2 sm:px-3 py-2 text-center text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-macscore-red focus:border-transparent touch-manipulation"
            />
          </div>
          <ScoreMeter score={score} size="sm" showLabel={false} />
          </div>
        </div>

      {/* Category-Based Customization Flow */}
      <div className="mb-4 sm:mb-6 space-y-6 sm:space-y-8">
        {customizationFlow.categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            itemIngredients={itemIngredients}
            ingredients={ingredients}
            allIngredients={allIngredients}
            localCustomizations={localCustomizations}
            multiplierInputs={multiplierInputs}
            setMultiplierInputs={setMultiplierInputs}
            onIngredientChange={handleIngredientChange}
            onIngredientSwap={handleIngredientSwap}
            getIngredientMultiplier={getIngredientMultiplier}
            isIngredientRemoved={isIngredientRemoved}
            getCurrentIngredient={getCurrentIngredient}
          />
        ))}
            </div>

      {/* Nutrition Display */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
          Nutrition
        </h3>
        {customizeMutation.isPending && !customizeMutation.data && (
          <div className="mb-4 text-sm text-gray-500">Calculating nutrition...</div>
        )}
        <MacronutrientPieChart nutrition={displayNutrition} />
        <div className="mt-4 sm:mt-6">
          <NutritionBars nutrition={displayNutrition} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
        <Button
          variant="ghost"
          size="md"
          onClick={closeCustomizer}
          className="touch-manipulation min-h-[44px] sm:min-h-[40px]"
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          size="md"
          onClick={handleAddToMeal}
          disabled={false}
          className="touch-manipulation min-h-[44px] sm:min-h-[40px]"
        >
          {isEditing ? "Update Meal" : "Add to Meal"}
        </Button>
      </div>
    </div>
  );
}

export interface IngredientControlProps {
  ingredient: Ingredient;
  baseQuantity: number;
  currentQuantity: number;
  multiplier: number;
  multiplierInput: string;
  isRemoved: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onRestore: () => void;
}

export function IngredientControl({
  ingredient,
  baseQuantity,
  currentQuantity,
  multiplier,
  multiplierInput,
  isRemoved,
  onInputChange,
  onInputBlur,
  onRemove,
  onRestore,
}: IngredientControlProps) {
  if (isRemoved) {
    return (
      <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <AppImage
            src={ingredient.image_url}
            alt={ingredient.name}
            width={40}
            height={40}
            className="rounded w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
            objectFit="cover"
            fallback={<div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-100 rounded text-lg sm:text-xl">🥬</div>}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-medium text-gray-500 line-through truncate">
              {ingredient.name}
            </p>
            <p className="text-xs text-gray-400">Removed</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRestore}
          className="touch-manipulation min-h-[36px] sm:min-h-[32px] text-xs sm:text-sm"
        >
          Restore
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <AppImage
          src={ingredient.image_url}
          alt={ingredient.name}
          width={40}
          height={40}
          className="rounded w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
          objectFit="cover"
          fallback={<div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-100 rounded text-lg sm:text-xl">🥬</div>}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
            {ingredient.name}
          </p>
          <p className="text-xs text-gray-500">
            {currentQuantity.toFixed(1)}g ({multiplier.toFixed(2)}x) • {((ingredient.calories_per_100g * currentQuantity) / 100).toFixed(0)} cal
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
        <input
          type="number"
          min="0.5"
          max="10"
          step="0.5"
          value={multiplierInput}
          onChange={onInputChange}
          onBlur={onInputBlur}
          className="w-18 sm:w-20 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-macscore-red focus:border-transparent touch-manipulation"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="touch-manipulation min-h-[36px] sm:min-h-[32px] text-xs sm:text-sm px-3 sm:px-4"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

// Specialized Selector Components

interface PizzaCrustSelectorProps {
  itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>;
  currentCrust: Ingredient;
  currentItemIngredient: { ingredient_id: string; quantity_g: number };
  availableCrusts: Ingredient[];
  ingredients: Ingredient[];
  localCustomizations: Customization[];
  multiplierInputs: Record<string, string>;
  setMultiplierInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSwap: (oldId: string, newId: string, baseQuantity: number) => void;
  onIngredientChange: (ingredientId: string, action: "add" | "remove" | "modify", value?: number) => void;
  getIngredientMultiplier: (ingredientId: string) => number;
  isIngredientRemoved: (ingredientId: string) => boolean;
}

function PizzaCrustSelector({
  currentCrust,
  currentItemIngredient,
  availableCrusts,
  ingredients,
  localCustomizations,
  multiplierInputs,
  setMultiplierInputs,
  onSwap,
  onIngredientChange,
  getIngredientMultiplier,
  isIngredientRemoved,
}: PizzaCrustSelectorProps) {
  const isRemoved = isIngredientRemoved(currentCrust.id);
  const multiplier = getIngredientMultiplier(currentCrust.id);
  const currentQuantity = currentItemIngredient.quantity_g * multiplier;
  const multiplierInput = multiplierInputs[currentCrust.id] || multiplier.toString();
  const calories = (currentCrust.calories_per_100g * currentQuantity) / 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMultiplierInputs((prev) => ({
      ...prev,
      [currentCrust.id]: inputValue,
    }));
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= 0.1) {
      const newQuantity = currentItemIngredient.quantity_g * value;
      onIngredientChange(currentCrust.id, "modify", newQuantity);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0.1) {
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentCrust.id]: "0.5",
      }));
      onIngredientChange(currentCrust.id, "modify", currentItemIngredient.quantity_g * 0.5);
    } else if (value > 10) {
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentCrust.id]: "10",
      }));
      onIngredientChange(currentCrust.id, "modify", currentItemIngredient.quantity_g * 10);
    } else {
      const newQuantity = currentItemIngredient.quantity_g * value;
      onIngredientChange(currentCrust.id, "modify", newQuantity);
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentCrust.id]: value.toString(),
      }));
    }
  };

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
        Crust Type
      </h3>
      
      {/* Current Crust with Controls */}
      <IngredientControl
        ingredient={currentCrust}
        baseQuantity={currentItemIngredient.quantity_g}
        currentQuantity={currentQuantity}
        multiplier={multiplier}
        multiplierInput={multiplierInput}
        isRemoved={isRemoved}
        onInputChange={handleInputChange}
        onInputBlur={handleInputBlur}
        onRemove={() => onIngredientChange(currentCrust.id, "remove")}
        onRestore={() => onIngredientChange(currentCrust.id, "modify", currentItemIngredient.quantity_g)}
      />
      
      {/* Available Alternatives */}
      {availableCrusts.length > 1 && (
        <div className="mt-3 sm:mt-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium">Switch to:</p>
          <div className="space-y-2 sm:space-y-3">
            {availableCrusts
              .filter((crust) => crust.id !== currentCrust.id)
              .map((crust) => {
                const altQuantity = currentItemIngredient.quantity_g * multiplier;
                const altCalories = (crust.calories_per_100g * altQuantity) / 100;
  return (
                  <button
                    key={crust.id}
                    onClick={() => onSwap(currentCrust.id, crust.id, currentItemIngredient.quantity_g)}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-macscore-red hover:shadow-md transition-all w-full text-left touch-manipulation"
                  >
            <AppImage
                      src={crust.image_url}
                      alt={crust.name}
                      width={40}
                      height={40}
                      className="rounded w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
                      objectFit="cover"
                      fallback={<div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-100 rounded text-lg sm:text-xl">🍕</div>}
                    />
          <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                        {crust.name.replace("Pizza Crust (", "").replace(")", "")}
                      </p>
            <p className="text-xs text-gray-500">
                        {altQuantity.toFixed(0)}g • {altCalories.toFixed(0)} cal
            </p>
          </div>
                  </button>
                );
              })}
        </div>
        </div>
      )}
    </div>
  );
}

interface BowlProteinSelectorProps {
  itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>;
  currentProtein: Ingredient;
  currentItemIngredient: { ingredient_id: string; quantity_g: number };
  availableProteins: Ingredient[];
  ingredients: Ingredient[];
  localCustomizations: Customization[];
  multiplierInputs: Record<string, string>;
  setMultiplierInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSwap: (oldId: string, newId: string, baseQuantity: number) => void;
  onIngredientChange: (ingredientId: string, action: "add" | "remove" | "modify", value?: number) => void;
  getIngredientMultiplier: (ingredientId: string) => number;
  isIngredientRemoved: (ingredientId: string) => boolean;
}

function BowlProteinSelector({
  currentProtein,
  currentItemIngredient,
  availableProteins,
  ingredients,
  localCustomizations,
  multiplierInputs,
  setMultiplierInputs,
  onSwap,
  onIngredientChange,
  getIngredientMultiplier,
  isIngredientRemoved,
}: BowlProteinSelectorProps) {
  const isRemoved = isIngredientRemoved(currentProtein.id);
  const multiplier = getIngredientMultiplier(currentProtein.id);
  const currentQuantity = currentItemIngredient.quantity_g * multiplier;
  const multiplierInput = multiplierInputs[currentProtein.id] || multiplier.toString();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMultiplierInputs((prev) => ({
      ...prev,
      [currentProtein.id]: inputValue,
    }));
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= 0.1) {
      const newQuantity = currentItemIngredient.quantity_g * value;
      onIngredientChange(currentProtein.id, "modify", newQuantity);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0.1) {
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentProtein.id]: "0.5",
      }));
      onIngredientChange(currentProtein.id, "modify", currentItemIngredient.quantity_g * 0.5);
    } else if (value > 10) {
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentProtein.id]: "10",
      }));
      onIngredientChange(currentProtein.id, "modify", currentItemIngredient.quantity_g * 10);
    } else {
      const newQuantity = currentItemIngredient.quantity_g * value;
      onIngredientChange(currentProtein.id, "modify", newQuantity);
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentProtein.id]: value.toString(),
      }));
    }
  };

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
        Protein
      </h3>
      
      {/* Current Protein with Controls */}
      <IngredientControl
        ingredient={currentProtein}
        baseQuantity={currentItemIngredient.quantity_g}
        currentQuantity={currentQuantity}
        multiplier={multiplier}
        multiplierInput={multiplierInput}
        isRemoved={isRemoved}
        onInputChange={handleInputChange}
        onInputBlur={handleInputBlur}
        onRemove={() => onIngredientChange(currentProtein.id, "remove")}
        onRestore={() => onIngredientChange(currentProtein.id, "modify", currentItemIngredient.quantity_g)}
      />
      
      {/* Available Alternatives */}
      {availableProteins.length > 1 && (
        <div className="mt-3 sm:mt-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium">Switch to:</p>
          <div className="space-y-2 sm:space-y-3">
            {availableProteins
              .filter((protein) => protein.id !== currentProtein.id)
              .map((protein) => {
                const altQuantity = currentItemIngredient.quantity_g * multiplier;
                const altCalories = (protein.calories_per_100g * altQuantity) / 100;
                return (
                <button
                    key={protein.id}
                    onClick={() => onSwap(currentProtein.id, protein.id, currentItemIngredient.quantity_g)}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-macscore-red hover:shadow-md transition-all w-full text-left touch-manipulation"
                  >
                    <AppImage
                      src={protein.image_url}
                      alt={protein.name}
                      width={40}
                      height={40}
                      className="rounded w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
                      objectFit="cover"
                      fallback={<div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-100 rounded text-lg sm:text-xl">🍗</div>}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                        {protein.name.replace("(Chipotle)", "").replace("(Grilled)", "").trim()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {altQuantity.toFixed(0)}g • {altCalories.toFixed(0)} cal
                      </p>
                    </div>
                </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

interface BowlBaseSelectorProps {
  itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>;
  currentBase: Ingredient;
  currentItemIngredient: { ingredient_id: string; quantity_g: number };
  availableBases: Ingredient[];
  ingredients: Ingredient[];
  localCustomizations: Customization[];
  multiplierInputs: Record<string, string>;
  setMultiplierInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSwap: (oldId: string, newId: string, baseQuantity: number) => void;
  onIngredientChange: (ingredientId: string, action: "add" | "remove" | "modify", value?: number) => void;
  getIngredientMultiplier: (ingredientId: string) => number;
  isIngredientRemoved: (ingredientId: string) => boolean;
}

function BowlBaseSelector({
  currentBase,
  currentItemIngredient,
  availableBases,
  ingredients,
  localCustomizations,
  multiplierInputs,
  setMultiplierInputs,
  onSwap,
  onIngredientChange,
  getIngredientMultiplier,
  isIngredientRemoved,
}: BowlBaseSelectorProps) {
  const isRemoved = isIngredientRemoved(currentBase.id);
  const multiplier = getIngredientMultiplier(currentBase.id);
  const currentQuantity = currentItemIngredient.quantity_g * multiplier;
  const multiplierInput = multiplierInputs[currentBase.id] || multiplier.toString();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMultiplierInputs((prev) => ({
      ...prev,
      [currentBase.id]: inputValue,
    }));
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= 0.1) {
      const newQuantity = currentItemIngredient.quantity_g * value;
      onIngredientChange(currentBase.id, "modify", newQuantity);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0.1) {
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentBase.id]: "0.5",
      }));
      onIngredientChange(currentBase.id, "modify", currentItemIngredient.quantity_g * 0.5);
    } else if (value > 10) {
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentBase.id]: "10",
      }));
      onIngredientChange(currentBase.id, "modify", currentItemIngredient.quantity_g * 10);
    } else {
      const newQuantity = currentItemIngredient.quantity_g * value;
      onIngredientChange(currentBase.id, "modify", newQuantity);
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentBase.id]: value.toString(),
      }));
    }
  };

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
        Base
      </h3>
      
      {/* Current Base with Controls */}
      <IngredientControl
        ingredient={currentBase}
        baseQuantity={currentItemIngredient.quantity_g}
        currentQuantity={currentQuantity}
        multiplier={multiplier}
        multiplierInput={multiplierInput}
        isRemoved={isRemoved}
        onInputChange={handleInputChange}
        onInputBlur={handleInputBlur}
        onRemove={() => onIngredientChange(currentBase.id, "remove")}
        onRestore={() => onIngredientChange(currentBase.id, "modify", currentItemIngredient.quantity_g)}
      />
      
      {/* Available Alternatives */}
      {availableBases.length > 1 && (
        <div className="mt-3 sm:mt-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium">Switch to:</p>
          <div className="space-y-2 sm:space-y-3">
            {availableBases
              .filter((base) => base.id !== currentBase.id)
              .map((base) => {
                const altQuantity = currentItemIngredient.quantity_g * multiplier;
                const altCalories = (base.calories_per_100g * altQuantity) / 100;
                return (
                <button
                    key={base.id}
                    onClick={() => onSwap(currentBase.id, base.id, currentItemIngredient.quantity_g)}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-macscore-red hover:shadow-md transition-all w-full text-left touch-manipulation"
                  >
                    <AppImage
                      src={base.image_url}
                      alt={base.name}
                      width={40}
                      height={40}
                      className="rounded w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
                      objectFit="cover"
                      fallback={<div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-100 rounded text-lg sm:text-xl">🌾</div>}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                        {base.name.replace("(White)", "").replace("(Brown)", "").replace("(Black)", "").replace("(Pinto)", "").trim()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {altQuantity.toFixed(0)}g • {altCalories.toFixed(0)} cal
                      </p>
                    </div>
                </button>
                );
              })}
              </div>
        </div>
          )}
        </div>
  );
}

interface SandwichBreadSelectorProps {
  itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>;
  currentBread: Ingredient;
  currentItemIngredient: { ingredient_id: string; quantity_g: number };
  availableBreads: Ingredient[];
  ingredients: Ingredient[];
  localCustomizations: Customization[];
  multiplierInputs: Record<string, string>;
  setMultiplierInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSwap: (oldId: string, newId: string, baseQuantity: number) => void;
  onIngredientChange: (ingredientId: string, action: "add" | "remove" | "modify", value?: number) => void;
  getIngredientMultiplier: (ingredientId: string) => number;
  isIngredientRemoved: (ingredientId: string) => boolean;
}

function SandwichBreadSelector({
  currentBread,
  currentItemIngredient,
  availableBreads,
  ingredients,
  localCustomizations,
  multiplierInputs,
  setMultiplierInputs,
  onSwap,
  onIngredientChange,
  getIngredientMultiplier,
  isIngredientRemoved,
}: SandwichBreadSelectorProps) {
  const isRemoved = isIngredientRemoved(currentBread.id);
  const multiplier = getIngredientMultiplier(currentBread.id);
  const currentQuantity = currentItemIngredient.quantity_g * multiplier;
  const multiplierInput = multiplierInputs[currentBread.id] || multiplier.toString();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMultiplierInputs((prev) => ({
      ...prev,
      [currentBread.id]: inputValue,
    }));
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= 0.1) {
      const newQuantity = currentItemIngredient.quantity_g * value;
      onIngredientChange(currentBread.id, "modify", newQuantity);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0.1) {
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentBread.id]: "0.5",
      }));
      onIngredientChange(currentBread.id, "modify", currentItemIngredient.quantity_g * 0.5);
    } else if (value > 10) {
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentBread.id]: "10",
      }));
      onIngredientChange(currentBread.id, "modify", currentItemIngredient.quantity_g * 10);
    } else {
      const newQuantity = currentItemIngredient.quantity_g * value;
      onIngredientChange(currentBread.id, "modify", newQuantity);
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentBread.id]: value.toString(),
      }));
    }
  };

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
        Bread Type
      </h3>
      
      {/* Current Bread with Controls */}
      <IngredientControl
        ingredient={currentBread}
        baseQuantity={currentItemIngredient.quantity_g}
        currentQuantity={currentQuantity}
        multiplier={multiplier}
        multiplierInput={multiplierInput}
        isRemoved={isRemoved}
        onInputChange={handleInputChange}
        onInputBlur={handleInputBlur}
        onRemove={() => onIngredientChange(currentBread.id, "remove")}
        onRestore={() => onIngredientChange(currentBread.id, "modify", currentItemIngredient.quantity_g)}
      />
      
      {/* Available Alternatives */}
      {availableBreads.length > 1 && (
        <div className="mt-3 sm:mt-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium">Switch to:</p>
          <div className="space-y-2 sm:space-y-3">
            {availableBreads
              .filter((bread) => bread.id !== currentBread.id)
              .map((bread) => {
                const altQuantity = currentItemIngredient.quantity_g * multiplier;
                const altCalories = (bread.calories_per_100g * altQuantity) / 100;
                return (
                  <button
                    key={bread.id}
                    onClick={() => onSwap(currentBread.id, bread.id, currentItemIngredient.quantity_g)}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-macscore-red hover:shadow-md transition-all w-full text-left touch-manipulation"
                  >
                    <AppImage
                      src={bread.image_url}
                      alt={bread.name}
                      width={40}
                      height={40}
                      className="rounded w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
                      objectFit="cover"
                      fallback={<div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-100 rounded text-lg sm:text-xl">🥖</div>}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                        {bread.name.replace("Bun (", "").replace(")", "").trim()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {altQuantity.toFixed(0)}g • {altCalories.toFixed(0)} cal
                      </p>
      </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
