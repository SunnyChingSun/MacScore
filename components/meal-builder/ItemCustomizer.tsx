"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/uiStore";
import { useCustomizationStore } from "@/lib/store/customizationStore";
import { useMealStore } from "@/lib/store/mealStore";
import { Item, Ingredient, Customization, NutritionData, MealItem } from "@/types";
import { ScoreMeter } from "@/components/score-display/ScoreMeter";
import { NutritionBars } from "@/components/score-display/NutritionBars";
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

export function ItemCustomizer() {
  const { activeItemId, closeCustomizer } = useUIStore();
  const { getCustomizations, setCustomizations } = useCustomizationStore();
  const { addItem, updateItem, items } = useMealStore();

  const [localCustomizations, setLocalCustomizations] = useState<Customization[]>([]);

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
      const existingMealItem = items.find((i) => i.item_id === activeItemId);
      if (existingMealItem) {
        // Load customizations from meal item (even if empty array)
        setLocalCustomizations(existingMealItem.customizations || []);
        // Also save to customization store
        setCustomizations(activeItemId, existingMealItem.customizations || []);
      } else {
        // Load from customization store (for items not yet in meal)
        const saved = getCustomizations(activeItemId);
        setLocalCustomizations(saved || []);
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

  // If no ingredients, show a message with option to add without customization
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

        // Add to meal
        const mealItem: MealItem = {
          id: `meal-${Date.now()}-${item.id}`,
          item_id: item.id,
          item,
          customizations: [],
          nutrition: {
            calories: item.base_calories,
            protein: item.base_protein,
            carbs: item.base_carbs,
            fat: item.base_fat,
            sodium: item.base_sodium,
            fiber: item.base_fiber,
            sugar: item.base_sugar,
          },
          score: scoreData.score,
        };

        addItem(mealItem);
        closeCustomizer();
      } catch (error) {
        console.error("Error adding item to meal:", error);
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
          <button
            onClick={closeCustomizer}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          This item doesn&apos;t have ingredient details available for customization.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={closeCustomizer}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddWithoutCustomization}>
            Add to Meal
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
    // Update or add to meal
    const existingMealItem = items.find((i) => i.item_id === activeItemId);
    if (existingMealItem) {
      // Update existing meal item
      updateItem(existingMealItem.id, {
        customizations: localCustomizations,
        nutrition: data.nutrition,
        score: data.score,
      });
    } else {
      // Add new meal item
      const mealItem: MealItem = {
        id: `meal-${Date.now()}`,
        item_id: activeItemId,
        item,
        customizations: localCustomizations,
        nutrition: data.nutrition,
        score: data.score,
      };
      addItem(mealItem);
    }

    closeCustomizer();
  };

  // Check if we're editing an existing meal item
  const existingMealItem = items.find((i) => i.item_id === activeItemId);
  const isEditing = !!existingMealItem;

  const nutrition = customizeMutation.data?.nutrition || {
    calories: item.base_calories,
    protein: item.base_protein,
    carbs: item.base_carbs,
    fat: item.base_fat,
    sodium: item.base_sodium,
    fiber: item.base_fiber,
    sugar: item.base_sugar,
  };

  const score = customizeMutation.data?.score || 50;
  const isCalculating = customizeMutation.isPending;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200 gap-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Item Image */}
          <div className="flex-shrink-0">
            <AppImage
              src={item.image_url}
              alt={item.name}
              width={120}
              height={120}
              className="rounded-lg shadow-md"
              fallback={<div className="w-[120px] h-[120px] flex items-center justify-center bg-gray-100 rounded-lg text-5xl">🍔</div>}
            />
          </div>
          {/* Item Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={closeCustomizer}
          className="text-gray-500 hover:text-gray-700 text-2xl font-light flex-shrink-0"
          aria-label="Close customizer"
        >
          ×
        </button>
      </div>

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left side - Ingredients Customization */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Customize Ingredients</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
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

        {/* Right side - Score and Nutrition (Real-time updates) */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Health Score</h3>
            <div className="flex justify-center">
              <ScoreMeter score={score} size="lg" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Nutrition</h3>
            {isCalculating && (
              <div className="text-sm text-gray-500 mb-2">Calculating...</div>
            )}
            <NutritionBars nutrition={nutrition} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
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
      <div className="border-t border-gray-200 pt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={closeCustomizer}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAddToMeal}
          disabled={isCalculating}
          className="ml-auto"
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
    if (customization?.action === "remove") return 0;
    if (customization?.action === "modify" && customization.multiplier !== undefined) {
      return customization.multiplier;
    }
    return 1.0; // Default to 1.0 (100%)
  });

  const isRemoved = customization?.action === "remove" || multiplier === 0;

  // Update multiplier when customization changes externally
  useEffect(() => {
    if (customization?.action === "remove") {
      setMultiplier(0);
    } else if (customization?.action === "modify" && customization.multiplier !== undefined) {
      setMultiplier(customization.multiplier);
    } else if (!customization) {
      setMultiplier(1.0);
    }
  }, [customization]);

  const handleMultiplierChange = (newValue: number) => {
    // Clamp value between 0 and 3.0
    const clampedValue = Math.max(0, Math.min(3.0, newValue));
    // Round to nearest 0.5
    const roundedValue = Math.round(clampedValue * 2) / 2;
    setMultiplier(roundedValue);
    
    if (roundedValue === 0) {
      onRemove();
    } else if (roundedValue === 1.0) {
      // If back to 1.0, remove modification (use default)
      onModify(roundedValue);
    } else {
      onModify(roundedValue);
    }
  };

  const handleDecrease = () => {
    const newValue = multiplier - 0.5;
    handleMultiplierChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = multiplier + 0.5;
    handleMultiplierChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      handleMultiplierChange(value);
    }
  };

  const handleInputBlur = () => {
    // Ensure value is properly rounded on blur
    handleMultiplierChange(multiplier);
  };

  return (
    <div
      className={`p-3 border rounded-lg ${
        isRemoved ? "bg-gray-100 opacity-50" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800">{ingredient.name}</h4>
          <p className="text-xs text-gray-500">
            {ingredient.calories_per_100g.toFixed(0)} kcal/100g
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isRemoved ? (
            <>
              {/* Multiplier Control */}
              <div className="flex items-center gap-1 border rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={handleDecrease}
                  disabled={multiplier <= 0}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-r"
                  aria-label="Decrease"
                >
                  ←
                </button>
                <input
                  type="number"
                  min="0"
                  max="3"
                  step="0.5"
                  value={multiplier.toFixed(1)}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className="w-16 px-2 py-1 text-center text-sm border-0 focus:outline-none focus:ring-2 focus:ring-macscore-red rounded"
                  style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
                />
                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={multiplier >= 3.0}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-l"
                  aria-label="Increase"
                >
                  →
                </button>
              </div>
              <Button variant="ghost" size="sm" onClick={onRemove}>
                Remove
              </Button>
            </>
          ) : (
            <Button variant="success" size="sm" onClick={() => {
              setMultiplier(1.0);
              // Remove the "remove" customization and restore to default (1.0)
              onModify(1.0);
            }}>
              Add Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
