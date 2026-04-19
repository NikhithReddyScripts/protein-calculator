/**
 * lib/validation.ts
 *
 * Validates all form inputs, including the optional custom conversion factor.
 */

import { getUnitCategory, type Unit } from "./calculator";

export interface FormValues {
  foodName: string;
  protein: string;
  calories: string;
  baseAmount: string;
  baseUnit: string;
  targetAmount: string;
  targetUnit: string;
  // Custom factor (optional)
  cfEnabled: boolean;
  cfFromUnit: string;
  cfToUnit: string;
  cfValue: string;
}

export interface FormErrors {
  protein?: string;
  calories?: string;
  baseAmount?: string;
  baseUnit?: string;
  targetAmount?: string;
  targetUnit?: string;
  cfFromUnit?: string;
  cfToUnit?: string;
  cfValue?: string;
  cfGeneral?: string; // cross-field custom factor error
}

export function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  // ── Protein ──────────────────────────────────────────────────────────────
  const protein = parseFloat(values.protein);
  if (values.protein.trim() === "" || isNaN(protein)) {
    errors.protein = "Protein amount is required.";
  } else if (protein < 0) {
    errors.protein = "Protein must be 0 or more.";
  }

  // ── Calories ─────────────────────────────────────────────────────────────
  const calories = parseFloat(values.calories);
  if (values.calories.trim() === "" || isNaN(calories)) {
    errors.calories = "Calories are required.";
  } else if (calories <= 0) {
    errors.calories = "Calories must be greater than 0.";
  }

  // ── Base serving ─────────────────────────────────────────────────────────
  const baseAmount = parseFloat(values.baseAmount);
  if (values.baseAmount.trim() === "" || isNaN(baseAmount)) {
    errors.baseAmount = "Base serving size is required.";
  } else if (baseAmount <= 0) {
    errors.baseAmount = "Base serving size must be greater than 0.";
  }

  if (!values.baseUnit) errors.baseUnit = "Please select a unit.";

  // ── Target serving ────────────────────────────────────────────────────────
  const targetAmount = parseFloat(values.targetAmount);
  if (values.targetAmount.trim() === "" || isNaN(targetAmount)) {
    errors.targetAmount = "Target serving size is required.";
  } else if (targetAmount <= 0) {
    errors.targetAmount = "Target serving size must be greater than 0.";
  }

  if (!values.targetUnit) errors.targetUnit = "Please select a unit.";

  // ── Custom conversion factor (only validated when enabled) ────────────────
  if (values.cfEnabled) {
    if (!values.cfFromUnit) {
      errors.cfFromUnit = "Select the source unit for the conversion.";
    }
    if (!values.cfToUnit) {
      errors.cfToUnit = "Select the target unit for the conversion.";
    }

    const cfVal = parseFloat(values.cfValue);
    if (values.cfValue.trim() === "" || isNaN(cfVal)) {
      errors.cfValue = "Conversion value is required.";
    } else if (cfVal <= 0) {
      errors.cfValue = "Conversion value must be greater than 0.";
    } else if (!isFinite(cfVal)) {
      errors.cfValue = "Conversion value must be a finite number.";
    }

    // Both units must be different categories (same-category factors are redundant)
    if (values.cfFromUnit && values.cfToUnit && !errors.cfFromUnit && !errors.cfToUnit) {
      const fromCat = getUnitCategory(values.cfFromUnit as Unit);
      const toCat = getUnitCategory(values.cfToUnit as Unit);
      if (fromCat === toCat) {
        errors.cfGeneral = `Both units are in the same category (${fromCat}). A custom factor is only needed across different categories.`;
      }
    }
  }

  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
