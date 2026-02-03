"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGE_TITLES } from "@/config/app";
import { glossaryService } from "@/services/glossaryService";

export default function GlossaryPage({ params }: { params: { bookId: string } }) {
  const [search, setSearch] = useState("");
  const { data: terms = [], isLoading, error } = useQuery({
    queryKey: ["glossary", params.bookId],
    queryFn: () => glossaryService.list(params.bookId),
  });

  const filteredTerms = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return terms;
    return terms.filter(
      (term) =>
        term.sourceTerm.toLowerCase().includes(value) ||
        term.targetTerm.toLowerCase().includes(value),
    );
  }, [terms, search]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={PAGE_TITLES.glossary}
        description="Gerencie termos técnicos e garanta consistência em toda a obra."
        action={<Button>Adicionar termo</Button>}
      />

      <div className="grid gap-4 rounded-3xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] md:grid-cols-[2fr_1fr_1fr]">
        <Input
          placeholder="Buscar termos"
          aria-label="Buscar termos do glossário"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          Categoria: todas
        </div>
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          Pendentes: ocultos
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Carregando glossário...</p>
      ) : error ? (
        <EmptyState
          title="Não foi possível carregar o glossário"
          description="Tente novamente para ver os termos do projeto."
        />
      ) : filteredTerms.length === 0 ? (
        <EmptyState
          title="Glossário vazio"
          description="Adicione termos para garantir consistência durante a tradução."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-soft)]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-3 border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
            <span>Termo</span>
            <span>Tradução</span>
            <span>Contexto</span>
            <span>Ações</span>
          </div>
          {filteredTerms.map((term) => (
            <div
              key={term.id}
              className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-3 px-6 py-4 text-sm text-text"
            >
              <span>{term.sourceTerm}</span>
              <span>{term.targetTerm}</span>
              <span className="text-text-muted">{term.context}</span>
              <div className="flex items-center gap-2">
                <Badge variant="info">Ativo</Badge>
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
