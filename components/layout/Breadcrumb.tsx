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
    <nav aria-label="breadcrumb" className={cn("flex items-center gap-2", className)}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2 text-sm">
          {item.href ? (
            <Link className="text-text-muted hover:text-text" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-text">{item.label}</span>
          )}
          {index < items.length - 1 ? (
            <Chevron className="h-4 w-4 text-text-muted" />
          ) : null}
        </div>
      ))}
    </nav>
  );
}
