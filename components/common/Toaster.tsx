"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: "font-ui bg-surface text-text border border-border",
      }}
    />
  );
}
