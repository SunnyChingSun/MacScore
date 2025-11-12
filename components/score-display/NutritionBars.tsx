"use client";

import React from "react";
import { NutritionData } from "@/types";
import { cn } from "@/lib/utils";

interface NutritionBarsProps {
  nutrition: NutritionData;
  className?: string;
}

export function NutritionBars({ nutrition, className }: NutritionBarsProps) {
  // Reference values for 100% (based on meal reference values)
  const references = {
    calories: 667,
    protein: 17,
    carbs: 83,
    fat: 22,
    sodium: 767,
    fiber: 8,
    sugar: 17,
  };

  const nutrients = [
    {
      label: "Calories",
      value: nutrition.calories,
      max: references.calories,
      unit: "kcal",
      color: "bg-macscore-red",
      higherIsBetter: false,
    },
    {
      label: "Protein",
      value: nutrition.protein,
      max: references.protein,
      unit: "g",
      color: "bg-macscore-green",
      higherIsBetter: true,
    },
    {
      label: "Carbs",
      value: nutrition.carbs,
      max: references.carbs,
      unit: "g",
      color: "bg-macscore-gold",
      higherIsBetter: false,
    },
    {
      label: "Fat",
      value: nutrition.fat,
      max: references.fat,
      unit: "g",
      color: "bg-orange-500",
      higherIsBetter: false,
    },
    {
      label: "Sodium",
      value: nutrition.sodium,
      max: references.sodium,
      unit: "mg",
      color: "bg-purple-500",
      higherIsBetter: false,
    },
    {
      label: "Fiber",
      value: nutrition.fiber,
      max: references.fiber,
      unit: "g",
      color: "bg-macscore-green",
      higherIsBetter: true,
    },
    {
      label: "Sugar",
      value: nutrition.sugar,
      max: references.sugar,
      unit: "g",
      color: "bg-pink-500",
      higherIsBetter: false,
    },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {nutrients.map((nutrient) => {
        const percentage = Math.min(100, (nutrient.value / nutrient.max) * 100);
        const isOver = nutrient.value > nutrient.max && !nutrient.higherIsBetter;

        return (
          <div key={nutrient.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{nutrient.label}</span>
              <span
                className={cn(
                  "font-semibold",
                  isOver ? "text-macscore-red" : "text-gray-900"
                )}
              >
                {nutrient.value.toFixed(1)} {nutrient.unit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={cn(
                  "h-2.5 rounded-full transition-all duration-500 ease-out",
                  nutrient.color,
                  isOver && "bg-macscore-red"
                )}
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
