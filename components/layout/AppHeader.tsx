"use client";

import Link from "next/link";
import { useState } from "react";

import { buttonStyles, Button } from "@/components/common/Button";
import { ICONS } from "@/config/icons";
import { APP_NAME, APP_TAGLINE } from "@/config/app";
import { MAIN_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";

const renderNavItem = (item: (typeof MAIN_NAV)[number]) => {
  const Icon = ICONS[item.icon];

  return (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-text-muted transition hover:text-text",
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
};

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const MenuIcon = ICONS.menu;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <span className="text-lg font-bold">C</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{APP_NAME}</p>
            <p className="text-xs text-text-muted">{APP_TAGLINE}</p>
          </div>
        </div>
        <nav className="hidden items-center gap-2 md:flex">
          {MAIN_NAV.map(renderNavItem)}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Suporte
          </Button>
          <Link className={buttonStyles({ size: "sm" })} href="/books/new">
            Novo Projeto
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      {menuOpen ? (
        <div
          id="mobile-menu"
          className="border-t border-border/60 bg-surface px-6 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-2">
            {MAIN_NAV.map(renderNavItem)}
            <Link className={buttonStyles({ className: "justify-center" })} href="/books/new">
              Novo Projeto
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
