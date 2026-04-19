"use client";

import { useEffect, useState, useRef } from "react";
import InputField from "./InputField";
import SelectField from "./SelectField";
import ResultsCard from "./ResultsCard";
import CompareView from "./CompareView";
import CopyButton from "./CopyButton";
import {
  calculate,
  ALL_UNITS,
  getUnitCategory,
  type CalculatorResult,
  type Unit,
  type CustomFactor,
} from "@/lib/calculator";
import { validateForm, hasErrors, type FormValues, type FormErrors } from "@/lib/validation";
import { decodeURLToForm, pushFormToURL, buildShareURL } from "@/lib/urlState";
import { apiCalculate } from "@/lib/api";

// Build grouped option lists from the shared ALL_UNITS constant
const UNIT_OPTIONS = ALL_UNITS.map((u) => ({ value: u.value, label: u.label, group: u.group }));

const INITIAL_VALUES: FormValues = {
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

// ─── Small helper: section header ─────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

// ─── Inline warning/info banner ───────────────────────────────────────────
function Banner({ type, message }: { type: "warning" | "info"; message: string }) {
  const styles =
    type === "warning"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
  const icon = type === "warning" ? "⚠" : "ℹ";
  return (
    <div className={`flex gap-2 items-start px-4 py-3 rounded-xl border text-xs leading-relaxed ${styles}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{message}</span>
    </div>
  );
}

/**
 * CalculatorForm — Phase 2
 * Grouped UI, expanded unit support, optional custom conversion factor,
 * and clear incompatibility warnings.
 */
export default function CalculatorForm() {
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialMount = useRef(true);

  // ── URL Persistence: Load ──────────────────────────────────────────────
  useEffect(() => {
    const params = window.location.search;
    if (params) {
      const decoded = decodeURLToForm(params);
      if (decoded) {
        setValues((prev) => ({ ...prev, ...decoded }));
        // If we have enough data to calculate, do it automatically for convenience
        if (decoded.protein && decoded.calories && decoded.baseAmount) {
          // We can't easily trigger the submit logic here without refactor, 
          // let's just wait for user to hit calculate or do it if it looks valid
        }
        
        // Check for mode in URL
        const p = new URLSearchParams(params);
        if (p.get("m") === "c") setMode("compare");
      }
    }
    isInitialMount.current = false;
  }, []);

  // ── URL Persistence: Sync (Live) ───────────────────────────────────────
  useEffect(() => {
    if (isInitialMount.current) return;
    if (mode === "single") {
      pushFormToURL(values);
    } else {
      // For compare mode, we just want to save the mode in URL
      const url = new URL(window.location.href);
      url.searchParams.set("m", "c");
      window.history.replaceState({}, "", url.toString());
    }
  }, [values, mode]);

  // ── Cross-category compatibility check (live, no submit needed) ──────────
  const baseCat = values.baseUnit ? getUnitCategory(values.baseUnit as Unit) : null;
  const targetCat = values.targetUnit ? getUnitCategory(values.targetUnit as Unit) : null;
  const categoriesMismatch = baseCat && targetCat && baseCat !== targetCat;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    const updated = { ...values, [name]: checked !== undefined ? checked : value };
    setValues(updated);
    if (submitted) {
      setErrors(validateForm(updated));
    }
    // Clear conversion error when user changes serving fields
    if (["baseAmount", "baseUnit", "targetAmount", "targetUnit", "cfEnabled", "cfFromUnit", "cfToUnit", "cfValue"].includes(name)) {
      setConversionError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setConversionError(null);

    const formErrors = validateForm(values);
    setErrors(formErrors);
    if (hasErrors(formErrors)) return;

    setIsLoading(true);

    // Build optional custom factor
    const customFactor: CustomFactor | null =
      values.cfEnabled && values.cfFromUnit && values.cfToUnit && values.cfValue
        ? {
            fromUnit: values.cfFromUnit as Unit,
            toUnit: values.cfToUnit as Unit,
            value: parseFloat(values.cfValue),
          }
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
        customFactor,
      });

      setResult(outcome);
    } catch (err: any) {
      setConversionError(err.message || "Failed to communicate with the calculation service.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setValues(INITIAL_VALUES);
    setErrors({});
    setResult(null);
    setConversionError(null);
    setSubmitted(false);
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      {/* ── Mode Toggle ── */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-white/[0.03] border border-white/10 rounded-xl">
          <button
            onClick={() => setMode("single")}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === "single"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Single Calculator
          </button>
          <button
            onClick={() => setMode("compare")}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === "compare"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Compare Foods
          </button>
        </div>
      </div>

      {mode === "compare" ? (
        <CompareView />
      ) : (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
          {/* ═══════════════════════════════════════════════════════════════════
              INPUT CARD
          ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Calculator inputs"
        className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
      >
        {/* Card header */}
        <div className="px-6 py-5 border-b border-white/10 bg-indigo-600/5">
          <h1 className="text-lg font-semibold text-slate-100">Protein Density Calculator</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Enter any food's nutrition info to calculate its protein efficiency
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-6 flex flex-col gap-6">

          {/* ── Section 1: Nutrition info ──────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <SectionLabel>Nutrition Info</SectionLabel>

            <InputField
              id="foodName"
              name="foodName"
              label="Food name (optional)"
              placeholder="e.g. Chicken breast, Greek yogurt…"
              type="text"
              value={values.foodName}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                id="protein"
                name="protein"
                label="Protein *"
                placeholder="e.g. 25"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={values.protein}
                onChange={handleChange}
                error={errors.protein}
                hint="Grams of protein in the base serving"
              />
              <InputField
                id="calories"
                name="calories"
                label="Calories *"
                placeholder="e.g. 165"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={values.calories}
                onChange={handleChange}
                error={errors.calories}
                hint="kcal in the base serving"
              />
            </div>
          </div>

          {/* ── Section 2: Serving conversion ─────────────────────────── */}
          <div className="flex flex-col gap-4">
            <SectionLabel>Serving Conversion</SectionLabel>

            {/* Base serving */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">
                Base serving size *
                <span className="ml-2 text-xs font-normal text-slate-500">
                  (as printed on the nutrition label)
                </span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="baseAmount"
                  name="baseAmount"
                  label=""
                  aria-label="Base serving amount"
                  placeholder="e.g. 100"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="any"
                  value={values.baseAmount}
                  onChange={handleChange}
                  error={errors.baseAmount}
                />
                <SelectField
                  id="baseUnit"
                  name="baseUnit"
                  label=""
                  aria-label="Base serving unit"
                  options={UNIT_OPTIONS}
                  value={values.baseUnit}
                  onChange={handleChange}
                  error={errors.baseUnit}
                />
              </div>
            </div>

            {/* Target serving */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">
                Target serving size *
                <span className="ml-2 text-xs font-normal text-slate-500">
                  (the portion you actually eat)
                </span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="targetAmount"
                  name="targetAmount"
                  label=""
                  aria-label="Target serving amount"
                  placeholder="e.g. 200"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="any"
                  value={values.targetAmount}
                  onChange={handleChange}
                  error={errors.targetAmount}
                />
                <SelectField
                  id="targetUnit"
                  name="targetUnit"
                  label=""
                  aria-label="Target serving unit"
                  options={UNIT_OPTIONS}
                  value={values.targetUnit}
                  onChange={handleChange}
                  error={errors.targetUnit}
                />
              </div>
            </div>

            {/* Live cross-category mismatch hint */}
            {categoriesMismatch && !values.cfEnabled && (
              <Banner
                type="warning"
                message={`Weight and volume units cannot be converted directly — their relationship depends on the food's density. Enable "Custom Conversion" below to define the bridge (e.g. 1 cup = 240 g).`}
              />
            )}
          </div>

          {/* ── Section 3: Custom conversion factor (optional) ─────────── */}
          <div className="flex flex-col gap-4">
            {/* Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <label
                htmlFor="cfEnabled"
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                {/* Custom checkbox */}
                <div className="relative">
                  <input
                    type="checkbox"
                    id="cfEnabled"
                    name="cfEnabled"
                    checked={values.cfEnabled}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={[
                      "w-9 h-5 rounded-full transition-colors duration-200",
                      values.cfEnabled ? "bg-indigo-500" : "bg-white/10 border border-white/20",
                    ].join(" ")}
                  />
                  <div
                    className={[
                      "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                      values.cfEnabled ? "translate-x-4" : "translate-x-0",
                    ].join(" ")}
                  />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  Custom Conversion
                </span>
              </label>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {values.cfEnabled && (
              <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
                <Banner
                  type="info"
                  message={`Define how units in different categories relate for this specific food. Example: if 1 cup of this food weighs 240 g, enter "1 cup = 240 g".`}
                />

                {/* "1 [fromUnit] = [value] [toUnit]" row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-400 whitespace-nowrap">1</span>
                  <div className="flex-1 min-w-[8rem]">
                    <SelectField
                      id="cfFromUnit"
                      name="cfFromUnit"
                      label=""
                      aria-label="Custom factor source unit"
                      options={UNIT_OPTIONS}
                      value={values.cfFromUnit}
                      onChange={handleChange}
                      error={errors.cfFromUnit}
                    />
                  </div>
                  <span className="text-sm text-slate-400 whitespace-nowrap">=</span>
                  <div className="w-24">
                    <InputField
                      id="cfValue"
                      name="cfValue"
                      label=""
                      aria-label="Custom factor value"
                      placeholder="e.g. 240"
                      type="number"
                      inputMode="decimal"
                      min="0.001"
                      step="any"
                      value={values.cfValue}
                      onChange={handleChange}
                      error={errors.cfValue}
                    />
                  </div>
                  <div className="flex-1 min-w-[8rem]">
                    <SelectField
                      id="cfToUnit"
                      name="cfToUnit"
                      label=""
                      aria-label="Custom factor target unit"
                      options={UNIT_OPTIONS}
                      value={values.cfToUnit}
                      onChange={handleChange}
                      error={errors.cfToUnit}
                    />
                  </div>
                </div>

                {errors.cfGeneral && (
                  <p role="alert" className="text-xs text-amber-400 flex items-center gap-1">
                    <span aria-hidden="true">⚠</span> {errors.cfGeneral}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Conversion error from calculation ──────────────────────── */}
          {conversionError && (
            <Banner type="warning" message={conversionError} />
          )}

          {/* ── Buttons ───────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className={[
                "flex-1 py-3 px-6 rounded-xl font-semibold text-sm text-white",
                "bg-gradient-to-r from-indigo-600 to-violet-600",
                "hover:from-indigo-500 hover:to-violet-500",
                "active:scale-[0.98] transition-all duration-150",
                "shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              {isLoading ? (
                 <span className="flex items-center justify-center gap-2">
                   <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                   </svg>
                   Analyzing...
                 </span>
              ) : "Calculate"}
            </button>
            {result && (
              <CopyButton
                getText={() => buildShareURL(values)}
                label="Share Link"
                successLabel="Link Copied!"
                className="py-3 px-5 rounded-xl border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 bg-indigo-500/5"
              />
            )}
            {(result || conversionError) && (
              <button
                type="button"
                onClick={handleReset}
                className={[
                  "py-3 px-5 rounded-xl text-sm font-medium",
                  "border border-white/10 text-slate-400",
                  "hover:border-white/20 hover:text-slate-200",
                  "transition-colors duration-150",
                ].join(" ")}
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          RESULTS CARD
      ════════════════════════════════════════════════════════════════════ */}
      {result && (
        <div
          key={result.proteinPer100Cal.toFixed(4)}
          className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <ResultsCard result={result} foodName={values.foodName} />
        </div>
      )}
        </div>
      )}
    </div>
  );
}
