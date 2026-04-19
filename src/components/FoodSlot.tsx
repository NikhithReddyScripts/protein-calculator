"use client";

import { useState } from "react";
import InputField from "./InputField";
import SelectField from "./SelectField";
import {
  ALL_UNITS,
  getUnitCategory,
  getRatingColor,
  type CalculatorResult,
  type Unit,
  type CustomFactor,
} from "@/lib/calculator";
import { validateForm, hasErrors, type FormValues, type FormErrors } from "@/lib/validation";
import { apiCalculate } from "@/lib/api";

const UNIT_OPTIONS = ALL_UNITS.map((u) => ({ value: u.value, label: u.label, group: u.group }));

const INITIAL: FormValues = {
  foodName: "",
  protein: "",
  calories: "",
  baseAmount: "",
  baseUnit: "g",
  targetAmount: "100",
  targetUnit: "g",
  cfEnabled: false,
  cfFromUnit: "",
  cfToUnit: "",
  cfValue: "",
};

interface FoodSlotProps {
  /** "Food A" or "Food B" */
  label: string;
  accentColor: string; // Tailwind text class e.g. "text-indigo-400"
  /** Called whenever a result is successfully calculated or cleared */
  onResult: (result: CalculatorResult | null, foodName: string) => void;
}

/**
 * FoodSlot — a compact, self-contained calculator card for use in compare mode.
 * Manages its own form state and reports results upward via onResult.
 */
export default function FoodSlot({ label, accentColor, onResult }: FoodSlotProps) {
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const baseCat = values.baseUnit ? getUnitCategory(values.baseUnit as Unit) : null;
  const targetCat = values.targetUnit ? getUnitCategory(values.targetUnit as Unit) : null;
  const categoriesMismatch = baseCat && targetCat && baseCat !== targetCat;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    const updated = { ...values, [name]: checked !== undefined ? checked : value };
    setValues(updated);
    if (submitted) setErrors(validateForm(updated));
    if (["baseUnit", "targetUnit"].includes(name)) setConversionError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setConversionError(null);

    const formErrors = validateForm(values);
    setErrors(formErrors);
    if (hasErrors(formErrors)) return;

    setIsLoading(true);

    const cf: CustomFactor | null = values.cfEnabled && values.cfFromUnit && values.cfToUnit && values.cfValue
      ? { fromUnit: values.cfFromUnit as Unit, toUnit: values.cfToUnit as Unit, value: parseFloat(values.cfValue) }
      : null;

    try {
      const outcome = await apiCalculate({
        foodName: values.foodName,
        proteinG: parseFloat(values.protein),
        caloriesKcal: parseFloat(values.calories),
        baseAmount: parseFloat(values.baseAmount),
        baseUnit: values.baseUnit as Unit,
        targetAmount: parseFloat(values.targetAmount),
        targetUnit: values.targetUnit as Unit,
        customFactor: cf,
      });

      setResult(outcome);
      onResult(outcome, values.foodName);
    } catch (err: any) {
      setConversionError(err.message || "API Error");
      setResult(null);
      onResult(null, values.foodName);
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setValues(INITIAL);
    setErrors({});
    setResult(null);
    setConversionError(null);
    setSubmitted(false);
    onResult(null, "");
  }

  const ratingColors = result ? getRatingColor(result.rating) : null;

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden h-full">
      {/* Slot header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02] flex items-center gap-3">
        <span className={`text-sm font-bold ${accentColor}`}>{label}</span>
        <input
          name="foodName"
          value={values.foodName}
          onChange={handleChange}
          placeholder="Food name (optional)"
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none"
          aria-label={`${label} food name`}
        />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 px-5 py-5 flex-1">
        {/* Protein + Calories */}
        <div className="grid grid-cols-2 gap-3">
          <InputField id={`${label}-protein`} name="protein" label="Protein *" placeholder="g" type="number" inputMode="decimal" min="0" step="any" value={values.protein} onChange={handleChange} error={errors.protein} />
          <InputField id={`${label}-calories`} name="calories" label="Calories *" placeholder="kcal" type="number" inputMode="decimal" min="0.01" step="any" value={values.calories} onChange={handleChange} error={errors.calories} />
        </div>

        {/* Base serving */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1.5">Base serving *</p>
          <div className="grid grid-cols-2 gap-2">
            <InputField id={`${label}-baseAmount`} name="baseAmount" label="" aria-label="Base amount" placeholder="e.g. 100" type="number" inputMode="decimal" min="0.01" step="any" value={values.baseAmount} onChange={handleChange} error={errors.baseAmount} />
            <SelectField id={`${label}-baseUnit`} name="baseUnit" label="" aria-label="Base unit" options={UNIT_OPTIONS} value={values.baseUnit} onChange={handleChange} error={errors.baseUnit} />
          </div>
        </div>

        {/* Target serving */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1.5">Target serving *</p>
          <div className="grid grid-cols-2 gap-2">
            <InputField id={`${label}-targetAmount`} name="targetAmount" label="" aria-label="Target amount" placeholder="e.g. 200" type="number" inputMode="decimal" min="0.01" step="any" value={values.targetAmount} onChange={handleChange} error={errors.targetAmount} />
            <SelectField id={`${label}-targetUnit`} name="targetUnit" label="" aria-label="Target unit" options={UNIT_OPTIONS} value={values.targetUnit} onChange={handleChange} error={errors.targetUnit} />
          </div>
        </div>

        {/* Cross-category warning */}
        {categoriesMismatch && !values.cfEnabled && (
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            ⚠ Incompatible unit types. Enable custom conversion below.
          </p>
        )}

        {/* Custom conversion toggle */}
        <div className="flex items-center gap-2.5">
          <label htmlFor={`${label}-cfEnabled`} className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" id={`${label}-cfEnabled`} name="cfEnabled" checked={values.cfEnabled} onChange={handleChange} className="sr-only" />
              <div className={`w-7 h-4 rounded-full transition-colors duration-200 ${values.cfEnabled ? "bg-indigo-500" : "bg-white/10 border border-white/20"}`} />
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${values.cfEnabled ? "translate-x-3" : "translate-x-0"}`} />
            </div>
            <span className="text-xs text-slate-500">Custom conversion</span>
          </label>
        </div>

        {/* Custom conversion inputs */}
        {values.cfEnabled && (
          <div className="flex items-center gap-2 flex-wrap rounded-xl bg-white/[0.02] border border-white/[0.06] px-3 py-3">
            <span className="text-xs text-slate-500">1</span>
            <div className="flex-1 min-w-[7rem]">
              <SelectField id={`${label}-cfFromUnit`} name="cfFromUnit" label="" aria-label="CF source unit" options={UNIT_OPTIONS} value={values.cfFromUnit} onChange={handleChange} error={errors.cfFromUnit} />
            </div>
            <span className="text-xs text-slate-500">=</span>
            <div className="w-20">
              <InputField id={`${label}-cfValue`} name="cfValue" label="" aria-label="CF value" placeholder="240" type="number" inputMode="decimal" min="0.001" step="any" value={values.cfValue} onChange={handleChange} error={errors.cfValue} />
            </div>
            <div className="flex-1 min-w-[7rem]">
              <SelectField id={`${label}-cfToUnit`} name="cfToUnit" label="" aria-label="CF target unit" options={UNIT_OPTIONS} value={values.cfToUnit} onChange={handleChange} error={errors.cfToUnit} />
            </div>
          </div>
        )}

        {/* Conversion error */}
        {conversionError && (
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            ⚠ {conversionError}
          </p>
        )}

        {/* Calculate button */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
          >
            {isLoading ? "..." : `Calculate ${label}`}
          </button>
          {result && (
            <button type="button" onClick={handleReset} className="py-2.5 px-3 rounded-xl text-xs text-slate-400 border border-white/10 hover:border-white/20 transition-colors">
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Mini result */}
      {result && ratingColors && (
        <div className={`px-5 py-4 border-t border-white/10 ${ratingColors.bg} flex items-center justify-between`}>
          <div>
            <p className={`text-sm font-bold tabular-nums ${ratingColors.text}`}>
              {result.proteinPer100Cal.toFixed(1)}
              <span className="text-xs font-normal ml-1">g / 100 kcal</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Per {result.scaledServingLabel}: {result.scaledProteinG.toFixed(1)}g protein
            </p>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${ratingColors.text} ${ratingColors.bg} ${ratingColors.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ratingColors.badge}`} />
            {result.rating}
          </div>
        </div>
      )}
    </div>
  );
}
