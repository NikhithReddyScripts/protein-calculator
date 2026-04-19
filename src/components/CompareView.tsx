"use client";

import { useState } from "react";
import FoodSlot from "./FoodSlot";
import { compareResults, type CalculatorResult, type ComparisonResult } from "@/lib/calculator";

/**
 * CompareView — Orchestrates two FoodSlots and displays the comparison summary.
 */
export default function CompareView() {
  const [resA, setResA] = useState<{ result: CalculatorResult | null; name: string }>({
    result: null,
    name: "",
  });
  const [resB, setResB] = useState<{ result: CalculatorResult | null; name: string }>({
    result: null,
    name: "",
  });

  const hasBoth = resA.result && resB.result;
  const comparison: ComparisonResult | null = hasBoth
    ? compareResults(resA.result!, resA.name, resB.result!, resB.name)
    : null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* ── Side-by-side slots ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FoodSlot
          label="Food A"
          accentColor="text-indigo-400"
          onResult={(result, name) => setResA({ result, name })}
        />
        <FoodSlot
          label="Food B"
          accentColor="text-violet-400"
          onResult={(result, name) => setResB({ result, name })}
        />
      </div>

      {/* ── Comparison results card ───────────────────────────────────── */}
      <section
        aria-label="Comparison results"
        className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden min-h-[14rem] flex flex-col"
      >
        <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Comparison Summary
          </h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          {!hasBoth ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-slate-600 text-xl font-bold">
                ?
              </div>
              <p className="text-slate-500 text-sm max-w-xs">
                Calculate both foods to compare their protein density side-by-side.
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              {/* Winner Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-bold mb-6">
                <span className="text-lg">🏆</span>
                {comparison?.winner === "Tie" ? "It's a Tie!" : `${comparison?.winner === "A" ? (resA.name || "Food A") : (resB.name || "Food B")} Wins!`}
              </div>

              {/* Big Summary Statement */}
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4 px-4 leading-tight">
                {comparison?.summary}
              </h3>

              {/* Proportional comparison bars */}
              <div className="w-full max-w-md mx-auto flex h-3 rounded-full overflow-hidden bg-white/5 mt-8 relative">
                <div
                   className="h-full bg-indigo-500 transition-all duration-700"
                   style={{ width: `${(resA.result!.proteinPer100Cal / (resA.result!.proteinPer100Cal + resB.result!.proteinPer100Cal)) * 100}%` }}
                />
                <div
                   className="h-full bg-violet-500 transition-all duration-700"
                   style={{ width: `${(resB.result!.proteinPer100Cal / (resA.result!.proteinPer100Cal + resB.result!.proteinPer100Cal)) * 100}%` }}
                />
              </div>
              
              <div className="w-full max-w-md mx-auto flex justify-between mt-3 px-1">
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-tighter">Food A</span>
                  <span className="text-xs text-slate-300 font-mono tracking-tighter">{resA.result!.proteinPer100Cal.toFixed(1)}g</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-violet-400 tracking-tighter">Food B</span>
                  <span className="text-xs text-slate-300 font-mono tracking-tighter">{resB.result!.proteinPer100Cal.toFixed(1)}g</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
