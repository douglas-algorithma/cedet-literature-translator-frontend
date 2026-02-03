import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: SelectOption[];
};

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-text">
      {label ? <span className="font-medium">{label}</span> : null}
      <select
        className={cn(
          "h-11 rounded-xl border border-border bg-surface px-4 text-base text-text shadow-sm outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
          error ? "border-danger focus-visible:border-danger focus-visible:ring-danger/30" : null,
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
