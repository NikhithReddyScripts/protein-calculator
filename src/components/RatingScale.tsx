"use client";

import type { Rating } from "@/lib/calculator";

interface RatingScaleProps {
  value: number;     // g protein per 100 kcal
  rating: Rating;
}

// The scale maxes out visually at 15 — anything above still shows as Excellent
const SCALE_MAX = 15;

const SEGMENTS = [
  { label: "Very Poor", min: 0,  max: 2,         color: "#ef4444" }, // red
  { label: "Poor",      min: 2,  max: 4,         color: "#f97316" }, // orange
  { label: "Moderate",  min: 4,  max: 6,         color: "#eab308" }, // yellow
  { label: "Good",      min: 6,  max: 8,         color: "#14b8a6" }, // teal
  { label: "Very Good", min: 8,  max: 10,        color: "#22c55e" }, // green
  { label: "Excellent", min: 10, max: SCALE_MAX, color: "#10b981" }, // emerald
];

/**
 * RatingScale — a horizontal segmented progress bar showing where the food
 * lands on the protein-density spectrum.
 *
 * Segment widths are proportional to their range relative to SCALE_MAX.
 * The marker is capped at 99% so it never overflows the bar.
 */
export default function RatingScale({ value, rating }: RatingScaleProps) {
  const markerPct = Math.min((value / SCALE_MAX) * 100, 99);
  const displayValue = value > SCALE_MAX ? `>${SCALE_MAX}` : value.toFixed(1);

  return (
    <div className="flex flex-col gap-3" aria-label={`Rating scale: ${rating}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Protein density scale
      </p>

      {/* ── Segmented bar ─────────────────────────────────────────────── */}
      <div className="relative">
        {/* Bar */}
        <div className="flex h-4 w-full rounded-full overflow-hidden gap-px">
          {SEGMENTS.map((seg) => {
            const widthPct = ((seg.max - seg.min) / SCALE_MAX) * 100;
            return (
              <div
                key={seg.label}
                title={`${seg.label}: ${seg.min}–${seg.max} g/100 kcal`}
                style={{ width: `${widthPct}%`, backgroundColor: seg.color, opacity: 0.35 }}
              />
            );
          })}
        </div>

        {/* Marker */}
        <div
          className="absolute top-0 h-4 flex flex-col items-center pointer-events-none"
          style={{ left: `${markerPct}%`, transform: "translateX(-50%)" }}
        >
          {/* Triangle pointer */}
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "8px solid white",
            }}
          />
        </div>
      </div>

      {/* ── Labels row ────────────────────────────────────────────────── */}
      <div className="flex w-full">
        {SEGMENTS.map((seg, i) => {
          const widthPct = ((seg.max - seg.min) / SCALE_MAX) * 100;
          const isActive = seg.label === rating;
          return (
            <div
              key={seg.label}
              className="flex flex-col items-center"
              style={{ width: `${widthPct}%` }}
            >
              <span
                className="text-[10px] leading-tight text-center font-medium truncate px-0.5"
                style={{
                  color: isActive ? seg.color : "#475569",
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {i === 0 ? "V.Poor" : i === SEGMENTS.length - 1 ? "Excellent" : seg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── "Your food" callout ────────────────────────────────────────── */}
      <div
        className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs"
        style={{
          borderColor: `${SEGMENTS.find((s) => s.label === rating)?.color ?? "#6366f1"}40`,
          backgroundColor: `${SEGMENTS.find((s) => s.label === rating)?.color ?? "#6366f1"}12`,
        }}
      >
        <span
          className="font-bold text-sm tabular-nums"
          style={{ color: SEGMENTS.find((s) => s.label === rating)?.color }}
        >
          {displayValue} g
        </span>
        <span className="text-slate-400">
          per 100 kcal — your food lands in{" "}
          <span
            className="font-semibold"
            style={{ color: SEGMENTS.find((s) => s.label === rating)?.color }}
          >
            {rating}
          </span>
        </span>
      </div>
    </div>
  );
}
