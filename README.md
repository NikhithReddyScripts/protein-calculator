# Protein-to-Calorie Ratio Calculator

A high-performance nutrition analysis tool designed to measure food efficiency by protein density (g per 100 kcal).

## Features

- **Side-by-Side Comparison**: Compare two foods to identify the most protein-efficient choice.
- **Unit Conversion Engine**: Supports Weight (g, kg, oz, lb), Volume (ml, L, tsp, tbsp, cup), and Count units.
- **Custom Conversion Factors**: Define bridge factors (e.g., 1 cup = 240g) for cross-category unit conversion.
- **Deep Linking**: Form state is synchronized with the URL for easy sharing and persistence.
- **Backend API**: Decoupled calculation engine providing server-side verified metrics.

## Tech Stack

### Frontend
- Next.js (App Router)
- Tailwind CSS
- TypeScript

### Backend (API)
- Node.js / Express
- Zod (Validation)
- TypeScript

## Getting Started

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```
The API will run at `http://localhost:3001`.

### 2. Start the Frontend
```bash
npm install
npm run dev
```
The application will be available at `http://localhost:3000`.

## API Documentation

### POST `/calculate-protein-ratio`
Calculates nutrition scaling and protein density analysis.

**Request Body:**
```json
{
  "food_name": "Greek Yogurt",
  "protein_g": 10,
  "calories": 60,
  "base_serving_size": 170,
  "base_serving_unit": "g",
  "target_serving_size": 100,
  "target_serving_unit": "g",
  "custom_conversion": null
}
```

**Response:**
```json
{
  "scaled_protein_g": 5.88,
  "scaled_calories": 35.29,
  "protein_per_100_calories": 16.67,
  "protein_calorie_percent": 66.67,
  "rating": "Excellent",
  "scale_position": 0.95,
  "interpretation_text": "This food is exceptionally protein-dense...",
  "scaled_serving_label": "100 g"
}
```
