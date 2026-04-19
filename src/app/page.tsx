import CalculatorForm from "@/components/CalculatorForm";
import EducationSection from "@/components/EducationSection";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-16 sm:py-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
      {/* ── Background Glow ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-violet-500/5 blur-[100px]" />
      </div>

      {/* ── Hero Section ── */}
      <header className="text-center mb-16 max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Next-Gen Nutrition Analysis
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
          Calculate Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
            Protein Density
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg sm:text-xl leading-relaxed font-medium">
          The most accurate way to measure food efficiency. <br className="hidden sm:block" />
          Go beyond calories — see the true protein value of every bite.
        </p>
      </header>

      {/* ── Main Calculator Interface ── */}
      <div className="relative z-10">
        <CalculatorForm />
      </div>

      {/* ── Education & FAQ ── */}
      <div className="mt-20">
        <EducationSection />
      </div>

      {/* ── Quick Reference / Rating Guide ── */}
      <aside
        aria-label="Rating guide"
        className="mt-12 max-w-2xl mx-auto rounded-2xl border border-white/5 bg-white/[0.01] px-8 py-8 backdrop-blur-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Efficiency Benchmarks</h3>
            <p className="text-xs text-slate-500 mt-1">Grams of protein per 100 kcal</p>
          </div>
          <div className="h-px sm:h-8 sm:w-px bg-white/10" />
          <p className="text-[10px] text-slate-500 max-w-[200px] leading-normal uppercase font-medium">
            Based on clinical nutrition density standards for high-protein dieting.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { label: "Excellent", range: "≥ 10g", color: "text-emerald-400", bg: "bg-emerald-400/5", border: "border-emerald-400/20" },
            { label: "Very Good", range: "8–10g", color: "text-green-400",   bg: "bg-green-400/5",   border: "border-green-400/20"   },
            { label: "Good",      range: "6–8g",  color: "text-teal-400",    bg: "bg-teal-400/5",    border: "border-teal-400/20"    },
            { label: "Moderate",  range: "4–6g",  color: "text-yellow-400",  bg: "bg-yellow-400/5",  border: "border-yellow-400/20"  },
            { label: "Poor",      range: "2–4g",  color: "text-orange-400",  bg: "bg-orange-400/5",  border: "border-orange-400/20"  },
            { label: "Very Poor", range: "< 2g",  color: "text-red-400",     bg: "bg-red-400/5",     border: "border-red-400/20"     },
          ].map((item) => (
            <div key={item.label} className={`flex flex-col gap-1 p-3 rounded-xl border ${item.bg} ${item.border}`}>
              <span className={`text-[10px] font-black uppercase tracking-tighter ${item.color}`}>{item.label}</span>
              <span className="text-sm font-bold text-slate-200 tabular-nums">{item.range}</span>
            </div>
          ))}
        </div>
      </aside>

      <footer className="mt-24 text-center">
        <div className="inline-flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase text-slate-600">
          <span>Accuracy Focus</span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span>Privacy First</span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span>Open Standards</span>
        </div>
        <p className="mt-6 text-[10px] text-slate-700 font-medium">
          &copy; 2026 Protein Density Calculator · Phase 3 Release
        </p>
      </footer>
    </main>
  );
}
