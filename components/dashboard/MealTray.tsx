"use client";

import React from "react";
import { useMealStore } from "@/lib/store/mealStore";
import { useUIStore } from "@/lib/store/uiStore";
import { ScoreMeter } from "@/components/score-display/ScoreMeter";
import { NutritionBars } from "@/components/score-display/NutritionBars";
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
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-6xl mb-4">🍔</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Your meal tray is empty
        </h3>
        <p className="text-gray-500">
          Click on an item to customize and add it to your meal
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Meal Summary
            </h2>
            <p className="text-gray-600 mb-4">
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Nutrition Breakdown
        </h3>
        <NutritionBars nutrition={totalNutrition} />
      </div>

      {/* Meal Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Items</h3>
          <Button variant="ghost" size="sm" onClick={clearMeal}>
            Clear All
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
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
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      {/* Item Image */}
      <div className="flex-shrink-0">
        <AppImage
          src={item.item.image_url}
          alt={item.item.name}
          width={80}
          height={80}
          className="rounded-lg"
          fallback={<div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg text-3xl">🍔</div>}
        />
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-800">{item.item.name}</h4>
        <p className="text-sm text-gray-500">
          {item.nutrition.calories.toFixed(0)} kcal • Score: {item.score}
        </p>
        {item.customizations.length > 0 && (
          <p className="text-xs text-macscore-gold mt-1">
            {item.customizations.length} customization
            {item.customizations.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-shrink-0">
        <Button variant="secondary" size="sm" onClick={handleEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)}>
          Remove
        </Button>
      </div>
    </div>
  );
}
