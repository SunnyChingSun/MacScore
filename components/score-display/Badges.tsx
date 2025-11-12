"use client";

import React from "react";
import { NutritionData } from "@/types";
import { cn } from "@/lib/utils";

interface BadgesProps {
  nutrition: NutritionData;
  className?: string;
}

export function Badges({ nutrition, className }: BadgesProps) {
  const badges: string[] = [];

  // High protein (>= 20g)
  if (nutrition.protein >= 20) {
    badges.push("High Protein");
  }

  // Low sodium (< 500mg)
  if (nutrition.sodium < 500) {
    badges.push("Low Sodium");
  }

  // High fiber (>= 5g)
  if (nutrition.fiber >= 5) {
    badges.push("High Fiber");
  }

  // Low sugar (< 10g)
  if (nutrition.sugar < 10) {
    badges.push("Low Sugar");
  }

  // Low calorie (< 400kcal)
  if (nutrition.calories < 400) {
    badges.push("Low Calorie");
  }

  // Balanced (moderate everything)
  if (
    nutrition.calories >= 400 &&
    nutrition.calories <= 600 &&
    nutrition.protein >= 15 &&
    nutrition.sodium < 800
  ) {
    badges.push("Balanced");
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((badge) => (
        <span
          key={badge}
          className="px-3 py-1 text-xs font-medium rounded-full bg-macscore-green/10 text-macscore-green border border-macscore-green/20"
        >
          {badge}
        </span>
      ))}
    </div>
  );
}
