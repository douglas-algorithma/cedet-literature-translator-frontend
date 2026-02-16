"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { buttonStyles, Button } from "@/components/common/Button";
import { KeyboardShortcutsModal } from "@/components/common/KeyboardShortcutsModal";
import { ICONS } from "@/config/icons";
import { APP_NAME, APP_TAGLINE } from "@/config/app";
import { MAIN_NAV } from "@/config/navigation";
import { useKeyboardShortcuts } from "@/lib/hooks";
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
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const MenuIcon = ICONS.menu;

  useKeyboardShortcuts(
    {
      "ctrl+n": (event) => {
        event.preventDefault();
        router.push("/books/new");
      },
      "ctrl+s": (event) => {
        event.preventDefault();
        const form = document.querySelector("form");
        if (form && "requestSubmit" in form) {
          (form as HTMLFormElement).requestSubmit();
        } else {
          toast.message("Nenhum formulário ativo para salvar.");
        }
      },
      "ctrl+g": (event) => {
        event.preventDefault();
        const match = pathname?.match(/^\/books\/([^/]+)/);
        if (match?.[1]) {
          router.push(`/books/${match[1]}/glossary`);
        } else {
          toast.message("Abra um livro para acessar o glossário.");
        }
      },
      "?": (event) => {
        event.preventDefault();
        setShortcutsOpen(true);
      },
    },
    true,
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
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
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:inline-flex"
            onClick={() => setShortcutsOpen(true)}
          >
            Atalhos
          </Button>
          <Button variant="outline" size="sm" className="hidden lg:inline-flex">
            Suporte
          </Button>
          <Link className={buttonStyles({ size: "sm", className: "hidden sm:inline-flex" })} href="/books/new">
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
          className="border-t border-border/60 bg-surface px-4 py-4 sm:px-6 md:hidden"
        >
          <nav className="flex flex-col gap-2">
            {MAIN_NAV.map(renderNavItem)}
            <Link className={buttonStyles({ className: "justify-center" })} href="/books/new">
              Novo Projeto
            </Link>
          </nav>
        </div>
      ) : null}

      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </header>
  );
}
