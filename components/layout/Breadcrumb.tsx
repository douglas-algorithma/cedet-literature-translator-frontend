import Link from "next/link";

import { ICONS } from "@/config/icons";
import { cn } from "@/lib/utils";

export type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  const Chevron = ICONS["chevron-right"];

  return (
    <nav aria-label="breadcrumb" className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2 text-sm">
          {item.href ? (
            <Link
              className="inline-block max-w-[42vw] truncate text-text-muted hover:text-text sm:max-w-[320px]"
              href={item.href}
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="inline-block max-w-[42vw] truncate font-medium text-text sm:max-w-[320px]"
              title={item.label}
            >
              {item.label}
            </span>
          )}
          {index < items.length - 1 ? (
            <Chevron className="h-4 w-4 text-text-muted" />
          ) : null}
        </div>
      ))}
    </nav>
  );
}
