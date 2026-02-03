"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ICONS } from "@/config/icons";
import { BOOK_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";

const buildBookHref = (template: string, bookId: string) =>
  template.replace("[bookId]", bookId);

export function BookSidebar({ bookId }: { bookId: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-3xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] md:w-64">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
        Navegação
      </p>
      <nav className="flex flex-col gap-2">
        {BOOK_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          const href = buildBookHref(item.href, bookId);
          const isActive = pathname?.startsWith(href);

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-text-muted hover:bg-surface-muted hover:text-text",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
