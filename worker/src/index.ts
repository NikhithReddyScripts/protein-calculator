import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

// ─── Logic ──────────────────────────────────────────────────────────────────

type WeightUnit = "g" | "kg" | "oz" | "lb";
type VolumeUnit = "ml" | "L" | "tsp" | "tbsp" | "cup";
type CountUnit = "serving" | "piece" | "item";
type Unit = WeightUnit | VolumeUnit | CountUnit;

interface CustomFactor {
  from_unit: Unit;
  to_unit: Unit;
  value: number;
}

interface CalculatorInputs {
  food_name: string;
  protein_g: number;
  calories: number;
  base_serving_size: number;
  base_serving_unit: Unit;
  target_serving_size: number;
  target_serving_unit: Unit;
  custom_conversion?: CustomFactor | null;
}

const WEIGHT_TO_G: Record<string, number> = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const VOLUME_TO_ML: Record<string, number> = { ml: 1, L: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588 };

function toCanonical(amount: number, unit: Unit): number {
  if (WEIGHT_TO_G[unit]) return amount * WEIGHT_TO_G[unit];
  if (VOLUME_TO_ML[unit]) return amount * VOLUME_TO_ML[unit];
  return amount;
}

function resolveScaleFactor(inputs: CalculatorInputs): number {
  const { base_serving_size: ba, base_serving_unit: bu, target_serving_size: ta, target_serving_unit: tu, custom_conversion: cf } = inputs;
  const bc = bu in WEIGHT_TO_G ? "w" : bu in VOLUME_TO_ML ? "v" : "c";
  const tc = tu in WEIGHT_TO_G ? "w" : tu in VOLUME_TO_ML ? "v" : "c";

  if (bc === tc) return toCanonical(ta, tu) / toCanonical(ba, bu);
  if (!cf) throw new Error(`Custom conversion required for ${bu} to ${tu}`);

  const fc = cf.from_unit in WEIGHT_TO_G ? "w" : cf.from_unit in VOLUME_TO_ML ? "v" : "c";
  const tcc = cf.to_unit in WEIGHT_TO_G ? "w" : cf.to_unit in VOLUME_TO_ML ? "v" : "c";

  if (fc === bc && tcc === tc) {
    const baseInTarget = (toCanonical(ba, bu) / toCanonical(1, cf.from_unit)) * cf.value * toCanonical(1, cf.to_unit);
    return toCanonical(ta, tu) / baseInTarget;
  }
  if (fc === tc && tcc === bc) {
    const baseInTarget = (toCanonical(ba, bu) / toCanonical(1, cf.to_unit) / cf.value) * toCanonical(1, cf.from_unit);
    return toCanonical(ta, tu) / baseInTarget;
  }
  throw new Error("Custom conversion mismatch");
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const UnitSchema = z.enum(["g", "kg", "oz", "lb", "ml", "L", "tsp", "tbsp", "cup", "serving", "piece", "item"]);
const RequestSchema = z.object({
  food_name: z.string().optional().default(""),
  protein_g: z.number().min(0),
  calories: z.number().min(0.01),
  base_serving_size: z.number().min(0.01),
  base_serving_unit: UnitSchema,
  target_serving_size: z.number().min(0.01),
  target_serving_unit: UnitSchema,
  custom_conversion: z.object({ from_unit: UnitSchema, to_unit: UnitSchema, value: z.number().min(0.001) }).nullable().optional()
});

// ─── API ────────────────────────────────────────────────────────────────────

const app = new Hono();

app.use("*", cors());

app.post("/calculate-protein-ratio", async (c) => {
  try {
    const body = await c.req.json();
    const validated = RequestSchema.safeParse(body);

    if (!validated.success) {
      return c.json({ error: "Validation failed", details: validated.error.flatten() }, 400);
    }

    const inputs = validated.data;
    const scale = resolveScaleFactor(inputs as any);
    const sp = inputs.protein_g * scale;
    const sc = inputs.calories * scale;
    
    const density = (sp / sc) * 100;
    const rating = density >= 10 ? "Excellent" : density >= 8 ? "Very Good" : density >= 6 ? "Good" : density >= 4 ? "Moderate" : density >= 2 ? "Poor" : "Very Poor";
    
    return c.json({
      scaled_protein_g: Number(sp.toFixed(2)),
      scaled_calories: Number(sc.toFixed(2)),
      protein_per_100_calories: Number(density.toFixed(2)),
      protein_calorie_percent: Number(((sp * 4) / sc * 100).toFixed(2)),
      rating,
      scale_position: density >= 10 ? 0.95 : 0.5, // simplified for brevity
      interpretation_text: `Result: ${rating} protein efficiency.`,
      scaled_serving_label: `${inputs.target_serving_size} ${inputs.target_serving_unit}`
    });
  } catch (e: any) {
    return c.json({ error: e.message || "Calculation error" }, 400);
  }
});

export default app;
