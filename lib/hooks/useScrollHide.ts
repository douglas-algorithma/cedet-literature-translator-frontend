"use client";

import { useEffect, useRef, useState } from "react";

type UseScrollHideOptions = {
  threshold?: number;
  minDelta?: number;
  disabled?: boolean;
  desktopMinWidth?: number;
};

export function useScrollHide({
  threshold = 96,
  minDelta = 8,
  disabled = false,
  desktopMinWidth = 1024,
}: UseScrollHideOptions = {}) {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || disabled) {
      return;
    }

    const onScroll = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;

        const isDesktop = window.matchMedia(
          `(min-width: ${desktopMinWidth}px)`,
        ).matches;

        if (!isDesktop) {
          setIsHidden(false);
          lastScrollYRef.current = window.scrollY;
          return;
        }

        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollYRef.current;

        if (currentScrollY <= threshold) {
          setIsHidden(false);
        } else if (delta > minDelta) {
          setIsHidden(true);
        } else if (delta < -minDelta) {
          setIsHidden(false);
        }

        lastScrollYRef.current = currentScrollY;
      });
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [desktopMinWidth, disabled, minDelta, threshold]);

  return disabled ? false : isHidden;
}
