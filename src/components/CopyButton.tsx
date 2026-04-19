"use client";

import { useState } from "react";

interface CopyButtonProps {
  getText: () => string;        // called lazily so expensive formatting is deferred
  label?: string;               // button label, default "Copy"
  successLabel?: string;        // label shown after copy, default "Copied!"
  className?: string;
  variant?: "ghost" | "pill";
}

/**
 * A small button that copies text to the clipboard.
 * Shows a "Copied!" checkmark for 2 seconds, then resets.
 */
export default function CopyButton({
  getText,
  label = "Copy",
  successLabel = "Copied!",
  className = "",
  variant = "ghost",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available — silently ignore
    }
  }

  const baseStyles =
    variant === "pill"
      ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border"
      : "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 border";

  const colourStyles = copied
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
    : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? successLabel : label}
      className={[baseStyles, colourStyles, className].join(" ")}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successLabel}
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
