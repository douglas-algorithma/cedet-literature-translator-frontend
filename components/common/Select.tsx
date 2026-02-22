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
  placeholder?: string;
  placeholderValue?: string;
  placeholderDisabled?: boolean;
};

export function Select({
  label,
  error,
  options,
  className,
  id,
  name,
  placeholder,
  placeholderValue = "",
  placeholderDisabled = true,
  ...props
}: SelectProps) {
  const fieldId = id ?? name;
  const errorId = error && fieldId ? `${fieldId}-error` : undefined;

  return (
    <label className="flex w-full flex-col gap-2 text-sm text-text">
      {label ? <span className="font-medium">{label}</span> : null}
      <select
        id={fieldId}
        name={name}
        className={cn(
          "h-11 rounded-xl border border-border bg-surface px-4 text-base text-text shadow-sm outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-danger focus-visible:border-danger focus-visible:ring-danger/30" : null,
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...props}
      >
        {placeholder ? (
          <option value={placeholderValue} disabled={placeholderDisabled}>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span id={errorId} className="text-xs text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
