import { APP_COMPANY, APP_NAME, APP_VERSION } from "@/config/app";

export function AppFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
        <p>
          {APP_NAME} · v{APP_VERSION}
        </p>
        <p>© {new Date().getFullYear()} {APP_COMPANY}. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
