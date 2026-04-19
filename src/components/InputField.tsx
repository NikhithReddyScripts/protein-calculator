"use client";

import { forwardRef } from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  id: string;
}

/**
 * Reusable labelled input with inline error display.
 */
const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, error, hint, id, className = "", ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className={[
          "w-full rounded-xl px-4 py-3 text-sm",
          "bg-white/5 border",
          error ? "border-red-500/60 focus:border-red-400" : "border-white/10 focus:border-indigo-400/60",
          "text-slate-100 placeholder:text-slate-500",
          "outline-none transition-colors duration-200",
          "focus:ring-2 focus:ring-indigo-500/20",
          className,
        ].join(" ")}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-400 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
});

export default InputField;
