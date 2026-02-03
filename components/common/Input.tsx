import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: InputProps) {
  const helperText = error ?? hint;
  const inputId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-2 text-sm text-text">
      {label ? <span className="font-medium">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "h-11 rounded-xl border border-border bg-surface px-4 text-base text-text shadow-sm outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
          error ? "border-danger focus-visible:border-danger focus-visible:ring-danger/30" : null,
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {helperText ? (
        <span className={cn("text-xs", error ? "text-danger" : "text-text-muted")}>
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
