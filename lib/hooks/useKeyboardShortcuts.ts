import { useEffect } from "react";

type ShortcutHandler = (event: KeyboardEvent) => void;

export type KeyboardShortcutMap = Record<string, ShortcutHandler>;

const normalizeCombo = (combo: string) => combo.toLowerCase().replace(/\s+/g, "");

const eventToCombo = (event: KeyboardEvent) => {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("ctrl");
  if (event.metaKey) parts.push("meta");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  const key = event.key.toLowerCase();
  parts.push(key);
  return parts.join("+");
};

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcutMap, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const normalized = new Map(
      Object.entries(shortcuts).map(([combo, handler]) => [normalizeCombo(combo), handler]),
    );

    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isEditable && !(event.ctrlKey || event.metaKey || event.altKey)) {
        return;
      }

      const combo = eventToCombo(event);
      const direct = normalized.get(combo);
      if (direct) {
        direct(event);
        return;
      }
      if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
        const questionHandler = normalized.get("?");
        if (questionHandler) questionHandler(event);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, shortcuts]);
};
