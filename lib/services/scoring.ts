import { NutritionData, ScoreProfile } from "@/types";

// Default score profile weights
const DEFAULT_WEIGHTS: ScoreProfile = {
  id: "default",
  name: "Default Profile",
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

// Reference values for normalization (based on typical daily values)
const REFERENCE_VALUES = {
  calories: 2000, // Daily calorie intake
  protein: 50, // grams (10% of calories)
  carbs: 250, // grams (50% of calories)
  fat: 65, // grams (30% of calories)
  sodium: 2300, // mg (FDA recommended max)
  fiber: 25, // grams (FDA recommended)
  sugar: 50, // grams (WHO recommended max)
};

// Per-serving reference values (for single meal scoring)
const MEAL_REFERENCE_VALUES = {
  calories: 667, // ~1/3 of daily
  protein: 17, // grams
  carbs: 83, // grams
  fat: 22, // grams
  sodium: 767, // mg
  fiber: 8, // grams
  sugar: 17, // grams
};

/**
 * Normalize a value to 0-100 scale
 * Lower is better for calories, carbs (high), fat (high), sodium, sugar
 * Higher is better for protein, fiber
 */
function normalizeValue(
  value: number,
  reference: number,
  higherIsBetter: boolean
): number {
  if (reference === 0) return 50; // Neutral score if no reference

  const ratio = value / reference;

  if (higherIsBetter) {
    // For protein and fiber: more is better
    // Score increases with ratio, capped at 100
    return Math.min(100, Math.max(0, ratio * 100));
  } else {
    // For calories, carbs, fat, sodium, sugar: less is better
    // Score decreases as ratio increases
    // At ratio 1.0 (reference), score is 50
    // At ratio 0 (no value), score is 100
    // At ratio 2.0 (double reference), score is 0
    if (ratio <= 0) return 100;
    if (ratio >= 2) return 0;
    return Math.max(0, Math.min(100, 100 - (ratio - 1) * 50));
  }
}

/**
 * Calculate health score for a nutrition profile
 */
export function calculateHealthScore(
  nutrition: NutritionData,
  profile: ScoreProfile = DEFAULT_WEIGHTS,
  useMealReference: boolean = true
): number {
  const reference = useMealReference
    ? MEAL_REFERENCE_VALUES
    : REFERENCE_VALUES;

  // Normalize each component
  const caloriesScore = normalizeValue(
    nutrition.calories,
    reference.calories,
    false
  );
  const proteinScore = normalizeValue(
    nutrition.protein,
    reference.protein,
    true
  );
  const carbsScore = normalizeValue(nutrition.carbs, reference.carbs, false);
  const fatScore = normalizeValue(nutrition.fat, reference.fat, false);
  const sodiumScore = normalizeValue(
    nutrition.sodium,
    reference.sodium,
    false
  );
  const fiberScore = normalizeValue(nutrition.fiber, reference.fiber, true);
  const sugarScore = normalizeValue(nutrition.sugar, reference.sugar, false);

  // Calculate weighted average
  const score =
    caloriesScore * profile.calories_weight +
    proteinScore * profile.protein_weight +
    carbsScore * profile.carbs_weight +
    fatScore * profile.fat_weight +
    sodiumScore * profile.sodium_weight +
    fiberScore * profile.fiber_weight +
    sugarScore * profile.sugar_weight;

  // Round to integer and ensure 0-100 range
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return "text-macscore-green";
  if (score >= 50) return "text-macscore-gold";
  return "text-macscore-red";
}

/**
 * Get score badge text
 */
export function getScoreBadge(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Very Poor";
}
