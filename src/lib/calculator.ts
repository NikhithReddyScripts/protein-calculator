/**
 * lib/calculator.ts
 *
 * All unit-conversion and calculation logic.
 * Phase 2 adds: volume units, count units, cross-category conversion, custom factor support.
 */

// ---------------------------------------------------------------------------
// Unit types
// ---------------------------------------------------------------------------

export type WeightUnit = "g" | "kg" | "oz" | "lb";
export type VolumeUnit = "ml" | "L" | "tsp" | "tbsp" | "cup";
export type CountUnit = "serving" | "piece" | "item";
export type Unit = WeightUnit | VolumeUnit | CountUnit;
export type UnitCategory = "weight" | "volume" | "count";

/**
 * Optional bridge between two incompatible unit categories.
 * Example: { fromUnit: "cup", toUnit: "g", value: 240 } → 1 cup = 240 g
 */
export interface CustomFactor {
  fromUnit: Unit;
  toUnit: Unit;
  value: number; // how many toUnit = 1 fromUnit
}

export interface CalculatorInputs {
  foodName: string;
  proteinG: number;       // grams of protein in the BASE serving
  caloriesKcal: number;   // kcal in the BASE serving
  baseAmount: number;
  baseUnit: Unit;
  targetAmount: number;
  targetUnit: Unit;
  customFactor?: CustomFactor | null;
}

export interface CalculatorResult {
  scaledProteinG: number;
  scaledCalories: number;
  scaledServingLabel: string;
  proteinPer100Cal: number;
  proteinCalPct: number;
  rating: Rating;
  interpretation: string;
}

/**
 * Result of comparing two foods.
 */
export interface ComparisonResult {
  winner: "A" | "B" | "Tie";
  diffPct: number; // protein efficiency difference percentage
  summary: string;
}

export type Rating = "Excellent" | "Very Good" | "Good" | "Moderate" | "Poor" | "Very Poor";

// ---------------------------------------------------------------------------
// Unit category lookup
// ---------------------------------------------------------------------------

const WEIGHT_UNITS = new Set<Unit>(["g", "kg", "oz", "lb"]);
const VOLUME_UNITS = new Set<Unit>(["ml", "L", "tsp", "tbsp", "cup"]);
const COUNT_UNITS = new Set<Unit>(["serving", "piece", "item"]);

export function getUnitCategory(unit: Unit): UnitCategory {
  if (WEIGHT_UNITS.has(unit)) return "weight";
  if (VOLUME_UNITS.has(unit)) return "volume";
  if (COUNT_UNITS.has(unit)) return "count";
  throw new Error(`Unknown unit: ${unit}`);
}

/** Friendly category name for error messages. */
export function categoryName(cat: UnitCategory): string {
  return cat === "weight" ? "weight (g/kg/oz/lb)"
       : cat === "volume" ? "volume (ml/L/tsp/tbsp/cup)"
       : "count (serving/piece/item)";
}

export const ALL_UNITS: { value: Unit; label: string; group: string }[] = [
  // Weight
  { value: "g",       label: "g — grams",       group: "Weight" },
  { value: "kg",      label: "kg — kilograms",   group: "Weight" },
  { value: "oz",      label: "oz — ounces",      group: "Weight" },
  { value: "lb",      label: "lb — pounds",      group: "Weight" },
  // Volume
  { value: "ml",      label: "ml — millilitres",  group: "Volume" },
  { value: "L",       label: "L — litres",         group: "Volume" },
  { value: "tsp",     label: "tsp — teaspoons",    group: "Volume" },
  { value: "tbsp",    label: "tbsp — tablespoons", group: "Volume" },
  { value: "cup",     label: "cup — cups",          group: "Volume" },
  // Count
  { value: "serving", label: "serving",  group: "Count" },
  { value: "piece",   label: "piece",    group: "Count" },
  { value: "item",    label: "item",     group: "Count" },
];

// ---------------------------------------------------------------------------
// Canonical conversion tables
// ---------------------------------------------------------------------------

/** Weight → grams */
const WEIGHT_TO_G: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

/** Volume → millilitres */
const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  L: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
};

/**
 * Converts any amount to its within-category canonical base.
 *   weight → grams
 *   volume → millilitres
 *   count  → count (no conversion; all count units are 1:1)
 */
export function toCanonical(amount: number, unit: Unit): number {
  const cat = getUnitCategory(unit);
  if (cat === "weight") return amount * WEIGHT_TO_G[unit as WeightUnit];
  if (cat === "volume") return amount * VOLUME_TO_ML[unit as VolumeUnit];
  return amount; // count
}

// ---------------------------------------------------------------------------
// Scale-factor resolution
// ---------------------------------------------------------------------------

/**
 * Computes the multiplier to scale nutrition info from the base serving to
 * the target serving.
 *
 * Returns a number (success) or a descriptive error string (failure).
 *
 * Algorithm:
 *   1. Same category → convert both to canonical, divide.
 *   2. Different category + custom factor that bridges them → normalise base
 *      into target category via the factor, then divide.
 *   3. Different category, no usable factor → descriptive error.
 *
 * Cross-category bridging (custom factor):
 *   cf says: 1 cf.fromUnit = cf.value cf.toUnit
 *
 *   Forward (base cat → target cat):
 *     baseInTargetCanon = canonical(base) / canonical(1, cf.fromUnit) × cf.value × canonical(1, cf.toUnit)
 *
 *   Reverse (cf goes target→base, use inverse):
 *     baseInTargetCanon = canonical(base) / canonical(1, cf.toUnit) / cf.value × canonical(1, cf.fromUnit)
 */
export function resolveScaleFactor(
  baseAmount: number,
  baseUnit: Unit,
  targetAmount: number,
  targetUnit: Unit,
  cf?: CustomFactor | null
): number | string {
  const baseCat = getUnitCategory(baseUnit);
  const targetCat = getUnitCategory(targetUnit);

  // ── Same category: straight canonical conversion ──────────────────────────
  if (baseCat === targetCat) {
    const baseCanon = toCanonical(baseAmount, baseUnit);
    const targetCanon = toCanonical(targetAmount, targetUnit);
    return targetCanon / baseCanon;
  }

  // ── Different category: need a custom factor ──────────────────────────────
  if (!cf) {
    return (
      `Cannot convert ${categoryName(baseCat)} to ${categoryName(targetCat)} directly. ` +
      `Add a custom conversion factor below (e.g. "1 cup = 240 g").`
    );
  }

  const cfFromCat = getUnitCategory(cf.fromUnit);
  const cfToCat = getUnitCategory(cf.toUnit);

  // Forward: cf bridges baseCat → targetCat
  if (cfFromCat === baseCat && cfToCat === targetCat) {
    // How many cf.fromUnits does the base correspond to?
    const baseInCfFrom = toCanonical(baseAmount, baseUnit) / toCanonical(1, cf.fromUnit);
    // Apply custom factor → now in cf.toUnit quantity
    const baseInCfTo = baseInCfFrom * cf.value;
    // Convert to target canonical
    const baseInTargetCanon = baseInCfTo * toCanonical(1, cf.toUnit);
    const targetCanon = toCanonical(targetAmount, targetUnit);
    return targetCanon / baseInTargetCanon;
  }

  // Reverse: cf bridges targetCat → baseCat (invert)
  if (cfFromCat === targetCat && cfToCat === baseCat) {
    // How many cf.toUnits does the base correspond to?
    const baseInCfTo = toCanonical(baseAmount, baseUnit) / toCanonical(1, cf.toUnit);
    // Invert cf: X cf.toUnit = X/value cf.fromUnits
    const baseInCfFrom = baseInCfTo / cf.value;
    // Convert to target canonical
    const baseInTargetCanon = baseInCfFrom * toCanonical(1, cf.fromUnit);
    const targetCanon = toCanonical(targetAmount, targetUnit);
    return targetCanon / baseInTargetCanon;
  }

  return (
    `Your custom conversion (${cf.fromUnit} → ${cf.toUnit}) doesn't bridge ` +
    `${categoryName(baseCat)} and ${categoryName(targetCat)}. ` +
    `Please update it to connect those two unit types.`
  );
}

// ---------------------------------------------------------------------------
// Main calculate function
// ---------------------------------------------------------------------------

export type CalculateReturn =
  | { ok: true; result: CalculatorResult }
  | { ok: false; error: string };

export function calculate(inputs: CalculatorInputs): CalculateReturn {
  const scaleOrError = resolveScaleFactor(
    inputs.baseAmount,
    inputs.baseUnit,
    inputs.targetAmount,
    inputs.targetUnit,
    inputs.customFactor
  );

  if (typeof scaleOrError === "string") {
    return { ok: false, error: scaleOrError };
  }

  const scale = scaleOrError;
  const scaledProteinG = inputs.proteinG * scale;
  const scaledCalories = inputs.caloriesKcal * scale;

  // Guard against bad values before computing ratios
  if (!isFinite(scaledCalories) || scaledCalories <= 0) {
    return { ok: false, error: "Calculation produced invalid calories. Check your inputs." };
  }
  if (!isFinite(scaledProteinG) || scaledProteinG < 0) {
    return { ok: false, error: "Calculation produced invalid protein. Check your inputs." };
  }

  const proteinPer100Cal = (scaledProteinG / scaledCalories) * 100;
  const proteinCalPct = ((scaledProteinG * 4) / scaledCalories) * 100; // Atwater: 4 kcal/g protein

  const rating = getRating(proteinPer100Cal);

  return {
    ok: true,
    result: {
      scaledProteinG,
      scaledCalories,
      scaledServingLabel: formatServing(inputs.targetAmount, inputs.targetUnit),
      proteinPer100Cal,
      proteinCalPct,
      rating,
      interpretation: getInterpretation(rating),
    },
  };
}

// ---------------------------------------------------------------------------
// Rating thresholds
// ---------------------------------------------------------------------------

export function getRating(proteinPer100Cal: number): Rating {
  if (proteinPer100Cal >= 10) return "Excellent";
  if (proteinPer100Cal >= 8)  return "Very Good";
  if (proteinPer100Cal >= 6)  return "Good";
  if (proteinPer100Cal >= 4)  return "Moderate";
  if (proteinPer100Cal >= 2)  return "Poor";
  return "Very Poor";
}

export function getInterpretation(rating: Rating): string {
  switch (rating) {
    case "Excellent":  return "This food is exceptionally protein-dense — a top-tier protein source.";
    case "Very Good":  return "This food is very protein-dense and an excellent source of protein.";
    case "Good":       return "This food is protein-dense and a solid source of protein.";
    case "Moderate":   return "This food is moderate in protein efficiency.";
    case "Poor":       return "This food provides low protein for its calories.";
    case "Very Poor":  return "This food provides very little protein relative to its calorie content.";
  }
}

/**
 * Compares two calculation results.
 */
export function compareResults(
  resA: CalculatorResult,
  nameA: string,
  resB: CalculatorResult,
  nameB: string
): ComparisonResult {
  const labelA = nameA.trim() || "Food A";
  const labelB = nameB.trim() || "Food B";

  const valA = resA.proteinPer100Cal;
  const valB = resB.proteinPer100Cal;

  if (Math.abs(valA - valB) < 0.05) {
    return {
      winner: "Tie",
      diffPct: 0,
      summary: `Both ${labelA} and ${labelB} have roughly the same protein efficiency.`,
    };
  }

  const winner = valA > valB ? "A" : "B";
  const winnerLabel = valA > valB ? labelA : labelB;
  const loserLabel = valA > valB ? labelB : labelA;
  
  const higher = Math.max(valA, valB);
  const lower = Math.min(valA, valB);
  const diffPct = ((higher - lower) / lower) * 100;

  return {
    winner,
    diffPct,
    summary: `${winnerLabel} is ${diffPct.toFixed(0)}% more protein-efficient than ${loserLabel}.`,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatServing(amount: number, unit: Unit): string {
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted} ${unit}`;
}

/** Rating → Tailwind colour tokens */
export function getRatingColor(rating: Rating): {
  text: string; bg: string; border: string; badge: string; hex: string;
} {
  switch (rating) {
    case "Excellent": return { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", badge: "bg-emerald-500", hex: "#10b981" };
    case "Very Good": return { text: "text-green-400",   bg: "bg-green-400/10",   border: "border-green-400/30",   badge: "bg-green-500",   hex: "#22c55e" };
    case "Good":      return { text: "text-teal-400",    bg: "bg-teal-400/10",    border: "border-teal-400/30",    badge: "bg-teal-500",    hex: "#14b8a6" };
    case "Moderate":  return { text: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/30",  badge: "bg-yellow-500",  hex: "#eab308" };
    case "Poor":      return { text: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-400/30",  badge: "bg-orange-500",  hex: "#f97316" };
    case "Very Poor": return { text: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/30",     badge: "bg-red-500",     hex: "#ef4444" };
  }
}
