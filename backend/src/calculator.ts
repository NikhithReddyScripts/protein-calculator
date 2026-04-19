/**
 * backend/src/calculator.ts
 *
 * All unit-conversion and calculation logic, ported for the backend.
 * Uses snake_case for output as requested for the API.
 */

export type WeightUnit = "g" | "kg" | "oz" | "lb";
export type VolumeUnit = "ml" | "L" | "tsp" | "tbsp" | "cup";
export type CountUnit = "serving" | "piece" | "item";
export type Unit = WeightUnit | VolumeUnit | CountUnit;
export type UnitCategory = "weight" | "volume" | "count";

export interface CustomFactor {
  from_unit: Unit;
  to_unit: Unit;
  value: number;
}

export interface CalculatorInputs {
  food_name: string;
  protein_g: number;
  calories: number;
  base_serving_size: number;
  base_serving_unit: Unit;
  target_serving_size: number;
  target_serving_unit: Unit;
  custom_conversion?: CustomFactor | null;
}

export interface CalculatorResult {
  scaled_protein_g: number;
  scaled_calories: number;
  protein_per_100_calories: number;
  protein_calorie_percent: number;
  rating: string;
  scale_position: number;
  interpretation_text: string;
  scaled_serving_label: string;
}

const WEIGHT_UNITS = new Set<Unit>(["g", "kg", "oz", "lb"]);
const VOLUME_UNITS = new Set<Unit>(["ml", "L", "tsp", "tbsp", "cup"]);

function getUnitCategory(unit: Unit): UnitCategory {
  if (WEIGHT_UNITS.has(unit)) return "weight";
  if (VOLUME_UNITS.has(unit)) return "volume";
  return "count";
}

const WEIGHT_TO_G: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  L: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
};

function toCanonical(amount: number, unit: Unit): number {
  const cat = getUnitCategory(unit);
  if (cat === "weight") return amount * WEIGHT_TO_G[unit as WeightUnit];
  if (cat === "volume") return amount * VOLUME_TO_ML[unit as VolumeUnit];
  return amount;
}

function resolveScaleFactor(
  baseAmount: number,
  baseUnit: Unit,
  targetAmount: number,
  targetUnit: Unit,
  cf?: CustomFactor | null
): number {
  const baseCat = getUnitCategory(baseUnit);
  const targetCat = getUnitCategory(targetUnit);

  if (baseCat === targetCat) {
    return toCanonical(targetAmount, targetUnit) / toCanonical(baseAmount, baseUnit);
  }

  if (!cf) {
    throw new Error(`Incompatible units: ${baseUnit} to ${targetUnit}. Custom conversion required.`);
  }

  const cfFromCat = getUnitCategory(cf.from_unit);
  const cfToCat = getUnitCategory(cf.to_unit);

  if (cfFromCat === baseCat && cfToCat === targetCat) {
    const baseInCfFrom = toCanonical(baseAmount, baseUnit) / toCanonical(1, cf.from_unit);
    const baseInTarget = baseInCfFrom * cf.value * toCanonical(1, cf.to_unit);
    return toCanonical(targetAmount, targetUnit) / baseInTarget;
  }

  if (cfFromCat === targetCat && cfToCat === baseCat) {
    const baseInCfTo = toCanonical(baseAmount, baseUnit) / toCanonical(1, cf.to_unit);
    const baseInTarget = (baseInCfTo / cf.value) * toCanonical(1, cf.from_unit);
    return toCanonical(targetAmount, targetUnit) / baseInTarget;
  }

  throw new Error(`Provided custom conversion doesn't bridge ${baseUnit} and ${targetUnit}.`);
}

function getRating(density: number) {
  if (density >= 10) return { label: "Excellent", pos: 0.95 };
  if (density >= 8)  return { label: "Very Good", pos: 0.85 };
  if (density >= 6)  return { label: "Good",      pos: 0.65 };
  if (density >= 4)  return { label: "Moderate",  pos: 0.45 };
  if (density >= 2)  return { label: "Poor",      pos: 0.25 };
  return { label: "Very Poor", pos: 0.1 };
}

function getInterpretation(label: string): string {
  switch (label) {
    case "Excellent": return "This food is exceptionally protein-dense — a top-tier protein source.";
    case "Very Good": return "This food is very protein-dense and an excellent source of protein.";
    case "Good":      return "This food is protein-dense and a solid source of protein.";
    case "Moderate":  return "This food is moderate in protein efficiency.";
    case "Poor":      return "This food provides low protein for its calories.";
    default:          return "This food provides very little protein relative to its calorie content.";
  }
}

export function performCalculation(inputs: CalculatorInputs): CalculatorResult {
  const scale = resolveScaleFactor(
    inputs.base_serving_size,
    inputs.base_serving_unit,
    inputs.target_serving_size,
    inputs.target_serving_unit,
    inputs.custom_conversion
  );

  const scaled_protein_g = inputs.protein_g * scale;
  const scaled_calories = inputs.calories * scale;

  if (!isFinite(scaled_calories) || scaled_calories <= 0) {
    throw new Error("Invalid calculation results. Please check your inputs.");
  }

  const protein_per_100_calories = (scaled_protein_g / scaled_calories) * 100;
  const protein_calorie_percent = ((scaled_protein_g * 4) / scaled_calories) * 100;

  const { label, pos } = getRating(protein_per_100_calories);

  return {
    scaled_protein_g: Number(scaled_protein_g.toFixed(2)),
    scaled_calories: Number(scaled_calories.toFixed(2)),
    protein_per_100_calories: Number(protein_per_100_calories.toFixed(2)),
    protein_calorie_percent: Number(protein_calorie_percent.toFixed(2)),
    rating: label,
    scale_position: pos,
    interpretation_text: getInterpretation(label),
    scaled_serving_label: `${inputs.target_serving_size} ${inputs.target_serving_unit}`,
  };
}
