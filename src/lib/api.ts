import { type CalculatorInputs, type CalculatorResult, type Unit } from "./calculator";

// Replace with your actual Cloudflare Worker URL after deployment (e.g., https://protein-calculator-api.yourname.workers.dev)
const API_BASE_URL = "http://localhost:3002"; // Using port 3002 for local worker testing

/**
 * Backend response structure (snake_case)
 */
export interface BackendResponse {
  scaled_protein_g: number;
  scaled_calories: number;
  protein_per_100_calories: number;
  protein_calorie_percent: number;
  rating: string;
  scale_position: number;
  interpretation_text: string;
  scaled_serving_label: string;
}

/**
 * apiCalculate
 * Calls the backend calculation service.
 */
export async function apiCalculate(inputs: CalculatorInputs): Promise<CalculatorResult> {
  // Map camelCase inputs to snake_case API payload
  const payload = {
    food_name: inputs.foodName,
    protein_g: inputs.proteinG,
    calories: inputs.caloriesKcal,
    base_serving_size: inputs.baseAmount,
    base_serving_unit: inputs.baseUnit,
    target_serving_size: inputs.targetAmount,
    target_serving_unit: inputs.targetUnit,
    custom_conversion: inputs.customFactor ? {
      from_unit: inputs.customFactor.fromUnit,
      to_unit: inputs.customFactor.toUnit,
      value: inputs.customFactor.value
    } : null
  };

  const response = await fetch(`${API_BASE_URL}/calculate-protein-ratio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "An error occurred during calculation.");
  }

  const data: BackendResponse = await response.json();

  // Map snake_case response back to camelCase internal result
  return {
    scaledProteinG: data.scaled_protein_g,
    scaledCalories: data.scaled_calories,
    proteinPer100Cal: data.protein_per_100_calories,
    proteinCalPct: data.protein_calorie_percent,
    rating: data.rating as any,
    interpretation: data.interpretation_text,
    scaledServingLabel: data.scaled_serving_label,
  };
}
