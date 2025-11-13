"use client";

import React from "react";
import { Ingredient, Customization } from "@/types";
import { CustomizationCategory } from "@/lib/utils/customizationFlow";
import { IngredientControl, IngredientControlProps } from "./ItemCustomizer";
import { AppImage } from "@/components/ui/Image";
import { Button } from "@/components/ui/Button";

interface CategorySectionProps {
  category: CustomizationCategory;
  itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>;
  ingredients: Ingredient[];
  allIngredients: Ingredient[];
  localCustomizations: Customization[];
  multiplierInputs: Record<string, string>;
  setMultiplierInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onIngredientChange: (ingredientId: string, action: "add" | "remove" | "modify", value?: number) => void;
  onIngredientSwap: (oldId: string, newId: string, baseQuantity: number) => void;
  getIngredientMultiplier: (ingredientId: string) => number;
  isIngredientRemoved: (ingredientId: string) => boolean;
  getCurrentIngredient: (category: Ingredient[], itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>) => Ingredient | null;
}

export function CategorySection({
  category,
  itemIngredients,
  ingredients,
  allIngredients,
  localCustomizations,
  multiplierInputs,
  setMultiplierInputs,
  onIngredientChange,
  onIngredientSwap,
  getIngredientMultiplier,
  isIngredientRemoved,
  getCurrentIngredient,
}: CategorySectionProps) {
  // For single selection categories (crust, base, protein, bread)
  if (category.selectionType === "single") {
    const currentIngredient = getCurrentIngredient(category.ingredients, itemIngredients);
    const currentItemIngredient = currentIngredient
      ? itemIngredients.find((ii: { ingredient_id: string; quantity_g: number }) => {
          const swapped = localCustomizations.find(
            (c: Customization) => c.ingredient_id === currentIngredient.id && c.action === "add"
          );
          if (swapped) return false;
          return ii.ingredient_id === currentIngredient.id;
        }) || (currentIngredient ? { ingredient_id: currentIngredient.id, quantity_g: 80 } : null)
      : null;

    if (!currentIngredient || !currentItemIngredient) {
      // If no current ingredient, show first available
      if (category.ingredients.length === 0) return null;
      const firstIngredient = category.ingredients[0];
      return (
        <div className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0 last:pb-0">
          <div className="mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-800">{category.label}</h3>
            {category.description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{category.description}</p>
            )}
          </div>
          <SingleSelectionCategory
            category={category}
            currentIngredient={firstIngredient}
            currentItemIngredient={{ ingredient_id: firstIngredient.id, quantity_g: 80 }}
            itemIngredients={itemIngredients}
            ingredients={ingredients}
            localCustomizations={localCustomizations}
            multiplierInputs={multiplierInputs}
            setMultiplierInputs={setMultiplierInputs}
            onIngredientChange={onIngredientChange}
            onIngredientSwap={onIngredientSwap}
            getIngredientMultiplier={getIngredientMultiplier}
            isIngredientRemoved={isIngredientRemoved}
          />
        </div>
      );
    }

    return (
      <div className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0 last:pb-0">
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800">{category.label}</h3>
          {category.description && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{category.description}</p>
          )}
        </div>
        <SingleSelectionCategory
          category={category}
          currentIngredient={currentIngredient}
          currentItemIngredient={currentItemIngredient}
          itemIngredients={itemIngredients}
          ingredients={ingredients}
          localCustomizations={localCustomizations}
          multiplierInputs={multiplierInputs}
          setMultiplierInputs={setMultiplierInputs}
          onIngredientChange={onIngredientChange}
          onIngredientSwap={onIngredientSwap}
          getIngredientMultiplier={getIngredientMultiplier}
          isIngredientRemoved={isIngredientRemoved}
        />
      </div>
    );
  }

  // For multiple or quantity selection categories
  // For base/protein categories, show all available ingredients (not just ones in item)
  // This allows users to add multiple bases/proteins (half and half, extra protein)
  const isBaseOrProtein = category.id === "base" || category.id === "protein";
  
  // Get ingredients that are in the item
  const categoryItemIngredients = itemIngredients.filter((ii) =>
    category.ingredients.some((ing) => ing.id === ii.ingredient_id)
  );

  // For base/protein, also get ingredients that were added via customizations
  const addedIngredients = isBaseOrProtein
    ? localCustomizations
        .filter((c) => c.action === "add" && category.ingredients.some((ing) => ing.id === c.ingredient_id))
        .map((c) => ({
          ingredient_id: c.ingredient_id,
          quantity_g: c.quantity_g || 80, // Default quantity if not specified
        }))
    : [];

  // Combine item ingredients and added ingredients
  const allDisplayIngredients = [...categoryItemIngredients, ...addedIngredients];

  // For base/protein, show all available ingredients even if none are in the item
  if (!isBaseOrProtein && categoryItemIngredients.length === 0) return null;

  return (
    <div className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0 last:pb-0">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-800">{category.label}</h3>
        {category.description && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{category.description}</p>
        )}
      </div>
      <div className="space-y-2 sm:space-y-3">
        {/* Show existing ingredients (from item or added) */}
        {allDisplayIngredients.map((itemIngredient: { ingredient_id: string; quantity_g: number }) => {
          const ingredient = ingredients.find((ing) => ing.id === itemIngredient.ingredient_id);
          if (!ingredient) return null;

          // Check if this was added (not in original item)
          const wasAdded = localCustomizations.some(
            (c) => c.ingredient_id === itemIngredient.ingredient_id && c.action === "add"
          );
          const baseQuantity = wasAdded
            ? localCustomizations.find((c) => c.ingredient_id === itemIngredient.ingredient_id)?.quantity_g || itemIngredient.quantity_g
            : itemIngredient.quantity_g;

          const isRemoved = isIngredientRemoved(itemIngredient.ingredient_id);
          const multiplier = getIngredientMultiplier(itemIngredient.ingredient_id);
          const currentQuantity = baseQuantity * multiplier;
          const multiplierInput = multiplierInputs[itemIngredient.ingredient_id] || multiplier.toString();

          const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            setMultiplierInputs((prev) => ({
              ...prev,
              [itemIngredient.ingredient_id]: inputValue,
            }));
            const value = parseFloat(inputValue);
            if (!isNaN(value) && value >= 0.1) {
              if (wasAdded) {
                // For added ingredients, update the quantity_g directly
                onIngredientChange(itemIngredient.ingredient_id, "add", baseQuantity * value);
              } else {
                // For existing ingredients, modify the quantity
                const newQuantity = baseQuantity * value;
                onIngredientChange(itemIngredient.ingredient_id, "modify", newQuantity);
              }
            }
          };

          const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const value = parseFloat(e.target.value);
            if (isNaN(value) || value < 0.1) {
              setMultiplierInputs((prev) => ({
                ...prev,
                [itemIngredient.ingredient_id]: "0.5",
              }));
              if (wasAdded) {
                onIngredientChange(itemIngredient.ingredient_id, "add", baseQuantity * 0.5);
              } else {
                onIngredientChange(itemIngredient.ingredient_id, "modify", baseQuantity * 0.5);
              }
            } else if (value > 10) {
              setMultiplierInputs((prev) => ({
                ...prev,
                [itemIngredient.ingredient_id]: "10",
              }));
              if (wasAdded) {
                onIngredientChange(itemIngredient.ingredient_id, "add", baseQuantity * 10);
              } else {
                onIngredientChange(itemIngredient.ingredient_id, "modify", baseQuantity * 10);
              }
            } else {
              if (wasAdded) {
                onIngredientChange(itemIngredient.ingredient_id, "add", baseQuantity * value);
              } else {
                const newQuantity = baseQuantity * value;
                onIngredientChange(itemIngredient.ingredient_id, "modify", newQuantity);
              }
              setMultiplierInputs((prev) => ({
                ...prev,
                [itemIngredient.ingredient_id]: value.toString(),
              }));
            }
          };

          return (
            <IngredientControl
              key={itemIngredient.ingredient_id}
              ingredient={ingredient}
              baseQuantity={baseQuantity}
              currentQuantity={currentQuantity}
              multiplier={multiplier}
              multiplierInput={multiplierInput}
              isRemoved={isRemoved}
              onInputChange={handleInputChange}
              onInputBlur={handleInputBlur}
              onRemove={() => {
                if (wasAdded) {
                  // Remove added ingredient by filtering it out
                  onIngredientChange(itemIngredient.ingredient_id, "remove");
                } else {
                  // Remove existing ingredient
                  onIngredientChange(itemIngredient.ingredient_id, "remove");
                }
              }}
              onRestore={() => {
                if (wasAdded) {
                  // For added ingredients, restore to default quantity
                  onIngredientChange(itemIngredient.ingredient_id, "add", 80);
                } else {
                  // For existing ingredients, restore to original quantity
                  const originalItemIngredient = itemIngredients.find((ii) => ii.ingredient_id === itemIngredient.ingredient_id);
                  if (originalItemIngredient) {
                    onIngredientChange(itemIngredient.ingredient_id, "modify", originalItemIngredient.quantity_g);
                  }
                }
              }}
            />
          );
        })}
        
        {/* For base/protein categories, show available ingredients that can be added */}
        {isBaseOrProtein && (
          <>
            {category.ingredients
              .filter((ing) => !allDisplayIngredients.some((ii) => ii.ingredient_id === ing.id))
              .map((ingredient) => {
                const isAdded = localCustomizations.some(
                  (c) => c.ingredient_id === ingredient.id && c.action === "add"
                );
                if (isAdded) return null; // Already shown above

                return (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
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
                          {((ingredient.calories_per_100g * 80) / 100).toFixed(0)} cal (80g)
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onIngredientChange(ingredient.id, "add", 80)}
                      className="touch-manipulation min-h-[36px] sm:min-h-[32px] text-xs sm:text-sm px-3 sm:px-4"
                    >
                      Add
                    </Button>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </div>
  );
}

// Single Selection Category Component (for crust, base, protein, bread)
interface SingleSelectionCategoryProps {
  category: CustomizationCategory;
  currentIngredient: Ingredient;
  currentItemIngredient: { ingredient_id: string; quantity_g: number };
  itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>;
  ingredients: Ingredient[];
  localCustomizations: Customization[];
  multiplierInputs: Record<string, string>;
  setMultiplierInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onIngredientChange: (ingredientId: string, action: "add" | "remove" | "modify", value?: number) => void;
  onIngredientSwap: (oldId: string, newId: string, baseQuantity: number) => void;
  getIngredientMultiplier: (ingredientId: string) => number;
  isIngredientRemoved: (ingredientId: string) => boolean;
}

function SingleSelectionCategory({
  category,
  currentIngredient,
  currentItemIngredient,
  itemIngredients,
  ingredients,
  localCustomizations,
  multiplierInputs,
  setMultiplierInputs,
  onIngredientChange,
  onIngredientSwap,
  getIngredientMultiplier,
  isIngredientRemoved,
}: SingleSelectionCategoryProps) {
  const isRemoved = isIngredientRemoved(currentIngredient.id);
  const multiplier = getIngredientMultiplier(currentIngredient.id);
  const currentQuantity = currentItemIngredient.quantity_g * multiplier;
  const multiplierInput = multiplierInputs[currentIngredient.id] || multiplier.toString();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMultiplierInputs((prev) => ({
      ...prev,
      [currentIngredient.id]: inputValue,
    }));
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= 0.1) {
      const newQuantity = currentItemIngredient.quantity_g * value;
      onIngredientChange(currentIngredient.id, "modify", newQuantity);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0.1) {
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentIngredient.id]: "0.5",
      }));
      onIngredientChange(currentIngredient.id, "modify", currentItemIngredient.quantity_g * 0.5);
    } else if (value > 10) {
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentIngredient.id]: "10",
      }));
      onIngredientChange(currentIngredient.id, "modify", currentItemIngredient.quantity_g * 10);
    } else {
      const newQuantity = currentItemIngredient.quantity_g * value;
      onIngredientChange(currentIngredient.id, "modify", newQuantity);
      setMultiplierInputs((prev) => ({
        ...prev,
        [currentIngredient.id]: value.toString(),
      }));
    }
  };

  // Get available alternatives (all ingredients in category except current)
  const availableAlternatives = category.ingredients.filter(
    (ing) => ing.id !== currentIngredient.id
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Current Selection with Controls */}
      <IngredientControl
        ingredient={currentIngredient}
        baseQuantity={currentItemIngredient.quantity_g}
        currentQuantity={currentQuantity}
        multiplier={multiplier}
        multiplierInput={multiplierInput}
        isRemoved={isRemoved}
        onInputChange={handleInputChange}
        onInputBlur={handleInputBlur}
        onRemove={() => onIngredientChange(currentIngredient.id, "remove")}
        onRestore={() => onIngredientChange(currentIngredient.id, "modify", currentItemIngredient.quantity_g)}
      />

      {/* Available Alternatives */}
      {availableAlternatives.length > 0 && (
        <div>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium">Switch to:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {availableAlternatives.map((altIngredient) => {
              const altQuantity = currentItemIngredient.quantity_g * multiplier;
              const altCalories = (altIngredient.calories_per_100g * altQuantity) / 100;
              
              // Get display name based on category type
              let displayName = altIngredient.name;
              if (category.id === "crust") {
                displayName = altIngredient.name.replace("Pizza Crust (", "").replace(")", "");
              } else if (category.id === "bread") {
                displayName = altIngredient.name.replace("Bun (", "").replace(")", "").trim();
              } else if (category.id === "protein") {
                displayName = altIngredient.name.replace("(Chipotle)", "").replace("(Grilled)", "").trim();
              } else if (category.id === "base") {
                displayName = altIngredient.name
                  .replace("(White)", "")
                  .replace("(Brown)", "")
                  .replace("(Black)", "")
                  .replace("(Pinto)", "")
                  .trim();
              }

              return (
                <button
                  key={altIngredient.id}
                  onClick={() => onIngredientSwap(currentIngredient.id, altIngredient.id, currentItemIngredient.quantity_g)}
                  className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg hover:border-macscore-red hover:shadow-md transition-all w-full text-left touch-manipulation bg-white"
                >
                  <AppImage
                    src={altIngredient.image_url}
                    alt={altIngredient.name}
                    width={40}
                    height={40}
                    className="rounded w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
                    objectFit="cover"
                    fallback={
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-100 rounded text-lg sm:text-xl">
                        {category.id === "crust" ? "🍕" : category.id === "bread" ? "🥖" : category.id === "protein" ? "🍗" : category.id === "base" ? "🌾" : "🥬"}
                      </div>
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                      {displayName}
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

