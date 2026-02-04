"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Checkbox } from "@/components/common/Checkbox";
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

export default function GlossaryPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
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
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [bulkRejectIds, setBulkRejectIds] = useState<string[]>([]);

  const {
    pendingTerms,
    approvePendingTerm,
    approvePendingTerms,
    rejectPendingTerm,
    rejectPendingTerms,
    fetchSuggestions,
  } = useGlossaryStore();

  const { data: terms = [], isLoading, error, refetch } = useQuery({
    queryKey: ["glossary", bookId],
    queryFn: () => glossaryService.list(bookId),
  });

  useQuery({
    queryKey: ["glossary-suggestions", bookId],
    queryFn: () => fetchSuggestions(bookId),
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

  const selectedPendingSet = useMemo(() => new Set(selectedPendingIds), [selectedPendingIds]);
  const selectedPendingTerms = useMemo(
    () => pendingTerms.filter((term) => selectedPendingSet.has(term.id)),
    [pendingTerms, selectedPendingSet],
  );
  const hasPendingSelection = selectedPendingIds.length > 0;
  const allPendingSelected =
    pendingTerms.length > 0 && pendingTerms.every((term) => selectedPendingSet.has(term.id));

  useEffect(() => {
    setSelectedPendingIds((state) =>
      state.filter((id) => pendingTerms.some((term) => term.id === id)),
    );
  }, [pendingTerms]);

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
          bookId,
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
      await approvePendingTerm(term);
      toast.success("Sugestão aprovada");
      await refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Não foi possível aprovar a sugestão");
    } finally {
      setSaving(false);
    }
  };

  const handleRejectPending = async (term: typeof pendingTerms[number]) => {
    setSaving(true);
    try {
      await rejectPendingTerm(term);
      toast.success("Sugestão rejeitada");
    } catch (err) {
      toast.error((err as Error).message ?? "Não foi possível rejeitar a sugestão");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Toggle selection state for a pending suggestion.
   *
   * @param id - Pending term identifier.
   * @param checked - New selection state.
   */
  const handleTogglePendingSelection = (id: string, checked: boolean) => {
    setSelectedPendingIds((state) => {
      if (checked) {
        return state.includes(id) ? state : [...state, id];
      }
      return state.filter((value) => value !== id);
    });
  };

  /**
   * Select all pending suggestions.
   */
  const handleSelectAllPending = () => {
    setSelectedPendingIds(pendingTerms.map((term) => term.id));
  };

  /**
   * Clear pending selection.
   */
  const handleClearPendingSelection = () => {
    setSelectedPendingIds([]);
  };

  /**
   * Approve all currently selected suggestions.
   */
  const handleApproveSelected = async () => {
    if (selectedPendingTerms.length === 0) {
      return;
    }
    setSaving(true);
    try {
      await approvePendingTerms(selectedPendingTerms);
      toast.success("Sugestões aprovadas");
      setSelectedPendingIds([]);
      await refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Não foi possível aprovar as sugestões");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Approve all pending suggestions.
   */
  const handleApproveAllPending = async () => {
    if (pendingTerms.length === 0) {
      return;
    }
    setSaving(true);
    try {
      await approvePendingTerms(pendingTerms);
      toast.success("Sugestões aprovadas");
      setSelectedPendingIds([]);
      await refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Não foi possível aprovar as sugestões");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Open confirmation for bulk rejection.
   *
   * @param ids - Suggestion identifiers.
   */
  const handleRequestBulkReject = (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }
    setBulkRejectIds(ids);
  };

  /**
   * Confirm bulk rejection of suggestions.
   */
  const handleConfirmBulkReject = async () => {
    if (bulkRejectIds.length === 0) {
      return;
    }
    const termsToReject = pendingTerms.filter((term) => bulkRejectIds.includes(term.id));
    setSaving(true);
    try {
      await rejectPendingTerms(termsToReject);
      toast.success("Sugestões excluídas");
      setSelectedPendingIds((state) => state.filter((id) => !bulkRejectIds.includes(id)));
      setBulkRejectIds([]);
    } catch (err) {
      toast.error((err as Error).message ?? "Não foi possível excluir as sugestões");
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-text">Termos pendentes</h2>
              <p className="text-sm text-text-muted">
                Sugestões recentes do sistema durante a tradução.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">{pendingTerms.length} pendentes</Badge>
              {hasPendingSelection ? (
                <Badge variant="info">{selectedPendingTerms.length} selecionados</Badge>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSelectAllPending}
                disabled={allPendingSelected}
              >
                Selecionar todos
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearPendingSelection}
                disabled={!hasPendingSelection}
              >
                Limpar seleção
              </Button>
              <Button
                size="sm"
                onClick={handleApproveSelected}
                loading={saving}
                disabled={!hasPendingSelection}
              >
                Aprovar selecionados
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleApproveAllPending}
                loading={saving}
                disabled={pendingTerms.length === 0}
              >
                Aprovar todos
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleRequestBulkReject(selectedPendingIds)}
                loading={saving}
                disabled={!hasPendingSelection}
              >
                Excluir selecionados
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRequestBulkReject(pendingTerms.map((term) => term.id))}
                loading={saving}
                disabled={pendingTerms.length === 0}
              >
                Excluir todos
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {pendingTerms.map((term) => (
              <div
                key={term.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted p-4 text-sm text-text md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedPendingSet.has(term.id)}
                    onChange={(checked) => handleTogglePendingSelection(term.id, checked)}
                  />
                  <div className="space-y-1">
                    <p className="font-semibold text-text">
                      {term.term} → {term.suggestedTranslation}
                    </p>
                    {term.context ? (
                      <p className="text-xs text-text-muted">{term.context}</p>
                    ) : null}
                    {term.category ? (
                      <Badge variant="info" className="mt-1">
                        {term.category}
                      </Badge>
                    ) : null}
                  </div>
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
                        category: term.category ?? "",
                        caseSensitive: false,
                        wholeWord: false,
                      });
                      setSelectedTerm(null);
                      setIsCreating(true);
                    }}
                  >
                    Editar e aprovar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleRejectPending(term)}>
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
      <ConfirmDialog
        open={bulkRejectIds.length > 0}
        title={
          bulkRejectIds.length === pendingTerms.length
            ? "Excluir todos os termos pendentes"
            : "Excluir termos pendentes"
        }
        description="Esta ação remove as sugestões selecionadas."
        confirmText="Excluir"
        isDanger
        loading={saving}
        onConfirm={handleConfirmBulkReject}
        onClose={() => setBulkRejectIds([])}
      />
    </div>
  );
}
