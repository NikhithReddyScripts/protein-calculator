"use client";

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  id: string;
  options: Option[];
}

/**
 * Reusable labelled select dropdown.
 * Supports optional grouping — if any option has a `group` property,
 * options are rendered inside <optgroup> elements.
 */
export default function SelectField({ label, error, id, options, className = "", ...props }: SelectFieldProps) {
  const hasGroups = options.some((o) => o.group);

  // Build grouped structure
  const groups: Record<string, Option[]> = {};
  const ungrouped: Option[] = [];
  for (const opt of options) {
    if (opt.group) {
      groups[opt.group] = groups[opt.group] ?? [];
      groups[opt.group].push(opt);
    } else {
      ungrouped.push(opt);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        id={id}
        className={[
          "w-full rounded-xl px-4 py-3 text-sm",
          "bg-[#111827] border",
          error
            ? "border-red-500/60 focus:border-red-400"
            : "border-white/10 focus:border-indigo-400/60",
          "text-slate-100",
          "outline-none transition-colors duration-200",
          "focus:ring-2 focus:ring-indigo-500/20",
          "appearance-none cursor-pointer",
          className,
        ].join(" ")}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b9ab8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "2.5rem",
        }}
        {...props}
      >
        <option value="" disabled>
          Select unit
        </option>

        {hasGroups
          ? Object.entries(groups).map(([group, opts]) => (
              <optgroup key={group} label={`── ${group}`}>
                {opts.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))
          : ungrouped.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
      </select>

      {error && (
        <p role="alert" className="text-xs text-red-400 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
