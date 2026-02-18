"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/common/Button";
import { isAuthenticated, logout } from "@/services/authService";
import { KeyboardShortcutsModal } from "@/components/common/KeyboardShortcutsModal";
import { ICONS } from "@/config/icons";
import { APP_NAME, APP_TAGLINE } from "@/config/app";
import { useKeyboardShortcuts, useScrollHide } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);
  const MenuIcon = ICONS.menu;
  const isLoginRoute = pathname === "/login" || pathname?.startsWith("/login/");
  const isHidden = useScrollHide({
    threshold: 84,
    minDelta: 6,
    disabled: mobileSidebarOpen || isLoginRoute,
  });

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
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 bg-surface/90 backdrop-blur transition-transform duration-300 ease-out focus-within:translate-y-0",
        isHidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/"
            aria-label="Ir para o dashboard"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
          >
            <span className="text-lg font-bold">C</span>
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{APP_NAME}</p>
            <p className="hidden truncate text-[11px] text-text-muted lg:block">{APP_TAGLINE}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5">
          {isAuthenticated() ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              Sair
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="hidden xl:inline-flex"
            onClick={() => setShortcutsOpen(true)}
          >
            Atalhos
          </Button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text md:hidden"
            onClick={toggleMobileSidebar}
            aria-label={mobileSidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-app-sidebar"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </header>
  );
}
