import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
};

export function Textarea({
  label,
  error,
  hint,
  showCount,
  maxLength,
  id,
  className,
  value,
  defaultValue,
  ...props
}: TextareaProps) {
  const helperText = error ?? hint;
  const currentLength = typeof value === "string"
    ? value.length
    : typeof defaultValue === "string"
      ? defaultValue.length
      : 0;
  const inputId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-2 text-sm text-text">
      <div className="flex items-center justify-between">
        {label ? <span className="font-medium">{label}</span> : <span />}
        {showCount && maxLength ? (
          <span className="text-xs text-text-muted">
            {currentLength}/{maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        id={inputId}
        className={cn(
          "min-h-[120px] rounded-2xl border border-border bg-surface px-4 py-3 text-base text-text shadow-sm outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
          error ? "border-danger focus-visible:border-danger focus-visible:ring-danger/30" : null,
          className,
        )}
        aria-invalid={Boolean(error)}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
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
