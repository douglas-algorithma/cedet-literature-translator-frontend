"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

import { ICONS } from "@/config/icons";
import { NAV_SECTIONS, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

const PUBLIC_PATHS = ["/login"];

const BOOK_RESERVED_SEGMENTS = new Set(["new"]);

type RouteContext = {
  bookId?: string;
  chapterId?: string;
};

type SidebarNavItem = NavItem & {
  href: string;
};

type SidebarSection = {
  id: string;
  label: string;
  items: SidebarNavItem[];
};

const resolveRouteContext = (pathname: string): RouteContext => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "books") {
    return {};
  }

  const bookId = segments[1];
  if (!bookId || BOOK_RESERVED_SEGMENTS.has(bookId)) {
    return {};
  }

  const chapterId =
    segments[2] === "chapters" && segments[3] && segments[3] !== "new"
      ? segments[3]
      : undefined;

  return { bookId, chapterId };
};

const buildHref = (template: string, context: RouteContext) => {
  return template
    .replace("[bookId]", context.bookId ?? "")
    .replace("[chapterId]", context.chapterId ?? "");
};

const shouldMatchOverview = (pathname: string, bookId: string) => {
  const base = `/books/${bookId}`;
  return pathname === base || pathname.startsWith(`${base}/chapters`);
};

const isActiveNavItem = ({
  pathname,
  item,
  href,
  context,
}: {
  pathname: string;
  item: SidebarNavItem;
  href: string;
  context: RouteContext;
}) => {
  if (item.id === "book-overview" && context.bookId) {
    return shouldMatchOverview(pathname, context.bookId);
  }
  if (item.matchMode === "exact") {
    return pathname === href;
  }
  return pathname.startsWith(href);
};

const getVisibleSections = (
  pathname: string,
  context: RouteContext,
): SidebarSection[] => {
  return NAV_SECTIONS.flatMap((section) => {
    if (section.scope === "book" && !context.bookId) {
      return [];
    }
    if (section.scope === "chapter" && (!context.bookId || !context.chapterId)) {
      return [];
    }

    const items = section.items
      .map((item) => ({
        ...item,
        href: buildHref(item.hrefTemplate, context),
      }))
      .filter((item) => !item.href.includes("["));

    if (!items.length) {
      return [];
    }

    return [
      {
        id: section.id,
        label: section.label,
        items,
      },
    ];
  });
};

export function BookSidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const closeMobileSidebar = useUiStore((state) => state.closeMobileSidebar);

  const safePathname = pathname ?? "/";
  const routeContext = useMemo(
    () => resolveRouteContext(safePathname),
    [safePathname],
  );
  const isPublicPath = PUBLIC_PATHS.some(
    (publicPath) =>
      safePathname === publicPath || safePathname.startsWith(`${publicPath}/`),
  );

  const sections = useMemo(
    () => getVisibleSections(safePathname, routeContext),
    [safePathname, routeContext],
  );

  useEffect(() => {
    closeMobileSidebar();
  }, [safePathname, closeMobileSidebar]);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileSidebar();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileSidebarOpen, closeMobileSidebar]);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [mobileSidebarOpen]);

  if (isPublicPath) {
    return null;
  }

  const renderSections = (mobile = false) => (
    <nav aria-label="Navegação principal" className="mt-4 flex flex-col gap-5">
      {sections.map((section) => (
        <section key={section.id} className="space-y-2">
          <p
            className={cn(
              "px-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted",
              !mobile && sidebarCollapsed && "sr-only",
            )}
          >
            {section.label}
          </p>
          <div className="flex flex-col gap-2">
            {section.items.map((item) => {
              const Icon = ICONS[item.icon];
              const isActive = isActiveNavItem({
                pathname: safePathname,
                item,
                href: item.href,
                context: routeContext,
              });

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition",
                    !mobile && sidebarCollapsed && "justify-center px-2",
                    isActive
                      ? "border-brand/40 bg-brand/10 text-brand"
                      : "border-transparent text-text-muted hover:border-border hover:bg-surface-muted hover:text-text",
                    item.kind === "quick-action" &&
                      !isActive &&
                      "text-text hover:border-brand/30 hover:bg-brand/5",
                  )}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn(!mobile && sidebarCollapsed && "sr-only")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );

  return (
    <>
      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={closeMobileSidebar} />
      ) : null}

      <aside
        id="mobile-app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-surface p-4 shadow-[var(--shadow-soft)] transition-transform duration-200 lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Navegação
          </p>
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-text"
            aria-label="Fechar navegação"
          >
            Fechar
          </button>
        </div>
        <div className="overflow-y-auto">{renderSections(true)}</div>
      </aside>

      <aside
        className={cn(
          "sticky top-16 hidden h-[calc(100vh-5rem)] shrink-0 rounded-3xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] lg:flex lg:flex-col",
          sidebarCollapsed ? "w-[92px]" : "w-[260px]",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-widest text-text-muted",
              sidebarCollapsed && "sr-only",
            )}
          >
            Navegação
          </p>
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-text"
            aria-label={sidebarCollapsed ? "Expandir navegação lateral" : "Recolher navegação lateral"}
          >
            {sidebarCollapsed ? "Expandir" : "Recolher"}
          </button>
        </div>
        <div className="overflow-y-auto">{renderSections()}</div>
      </aside>
    </>
  );
}
