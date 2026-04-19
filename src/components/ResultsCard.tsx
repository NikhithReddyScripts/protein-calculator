"use client";

import { type CalculatorResult, type Rating, getRatingColor } from "@/lib/calculator";
import RatingScale from "./RatingScale";
import CopyButton from "./CopyButton";
import { buildResultSummary } from "@/lib/urlState";

interface ResultsCardProps {
  result: CalculatorResult;
  foodName?: string;
}

function MetricRow({
  label,
  value,
  unit,
  highlight,
  tooltip,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  tooltip?: string;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between py-3 px-4 rounded-xl",
        highlight
          ? "bg-indigo-500/10 border border-indigo-500/20"
          : "bg-white/[0.03] border border-white/[0.06]",
      ].join(" ")}
      title={tooltip}
    >
      <span className="text-sm text-slate-400 flex items-center gap-1.5">
        {label}
        {tooltip && (
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-slate-500 text-[10px] cursor-help"
            aria-label={tooltip}
          >
            ?
          </span>
        )}
      </span>
      <span
        className={[
          "font-semibold tabular-nums",
          highlight ? "text-indigo-300 text-base" : "text-slate-200 text-sm",
        ].join(" ")}
      >
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-slate-500">{unit}</span>}
      </span>
    </div>
  );
}

function RatingBadge({ rating }: { rating: Rating }) {
  const c = getRatingColor(rating);
  return (
    <div
      className={[
        "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold",
        c.text, c.bg, c.border,
      ].join(" ")}
    >
      <span className={["w-2 h-2 rounded-full animate-pulse", c.badge].join(" ")} aria-hidden="true" />
      {rating}
    </div>
  );
}

export default function ResultsCard({ result, foodName }: ResultsCardProps) {
  const c = getRatingColor(result.rating);

  return (
    <section
      aria-label="Calculation results"
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className={["px-6 py-5 border-b border-white/10", c.bg].join(" ")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {foodName ? `Results — ${foodName}` : "Results"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-slate-400">Per {result.scaledServingLabel}</p>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <CopyButton
                getText={() => buildResultSummary(result, foodName || "")}
                label="Copy Summary"
                variant="pill"
                className="scale-90 origin-left border-indigo-500/20 text-indigo-400 hover:text-indigo-300"
              />
            </div>
          </div>
          <RatingBadge rating={result.rating} />
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5">
        {/* ── Visual rating scale ────────────────────────────────────── */}
        <RatingScale value={result.proteinPer100Cal} rating={result.rating} />

        <div className="h-px bg-white/[0.06]" />

        {/* ── Adjusted serving metrics ──────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Adjusted Serving
          </p>
          <MetricRow label="Serving size" value={result.scaledServingLabel} />
          <MetricRow label="Protein" value={result.scaledProteinG.toFixed(1)} unit="g" />
          <MetricRow label="Calories" value={result.scaledCalories.toFixed(1)} unit="kcal" />
        </div>

        {/* ── Density metrics ───────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Protein Density Metrics
          </p>
          <MetricRow
            label="Protein per 100 kcal"
            value={result.proteinPer100Cal.toFixed(2)}
            unit="g"
            highlight
            tooltip="How many grams of protein you get per 100 calories. Higher = more protein-efficient."
          />
          <MetricRow
            label="Protein calorie %"
            value={result.proteinCalPct.toFixed(1)}
            unit="%"
            tooltip="Percentage of total calories that come from protein (using the 4 kcal/g Atwater factor)."
          />
        </div>

        {/* ── Interpretation ────────────────────────────────────────── */}
        <div
          className={[
            "px-4 py-4 rounded-xl border text-sm leading-relaxed",
            c.bg, c.border, c.text,
          ].join(" ")}
        >
          {result.interpretation}
        </div>
      </div>
    </section>
  );
}
