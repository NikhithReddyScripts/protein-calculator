"use client";

import { useState } from "react";

interface AccordionItem {
  q: string;
  a: string;
}

const ITEMS: AccordionItem[] = [
  {
    q: "What is 'protein per 100 calories'?",
    a: "This tells you how much protein you get for every 100 calories you eat. A food with 17g per 100 kcal means that if you eat 100 calories worth of it, 17 grams of that will be protein. Higher numbers mean the food delivers more protein relative to its calorie cost — which is what we call being protein-efficient.",
  },
  {
    q: "What is 'protein calorie percentage'?",
    a: "This shows what fraction of a food's total calories come from protein. Since protein provides 4 calories per gram (the Atwater factor), the formula is: (grams of protein × 4) ÷ total calories × 100. A chicken breast with 40% protein calories means nearly half its energy comes from protein. Pure protein sources (like plain egg whites) approach 80–90%.",
  },
  {
    q: "Why is this useful for nutrition?",
    a: "Calorie counts alone don't tell you how filling or muscle-supporting a food is. Protein is the most satiating macronutrient — it helps with muscle maintenance and keeps you full longer per calorie. By comparing protein density, you can make smarter choices: two foods with the same calories can have very different protein efficiency, making one far more valuable for your goals.",
  },
  {
    q: "Why can't I convert cups to grams directly?",
    a: "Volume and weight measure different things — a cup of feathers weighs almost nothing, a cup of honey is very heavy. Their relationship depends on the density of the specific food. That's why cross-category conversion requires a custom factor: you tell the calculator '1 cup of this food = 240 g', and it uses that density to scale accurately.",
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * EducationSection — collapsible accordion explaining the calculator's metrics.
 */
export default function EducationSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <aside
      aria-label="Learn about protein density metrics"
      className="max-w-2xl mx-auto mt-10 rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          About these metrics
        </p>
      </div>

      {/* Accordion items */}
      <div className="divide-y divide-white/[0.04]">
        {ITEMS.map((item, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={openIndex === i}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/[0.02] transition-colors duration-150"
            >
              <span className="text-sm font-medium text-slate-300">{item.q}</span>
              <span className="text-slate-500 shrink-0">
                <ChevronIcon open={openIndex === i} />
              </span>
            </button>

            {/* Answer — CSS-animated with max-height trick */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: openIndex === i ? "24rem" : "0" }}
            >
              <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
