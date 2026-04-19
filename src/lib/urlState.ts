/**
 * lib/urlState.ts
 *
 * Encodes/decodes calculator form state to/from URL query params.
 * Short keys keep the URL readable.
 *
 *   n   = food name       pr  = protein       ca  = calories
 *   ba  = base amount     bu  = base unit      ta  = target amount
 *   tu  = target unit     cfe = CF enabled     cfu = CF from unit
 *   ctu = CF to unit      cfv = CF value
 */

import type { FormValues } from "./validation";

const K = {
  foodName:   "n",
  protein:    "pr",
  calories:   "ca",
  baseAmount: "ba",
  baseUnit:   "bu",
  targetAmount: "ta",
  targetUnit: "tu",
  cfEnabled:  "cfe",
  cfFromUnit: "cfu",
  cfToUnit:   "ctu",
  cfValue:    "cfv",
} as const;

export function encodeFormToURL(v: FormValues): string {
  const p = new URLSearchParams();
  if (v.foodName)    p.set(K.foodName,   v.foodName);
  if (v.protein)     p.set(K.protein,    v.protein);
  if (v.calories)    p.set(K.calories,   v.calories);
  if (v.baseAmount)  p.set(K.baseAmount, v.baseAmount);
  if (v.baseUnit)    p.set(K.baseUnit,   v.baseUnit);
  if (v.targetAmount) p.set(K.targetAmount, v.targetAmount);
  if (v.targetUnit)  p.set(K.targetUnit, v.targetUnit);
  if (v.cfEnabled) {
    p.set(K.cfEnabled, "1");
    if (v.cfFromUnit) p.set(K.cfFromUnit, v.cfFromUnit);
    if (v.cfToUnit)   p.set(K.cfToUnit,   v.cfToUnit);
    if (v.cfValue)    p.set(K.cfValue,    v.cfValue);
  }
  return p.toString();
}

/** Returns a partial FormValues — only fields actually present in the URL. */
export function decodeURLToForm(search: string): Partial<FormValues> | null {
  const p = new URLSearchParams(search);
  // If no recognised key is present there's nothing to load
  if (!p.has(K.protein) && !p.has(K.calories) && !p.has(K.foodName)) return null;

  return {
    foodName:     p.get(K.foodName)    ?? "",
    protein:      p.get(K.protein)     ?? "",
    calories:     p.get(K.calories)    ?? "",
    baseAmount:   p.get(K.baseAmount)  ?? "",
    baseUnit:     p.get(K.baseUnit)    ?? "g",
    targetAmount: p.get(K.targetAmount) ?? "100",
    targetUnit:   p.get(K.targetUnit)  ?? "g",
    cfEnabled:    p.get(K.cfEnabled)   === "1",
    cfFromUnit:   p.get(K.cfFromUnit)  ?? "",
    cfToUnit:     p.get(K.cfToUnit)    ?? "",
    cfValue:      p.get(K.cfValue)     ?? "",
  };
}

/** Pushes form state into the browser's URL bar without a page reload. */
export function pushFormToURL(v: FormValues): void {
  if (typeof window === "undefined") return;
  const qs = encodeFormToURL(v);
  const url = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  window.history.replaceState({}, "", url);
}

/** Builds a shareable absolute URL for the current state. */
export function buildShareURL(v: FormValues): string {
  if (typeof window === "undefined") return "";
  const qs = encodeFormToURL(v);
  return qs
    ? `${window.location.origin}${window.location.pathname}?${qs}`
    : window.location.href;
}

/** Formats a short text summary for clipboard copy. */
export function buildResultSummary(
  result: { proteinPer100Cal: number; proteinCalPct: number; scaledServingLabel: string; scaledProteinG: number; scaledCalories: number; rating: string },
  foodName: string
): string {
  const label = foodName.trim() || "This food";
  return (
    `${label}: ${result.proteinPer100Cal.toFixed(1)}g protein per 100 kcal` +
    ` (${result.rating})` +
    ` · Per ${result.scaledServingLabel}: ${result.scaledProteinG.toFixed(1)}g protein, ${Math.round(result.scaledCalories)} kcal` +
    ` · ${result.proteinCalPct.toFixed(1)}% protein calories`
  );
}
