"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/40"
        onClick={onClose}
        aria-label="Fechar modal"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-strong)]",
          size === "sm" && "max-w-md",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl",
          size === "xl" && "max-w-4xl",
        )}
      >
        {title ? (
          <div className="border-b border-border px-6 py-4 text-lg font-semibold text-text">
            {title}
          </div>
        ) : null}
        <div className="px-6 py-5 text-sm text-text">{children}</div>
        {footer ? <div className="border-t border-border px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
