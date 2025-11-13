"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/uiStore";
import { useCustomizationStore } from "@/lib/store/customizationStore";
import { useMealStore } from "@/lib/store/mealStore";
import { Item, Ingredient, Customization, NutritionData, MealItem } from "@/types";
import { ScoreMeter } from "@/components/score-display/ScoreMeter";
import { NutritionBars } from "@/components/score-display/NutritionBars";
import { MacronutrientPieChart } from "@/components/score-display/MacronutrientPieChart";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { AppImage } from "@/components/ui/Image";

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
  // Convert to string and remove trailing zeros, but keep at least one decimal place if it's a decimal
  const str = value.toString();
  // If it has a decimal point, remove trailing zeros
  if (str.includes('.')) {
    return str.replace(/\.?0+$/, '');
  }
  return str;
}

export function ItemCustomizer() {
  const { activeItemId, closeCustomizer } = useUIStore();
  const { getCustomizations, setCustomizations } = useCustomizationStore();
  const { addItem, updateItem, items } = useMealStore();

  const [localCustomizations, setLocalCustomizations] = useState<Customization[]>([]);
  const [quantity, setQuantity] = useState<number>(1.0);
  const [quantityInput, setQuantityInput] = useState<string>("1");

  const { data: itemData, isLoading, error } = useQuery({
    queryKey: ["item", activeItemId],
    queryFn: () => getItemDetails(activeItemId!),
    enabled: !!activeItemId,
  });

  const customizeMutation = useMutation({
    mutationFn: (customizations: Customization[]) =>
      customizeItem(activeItemId!, customizations),
  });

  // Load saved customizations when item changes
  // If item is already in meal tray, load its customizations
  useEffect(() => {
    if (activeItemId) {
      // Check if this item is already in the meal tray
      const existingMealItem = items.find((i: MealItem) => i.item_id === activeItemId);
      if (existingMealItem) {
        // Load customizations from meal item (even if empty array)
        setLocalCustomizations(existingMealItem.customizations || []);
        // Load quantity (default to 1.0 if not set)
        const loadedQuantity = existingMealItem.quantity || 1.0;
        setQuantity(loadedQuantity);
        setQuantityInput(formatQuantity(loadedQuantity));
        // Also save to customization store
        setCustomizations(activeItemId, existingMealItem.customizations || []);
      } else {
        // Load from customization store (for items not yet in meal)
        const saved = getCustomizations(activeItemId);
        setLocalCustomizations(saved || []);
        setQuantity(1.0); // Reset quantity to default
        setQuantityInput("1");
      }
    }
  }, [activeItemId, getCustomizations, setCustomizations, items]);

  // Recalculate nutrition whenever customizations change (real-time updates)
  useEffect(() => {
    if (itemData?.item && activeItemId) {
      // Debounce the mutation to avoid too many API calls
      const timeoutId = setTimeout(() => {
        customizeMutation.mutate(localCustomizations);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCustomizations, itemData?.item?.id, activeItemId]);

  // If no item selected, don't show customizer
  if (!activeItemId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading item details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
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
  if (!itemData) {
    return null;
  }

  const item: Item = itemData.item;
  const ingredients: Ingredient[] = itemData.ingredients || [];

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

        // Check if item already exists in meal
        const existingMealItem = items.find((i: MealItem) => i.item_id === item.id);
        if (existingMealItem) {
          // Update existing meal item
          updateItem(existingMealItem.id, {
            customizations: [],
            nutrition: adjustedNutrition,
            score: scoreData.score,
            quantity: quantity,
          });
        } else {
        // Add to meal
        const mealItem: MealItem = {
          id: `meal-${Date.now()}-${item.id}`,
          item_id: item.id,
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

    // Calculate nutrition with quantity multiplier for display
    const displayNutrition: NutritionData = {
      calories: item.base_calories * quantity,
      protein: item.base_protein * quantity,
      carbs: item.base_carbs * quantity,
      fat: item.base_fat * quantity,
      sodium: item.base_sodium * quantity,
      fiber: item.base_fiber * quantity,
      sugar: item.base_sugar * quantity,
    };

    // Get score (we'll use a default or calculate it)
    const baseScore = 50; // Default score for items without ingredients customization

    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-20 lg:top-8 z-30">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 pb-4 border-b border-gray-200 gap-3 sm:gap-4 relative">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full min-w-0">
          {/* Item Image */}
          <div className="flex-shrink-0">
            <AppImage
              src={item.image_url}
              alt={item.name}
              width={120}
              height={120}
              className="rounded-lg shadow-md w-20 h-20 sm:w-24 sm:h-24 lg:w-[120px] lg:h-[120px]"
              objectFit="cover"
              fallback={<div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-[120px] lg:h-[120px] flex items-center justify-center bg-gray-100 rounded-lg text-3xl sm:text-4xl lg:text-5xl">🍔</div>}
            />
          </div>
          {/* Item Info */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{item.name}</h2>
              {item.description && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1.5 hidden sm:block line-clamp-2">{item.description}</p>
              )}
            </div>
              {/* Quantity Input and Score */}
              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                {/* Quantity Input */}
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
                {/* Health Score Circle */}
                <div className="flex-shrink-0">
                  <ScoreMeter score={baseScore} size="sm" showLabel={false} />
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={closeCustomizer}
            className="text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl font-light flex-shrink-0 absolute top-0 right-0 sm:relative sm:top-0 sm:right-0 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close customizer"
          >
            ×
          </button>
        </div>

        {/* Nutrition Display */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Nutrition</h3>
          {/* Macronutrient Pie Chart */}
          <div className="mb-3 sm:mb-4">
            <MacronutrientPieChart nutrition={displayNutrition} />
          </div>
          <NutritionBars nutrition={displayNutrition} />
          <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Calories:</span>
              <span className="font-semibold">{displayNutrition.calories.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Protein:</span>
              <span className="font-semibold">{displayNutrition.protein.toFixed(1)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Carbs:</span>
              <span className="font-semibold">{displayNutrition.carbs.toFixed(1)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fat:</span>
              <span className="font-semibold">{displayNutrition.fat.toFixed(1)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sodium:</span>
              <span className="font-semibold">{displayNutrition.sodium.toFixed(0)}mg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fiber:</span>
              <span className="font-semibold">{displayNutrition.fiber.toFixed(1)}g</span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
          This item doesn&apos;t have ingredient details available for customization.
        </p>

        {/* Footer - Add Button */}
        <div className="border-t border-gray-200 pt-3 sm:pt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <Button 
            variant="ghost" 
            onClick={closeCustomizer}
            className="w-full sm:w-auto touch-manipulation min-h-[44px]"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddWithoutCustomization}
            className="w-full sm:w-auto touch-manipulation min-h-[44px]"
          >
            {items.find((i: MealItem) => i.item_id === item.id) ? "Save Changes" : "Add to Meal"}
          </Button>
        </div>
      </div>
    );
  }

  const handleAddIngredient = (ingredientId: string) => {
    const customization: Customization = {
      ingredient_id: ingredientId,
      action: "add",
      quantity_g: 50, // Default 50g
    };
    setLocalCustomizations([...localCustomizations, customization]);
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    // Remove any existing modifications for this ingredient
    const filtered = localCustomizations.filter(
      (c) => !(c.ingredient_id === ingredientId && c.action === "modify")
    );
    const customization: Customization = {
      ingredient_id: ingredientId,
      action: "remove",
    };
    setLocalCustomizations([...filtered, customization]);
  };

  const handleModifyIngredient = (ingredientId: string, multiplier: number) => {
    // Remove existing modification or remove action if any
    const filtered = localCustomizations.filter(
      (c) => !(c.ingredient_id === ingredientId && (c.action === "modify" || c.action === "remove"))
    );
    
    // If multiplier is 1.0, don't add a customization (use default)
    if (multiplier === 1.0) {
      setLocalCustomizations(filtered);
      return;
    }
    
    const customization: Customization = {
      ingredient_id: ingredientId,
      action: "modify",
      multiplier,
    };
    setLocalCustomizations([...filtered, customization]);
  };

  const handleAddToMeal = async () => {
    if (!customizeMutation.data) {
      // If nutrition hasn't been calculated yet, calculate it first
      customizeMutation.mutate(localCustomizations, {
        onSuccess: (data) => {
          setCustomizations(activeItemId, localCustomizations);
          addItemToMeal(data);
        },
      });
      return;
    }

    setCustomizations(activeItemId, localCustomizations);
    addItemToMeal(customizeMutation.data);
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

  // Calculate base nutrition
  const baseNutrition = customizeMutation.data?.nutrition || {
    calories: item.base_calories,
    protein: item.base_protein,
    carbs: item.base_carbs,
    fat: item.base_fat,
    sodium: item.base_sodium,
    fiber: item.base_fiber,
    sugar: item.base_sugar,
  };

  // Apply quantity multiplier to display nutrition
  const nutrition: NutritionData = {
    calories: baseNutrition.calories * quantity,
    protein: baseNutrition.protein * quantity,
    carbs: baseNutrition.carbs * quantity,
    fat: baseNutrition.fat * quantity,
    sodium: baseNutrition.sodium * quantity,
    fiber: baseNutrition.fiber * quantity,
    sugar: baseNutrition.sugar * quantity,
  };

  const score = customizeMutation.data?.score || 50;
  const isCalculating = customizeMutation.isPending;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-20 lg:top-8 z-30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 pb-4 border-b border-gray-200 gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full min-w-0">
          {/* Item Image */}
          <div className="flex-shrink-0">
            <AppImage
              src={item.image_url}
              alt={item.name}
              width={120}
              height={120}
              className="rounded-lg shadow-md w-20 h-20 sm:w-24 sm:h-24 lg:w-[120px] lg:h-[120px]"
              objectFit="cover"
              fallback={<div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-[120px] lg:h-[120px] flex items-center justify-center bg-gray-100 rounded-lg text-3xl sm:text-4xl lg:text-5xl">🍔</div>}
            />
          </div>
          {/* Item Info */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{item.name}</h2>
              {item.description && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1.5 hidden sm:block line-clamp-2">{item.description}</p>
              )}
            </div>
            {/* Quantity Input and Score - Stack on mobile, side by side on larger screens */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              {/* Quantity Input */}
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
              {/* Health Score Circle */}
              <div className="flex-shrink-0">
                <ScoreMeter score={score} size="sm" showLabel={false} />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={closeCustomizer}
          className="text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl font-light flex-shrink-0 absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close customizer"
        >
          ×
        </button>
      </div>

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Left side - Ingredients Customization */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Customize Ingredients</h3>
          <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto pr-2">
            {ingredients.map((ingredient) => (
              <IngredientControl
                key={ingredient.id}
                ingredient={ingredient}
                customization={localCustomizations.find(
                  (c) => c.ingredient_id === ingredient.id
                )}
                onAdd={() => handleAddIngredient(ingredient.id)}
                onRemove={() => handleRemoveIngredient(ingredient.id)}
                onModify={(multiplier) =>
                  handleModifyIngredient(ingredient.id, multiplier)
                }
              />
            ))}
          </div>
        </div>

        {/* Right side - Nutrition (Real-time updates) */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Nutrition</h3>
            {isCalculating && (
              <div className="text-xs sm:text-sm text-gray-500 mb-2">Calculating...</div>
            )}
            {/* Macronutrient Pie Chart */}
            <div className="mb-3 sm:mb-4">
              <MacronutrientPieChart nutrition={nutrition} />
            </div>
            <NutritionBars nutrition={nutrition} />
            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Calories:</span>
                <span className="font-semibold">{nutrition.calories.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Protein:</span>
                <span className="font-semibold">{nutrition.protein.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Carbs:</span>
                <span className="font-semibold">{nutrition.carbs.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fat:</span>
                <span className="font-semibold">{nutrition.fat.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sodium:</span>
                <span className="font-semibold">{nutrition.sodium.toFixed(0)}mg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fiber:</span>
                <span className="font-semibold">{nutrition.fiber.toFixed(1)}g</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Add Button at Bottom Right */}
      <div className="border-t border-gray-200 pt-3 sm:pt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
        <Button 
          variant="ghost" 
          onClick={closeCustomizer}
          className="w-full sm:w-auto touch-manipulation min-h-[44px]"
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAddToMeal}
          disabled={isCalculating}
          className="w-full sm:w-auto sm:ml-auto touch-manipulation min-h-[44px]"
        >
          {isCalculating ? "Calculating..." : isEditing ? "Save Changes" : "Add to Meal"}
        </Button>
      </div>
    </div>
  );
}

function IngredientControl({
  ingredient,
  customization,
  onAdd,
  onRemove,
  onModify,
}: {
  ingredient: Ingredient;
  customization?: Customization;
  onAdd: () => void;
  onRemove: () => void;
  onModify: (multiplier: number) => void;
}) {
  const [multiplier, setMultiplier] = useState<number>(() => {
    if (customization?.action === "remove") return 0.1;
    if (customization?.action === "modify" && customization.multiplier !== undefined) {
      return customization.multiplier;
    }
    return 1.0; // Default to 1.0 (100%)
  });
  const [multiplierInput, setMultiplierInput] = useState<string>(() => {
    if (customization?.action === "remove") return "0.1";
    if (customization?.action === "modify" && customization.multiplier !== undefined) {
      return customization.multiplier.toString();
    }
    return "1.0";
  });

  const isRemoved = customization?.action === "remove";

  // Update multiplier when customization changes externally
  useEffect(() => {
    if (customization?.action === "remove") {
      setMultiplier(0.1);
      setMultiplierInput("0.1");
    } else if (customization?.action === "modify" && customization.multiplier !== undefined) {
      setMultiplier(customization.multiplier);
      setMultiplierInput(customization.multiplier.toString());
    } else if (!customization) {
      setMultiplier(1.0);
      setMultiplierInput("1.0");
    }
  }, [customization]);

  const handleMultiplierChange = (newValue: number) => {
    // Clamp value between 0.1 and 10.0
    const clampedValue = Math.max(0.1, Math.min(10.0, newValue));
    setMultiplier(clampedValue);
    setMultiplierInput(clampedValue.toString());
    
    // Always modify (even if 1.0) to ensure the customization is tracked
    onModify(clampedValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow empty input or decimal point while typing
    if (inputValue === '' || inputValue === '.') {
      setMultiplierInput(inputValue);
      return;
    }
    
    const value = parseFloat(inputValue);
    // Allow values from 0.1 to 10, even though min="0.5" for arrows
    if (!isNaN(value)) {
      if (value >= 0.1 && value <= 10.0) {
        setMultiplierInput(inputValue);
        setMultiplier(value);
      } else if (value < 0.1) {
        // Allow typing below 0.5, but update state to track it
        setMultiplierInput(inputValue);
        setMultiplier(0.1); // Keep internal state at minimum
      }
    } else {
      setMultiplierInput(inputValue);
    }
  };

  const handleInputBlur = () => {
    const value = parseFloat(multiplierInput);
    if (isNaN(value) || value < 0.1) {
      // Round up to minimum 0.1
      handleMultiplierChange(0.1);
    } else if (value > 10) {
      handleMultiplierChange(10);
    } else {
      // Accept any value from 0.1 to 10, even if below 0.5
      handleMultiplierChange(value);
    }
  };

  return (
    <div
      className={`p-2.5 sm:p-3 border rounded-lg ${
        isRemoved ? "bg-gray-100 opacity-50" : "bg-white"
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
          {/* Ingredient Image */}
          <div className="flex-shrink-0">
            <AppImage
              src={ingredient.image_url}
              alt={ingredient.name}
              width={48}
              height={48}
              className="rounded-lg w-12 h-12 sm:w-14 sm:h-14"
              objectFit="cover"
              fallback={<div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-gray-100 rounded-lg text-lg sm:text-xl">🥗</div>}
            />
          </div>
          {/* Ingredient Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate mb-0.5">{ingredient.name}</h4>
            <p className="text-xs text-gray-500">
              {ingredient.calories_per_100g.toFixed(0)} kcal/100g
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
          {!isRemoved ? (
            <>
              {/* Multiplier Control */}
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={multiplierInput}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-18 sm:w-20 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-macscore-red focus:border-transparent touch-manipulation"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRemove}
                className="touch-manipulation min-h-[36px] sm:min-h-[32px] text-xs sm:text-sm px-2 sm:px-3"
              >
                Remove
              </Button>
            </>
          ) : (
            <Button 
              variant="success" 
              size="sm" 
              onClick={() => {
                // Restore to default (1.0) by calling onModify
                handleMultiplierChange(1.0);
              }}
              className="touch-manipulation min-h-[36px] sm:min-h-[32px] text-xs sm:text-sm px-2 sm:px-3"
            >
              Add Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
