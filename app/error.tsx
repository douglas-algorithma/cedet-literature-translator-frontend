"use client";

import { Button } from "@/components/common/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold text-text">Algo saiu do esperado</h1>
      <p className="text-sm text-text-muted">
        {error.message || "Houve um problema ao carregar esta página."}
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
