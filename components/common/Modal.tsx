"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  fullScreenOnMobile = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  fullScreenOnMobile?: boolean;
}) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    lastFocusedElement.current = document.activeElement as HTMLElement | null;
    const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    } else {
      containerRef.current?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    return () => {
      lastFocusedElement.current?.focus();
    };
  }, [open]);

  const handleTrapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/40"
        onClick={onClose}
        aria-label="Fechar modal"
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onKeyDown={handleTrapFocus}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-strong)] sm:rounded-3xl",
          fullScreenOnMobile && "h-[calc(100vh-1.5rem)] max-h-[calc(100vh-1.5rem)] sm:h-auto sm:max-h-none",
          size === "sm" && "max-w-md",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl",
          size === "xl" && "max-w-4xl",
        )}
      >
        {title ? (
          <div
            id={titleId}
            className="border-b border-border px-4 py-4 text-lg font-semibold text-text sm:px-6"
          >
            {title}
          </div>
        ) : null}
        <div
          className={cn(
            "overflow-y-auto px-4 py-4 text-sm text-text sm:px-6 sm:py-5",
            fullScreenOnMobile
              ? "max-h-[calc(100vh-8.5rem)] sm:max-h-[75vh]"
              : "max-h-[70vh] md:max-h-[75vh]",
          )}
        >
          {children}
        </div>
        {footer ? <div className="border-t border-border px-4 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>
  );
}
