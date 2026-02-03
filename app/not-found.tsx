import Link from "next/link";

import { buttonStyles } from "@/components/common/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">404</p>
      <h1 className="font-display text-3xl font-semibold text-text">Página não encontrada</h1>
      <p className="text-sm text-text-muted">
        Não conseguimos localizar o conteúdo solicitado. Volte ao dashboard para retomar o trabalho.
      </p>
      <Link className={buttonStyles({})} href="/">
        Voltar ao dashboard
      </Link>
    </div>
  );
}
