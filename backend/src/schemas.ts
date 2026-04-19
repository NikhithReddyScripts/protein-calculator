import { z } from "zod";

const UnitSchema = z.enum([
  "g", "kg", "oz", "lb",
  "ml", "L", "tsp", "tbsp", "cup",
  "serving", "piece", "item"
]);

export const CalculationRequestSchema = z.object({
  food_name: z.string().optional().default(""),
  protein_g: z.number().min(0),
  calories: z.number().min(0.01),
  base_serving_size: z.number().min(0.01),
  base_serving_unit: UnitSchema,
  target_serving_size: z.number().min(0.01),
  target_serving_unit: UnitSchema,
  custom_conversion: z.object({
    from_unit: UnitSchema,
    to_unit: UnitSchema,
    value: z.number().min(0.001)
  }).nullable().optional()
});

export type CalculationRequest = z.infer<typeof CalculationRequestSchema>;
