import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ComboBoxOption = {
  label: string;
  value: string;
};

type ComboBoxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  options: ComboBoxOption[];
};

export function ComboBox({ label, error, options, id, className, ...props }: ComboBoxProps) {
  const listId = id ? `${id}-list` : `${props.name ?? "combobox"}-list`;

  return (
    <label className="flex w-full flex-col gap-2 text-sm text-text">
      {label ? <span className="font-medium">{label}</span> : null}
      <input
        id={id}
        list={listId}
        className={cn(
          "h-11 rounded-xl border border-border bg-surface px-4 text-base text-text shadow-sm outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
          error ? "border-danger focus-visible:border-danger focus-visible:ring-danger/30" : null,
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
