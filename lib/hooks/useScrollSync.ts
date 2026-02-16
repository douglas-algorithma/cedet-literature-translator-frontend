import { useEffect, useRef } from "react";

type ScrollSyncOptions = {
  enabled: boolean;
  leftRef: React.RefObject<HTMLElement | null>;
  rightRef: React.RefObject<HTMLElement | null>;
};

export const useScrollSync = ({ enabled, leftRef, rightRef }: ScrollSyncOptions) => {
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let frameId: number | null = null;
    let detach: (() => void) | null = null;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      if (isSyncing.current) return;
      const sourceScrollable = source.scrollHeight - source.clientHeight;
      const targetScrollable = target.scrollHeight - target.clientHeight;
      if (sourceScrollable <= 0 || targetScrollable <= 0) return;

      isSyncing.current = true;
      const ratio = source.scrollTop / sourceScrollable;
      target.scrollTop = ratio * targetScrollable;
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    };

    const tryAttach = () => {
      const left = leftRef.current;
      const right = rightRef.current;
      if (!left || !right) {
        frameId = requestAnimationFrame(tryAttach);
        return;
      }

      const handleLeft = () => syncScroll(left, right);
      const handleRight = () => syncScroll(right, left);

      left.addEventListener("scroll", handleLeft, { passive: true });
      right.addEventListener("scroll", handleRight, { passive: true });
      syncScroll(left, right);
      detach = () => {
        left.removeEventListener("scroll", handleLeft);
        right.removeEventListener("scroll", handleRight);
      };
    };

    tryAttach();

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      detach?.();
    };
  }, [enabled, leftRef, rightRef]);
};
