"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { Toggle } from "@/components/common/Toggle";
import { GlossaryTermModal, toFormValues, type GlossaryTermFormValues } from "@/components/glossary/GlossaryTermModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGE_TITLES } from "@/config/app";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { glossaryService } from "@/services/glossaryService";
import { useGlossaryStore } from "@/stores/glossaryStore";
import type { GlossaryTerm } from "@/types/glossary";

export default function GlossaryPage({ params }: { params: { bookId: string } }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [category, setCategory] = useState("");
  const [showPending, setShowPending] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [deleteTerm, setDeleteTerm] = useState<GlossaryTerm | null>(null);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<"source" | "target" | "category">("source");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isCreating, setIsCreating] = useState(false);
  const [draftValues, setDraftValues] = useState<GlossaryTermFormValues | null>(null);

  const { pendingTerms, approvePendingTerm, rejectPendingTerm } = useGlossaryStore();

  const { data: terms = [], isLoading, error, refetch } = useQuery({
    queryKey: ["glossary", params.bookId],
    queryFn: () => glossaryService.list(params.bookId),
  });

  const categories = useMemo(() => {
    const values = terms
      .map((term) => term.category)
      .filter((value): value is string => Boolean(value && value.trim().length > 0));
    return Array.from(new Set(values)).sort();
  }, [terms]);

  const filteredTerms = useMemo(() => {
    const value = debouncedSearch.trim().toLowerCase();
    const filtered = terms.filter((term) => {
      const matchesSearch =
        !value ||
        term.sourceTerm.toLowerCase().includes(value) ||
        term.targetTerm.toLowerCase().includes(value) ||
        term.context.toLowerCase().includes(value);
      const matchesCategory = !category || term.category === category;
      return matchesSearch && matchesCategory;
    });
    const sorted = [...filtered].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "source") return a.sourceTerm.localeCompare(b.sourceTerm) * direction;
      if (sortKey === "target") return a.targetTerm.localeCompare(b.targetTerm) * direction;
      return (a.category ?? "").localeCompare(b.category ?? "") * direction;
    });
    return sorted;
  }, [category, debouncedSearch, sortDirection, sortKey, terms]);

  const toggleSort = (key: typeof sortKey) => {
    if (key === sortKey) {
      setSortDirection((state) => (state === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const handleSaveTerm = async (values: GlossaryTermFormValues) => {
    setSaving(true);
    try {
      if (selectedTerm) {
        await glossaryService.update(selectedTerm.id, {
          sourceTerm: values.sourceTerm,
          targetTerm: values.targetTerm,
          context: values.context,
          category: values.category,
          caseSensitive: values.caseSensitive,
          wholeWord: values.wholeWord,
        });
        toast.success("Termo atualizado");
      } else {
        await glossaryService.create({
          bookId: params.bookId,
          sourceTerm: values.sourceTerm,
          targetTerm: values.targetTerm,
          context: values.context,
          category: values.category,
          caseSensitive: values.caseSensitive,
          wholeWord: values.wholeWord,
        });
        toast.success("Termo criado");
      }
      await refetch();
      setSelectedTerm(null);
      setIsCreating(false);
    } catch (err) {
      toast.error((err as Error).message ?? "Não foi possível salvar o termo");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTerm = async () => {
    if (!deleteTerm) return;
    setSaving(true);
    try {
      await glossaryService.delete(deleteTerm.id);
      toast.success("Termo removido");
      setDeleteTerm(null);
      await refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Não foi possível remover o termo");
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePending = async (term: typeof pendingTerms[number]) => {
    setSaving(true);
    try {
      await glossaryService.create({
        bookId: params.bookId,
        sourceTerm: term.term,
        targetTerm: term.suggestedTranslation,
        context: term.context ?? "",
      });
      approvePendingTerm(term);
      toast.success("Sugestão aprovada");
      await refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Não foi possível aprovar a sugestão");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={PAGE_TITLES.glossary}
        description="Gerencie termos técnicos e garanta consistência em toda a obra."
        action={
          <Button
            onClick={() => {
              setDraftValues(null);
              setSelectedTerm(null);
              setIsCreating(true);
            }}
          >
            Adicionar termo
          </Button>
        }
      />

      <div className="grid gap-4 rounded-3xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] md:grid-cols-[2fr_1fr_1fr]">
        <Input
          placeholder="Buscar termos"
          aria-label="Buscar termos do glossário"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Categoria
            <select
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Todas</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          <Toggle
            checked={showPending}
            onChange={setShowPending}
            label={`Pendentes: ${showPending ? "visíveis" : "ocultos"}`}
          />
        </div>
      </div>

      {showPending && pendingTerms.length > 0 ? (
        <div className="space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text">Termos pendentes</h2>
              <p className="text-sm text-text-muted">
                Sugestões recentes do sistema durante a tradução.
              </p>
            </div>
            <Badge variant="warning">{pendingTerms.length} pendentes</Badge>
          </div>
          <div className="space-y-3">
            {pendingTerms.map((term) => (
              <div
                key={`${term.term}-${term.paragraphId ?? ""}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted p-4 text-sm text-text md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-text">
                    {term.term} → {term.suggestedTranslation}
                  </p>
                  {term.context ? (
                    <p className="text-xs text-text-muted">{term.context}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleApprovePending(term)} loading={saving}>
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setDraftValues({
                        sourceTerm: term.term,
                        targetTerm: term.suggestedTranslation,
                        context: term.context ?? "",
                        category: "",
                        caseSensitive: false,
                        wholeWord: false,
                      });
                      setSelectedTerm(null);
                      setIsCreating(true);
                    }}
                  >
                    Editar e aprovar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => rejectPendingTerm(term)}>
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr_auto] gap-3 border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
            <button type="button" onClick={() => toggleSort("source")} className="text-left">
              Termo
            </button>
            <button type="button" onClick={() => toggleSort("target")} className="text-left">
              Tradução
            </button>
            <button type="button" onClick={() => toggleSort("category")} className="text-left">
              Categoria
            </button>
            <span>Contexto</span>
            <span>Ações</span>
          </div>
          {filteredTerms.map((term) => (
            <div
              key={term.id}
              className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr_auto] gap-3 px-6 py-4 text-sm text-text"
            >
              <span>{term.sourceTerm}</span>
              <span>{term.targetTerm}</span>
              <span className="text-text-muted">{term.category || "—"}</span>
              <div className="text-text-muted">
                <details className="group">
                  <summary className="cursor-pointer text-xs font-semibold text-text">
                    Ver contexto
                  </summary>
                  <p className="mt-2 text-sm text-text-muted">{term.context || "Sem contexto."}</p>
                </details>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info">Ativo</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTerm(term);
                    setIsCreating(true);
                  }}
                >
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTerm(term)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
            </div>
          </div>
        </div>
      )}

      {isCreating ? (
        <GlossaryTermModal
          key={`${selectedTerm?.id ?? "new"}-${draftValues?.sourceTerm ?? ""}`}
          open={isCreating}
          title={selectedTerm ? "Editar termo" : "Adicionar termo"}
          categories={categories}
          initialValues={draftValues ?? toFormValues(selectedTerm ?? undefined)}
          onClose={() => {
            setIsCreating(false);
            setSelectedTerm(null);
            setDraftValues(null);
          }}
          onSubmit={handleSaveTerm}
          loading={saving}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTerm)}
        title="Excluir termo"
        description="Esta ação remove o termo do glossário."
        confirmText="Excluir"
        isDanger
        loading={saving}
        onConfirm={handleDeleteTerm}
        onClose={() => setDeleteTerm(null)}
      />
    </div>
  );
}
