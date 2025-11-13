"use client";

import React from "react";
import { useMealStore } from "@/lib/store/mealStore";
import { useUIStore } from "@/lib/store/uiStore";
import { ScoreMeter } from "@/components/score-display/ScoreMeter";
import { NutritionBars } from "@/components/score-display/NutritionBars";
import { MacronutrientPieChart } from "@/components/score-display/MacronutrientPieChart";
import { Badges } from "@/components/score-display/Badges";
import { Button } from "@/components/ui/Button";
import { MealItem } from "@/types";
import { AppImage } from "@/components/ui/Image";

export function MealTray() {
  const { items, removeItem, clearMeal, getTotalNutrition, getTotalScore } =
    useMealStore();
  const { activeItemId } = useUIStore();

  const totalNutrition = getTotalNutrition();
  const totalScore = getTotalScore();

  // If an item is selected, show a message instead of meal tray
  if (activeItemId) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🍔</div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
          Your meal tray is empty
        </h3>
        <p className="text-sm sm:text-base text-gray-500">
          Click on an item to customize and add it to your meal
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Meal Summary
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              {items.length} item{items.length !== 1 ? "s" : ""} in your meal
            </p>
            <Badges nutrition={totalNutrition} />
          </div>
          <div className="flex-shrink-0">
            <ScoreMeter score={totalScore} size="lg" />
          </div>
        </div>
      </div>

      {/* Nutrition Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
          Nutrition Breakdown
        </h3>
        {/* Macronutrient Pie Chart */}
        <div className="mb-4 sm:mb-6">
          <MacronutrientPieChart nutrition={totalNutrition} />
        </div>
        <NutritionBars nutrition={totalNutrition} />
      </div>

      {/* Meal Items */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">Items</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearMeal}
            className="touch-manipulation min-h-[36px] sm:min-h-[32px] text-xs sm:text-sm"
          >
            Clear All
          </Button>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {items.map((item: MealItem) => (
            <MealItemCard key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MealItemCard({
  item,
  onRemove,
}: {
  item: MealItem;
  onRemove: (id: string) => void;
}) {
  const { openCustomizer } = useUIStore();

  const handleEdit = () => {
    openCustomizer(item.item_id);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      {/* Item Image */}
      <div className="flex-shrink-0">
        <AppImage
          src={item.item.image_url}
          alt={item.item.name}
          width={80}
          height={80}
          className="rounded-lg w-16 h-16 sm:w-20 sm:h-20"
          objectFit="cover"
          fallback={<div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-gray-100 rounded-lg text-2xl sm:text-3xl">🍔</div>}
        />
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0 w-full sm:w-auto">
        <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate mb-0.5">{item.item.name}</h4>
        <p className="text-xs sm:text-sm text-gray-500">
          {item.nutrition.calories.toFixed(0)} kcal • Score: {item.score}
          {item.quantity && item.quantity !== 1 && (
            <span className="ml-1 sm:ml-2">• Qty: {item.quantity.toFixed(item.quantity % 1 === 0 ? 0 : 1)}x</span>
          )}
        </p>
        {item.customizations.length > 0 && (
          <p className="text-xs text-macscore-gold mt-1">
            {item.customizations.length} customization
            {item.customizations.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleEdit}
          className="touch-manipulation min-h-[36px] sm:min-h-[32px] text-xs sm:text-sm px-3 sm:px-4 flex-1 sm:flex-initial"
        >
          Edit
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(item.id)}
          className="touch-manipulation min-h-[36px] sm:min-h-[32px] text-xs sm:text-sm px-3 sm:px-4 flex-1 sm:flex-initial"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
