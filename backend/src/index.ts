import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { CalculationRequestSchema } from "./schemas";
import { performCalculation } from "./calculator";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * POST /calculate-protein-ratio
 * Performs nutrition scaling and protein density analysis.
 */
app.post("/calculate-protein-ratio", (req, res) => {
  try {
    // 1. Validate request
    const validatedData = CalculationRequestSchema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validatedData.error.flatten().fieldErrors
      });
    }

    // 2. Perform calculation
    const result = performCalculation(validatedData.data);

    // 3. Return results
    return res.json(result);

  } catch (error: any) {
    console.error("Calculation error:", error);
    return res.status(400).json({
      error: error.message || "An unexpected error occurred during calculation."
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`[server]: Calculator API is running at http://localhost:${port}`);
});
