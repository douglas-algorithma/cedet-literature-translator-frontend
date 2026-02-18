"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Textarea } from "@/components/common/Textarea";
import type { AgentAnalysis } from "@/types/translation";

type HitlPanelProps = {
  open: boolean;
  paragraphNumber: number;
  originalText: string;
  previousText?: string;
  nextText?: string;
  translation: string;
  analysis?: AgentAnalysis;
  suggestions?: string[];
  onApprove: (translation: string) => void;
  onRefine: (feedback: string, currentTranslation: string) => void;
  onClose: () => void;
};

export function HitlPanel({
  open,
  paragraphNumber,
  originalText,
  previousText,
  nextText,
  translation,
  analysis,
  suggestions,
  onApprove,
  onRefine,
  onClose,
}: HitlPanelProps) {
  const [draft, setDraft] = useState(() => translation);
  const [feedback, setFeedback] = useState("");
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onApprove(draft);
      }
      if (event.key.toLowerCase() === "r" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onRefine(feedback, draft);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draft, edited, feedback, onApprove, onRefine, open]);

  const hasSuggestions = Boolean(suggestions && suggestions.length > 0);
  const glossaryItems = analysis?.glossary ?? [];
  const consistencyItems = analysis?.consistencyWarnings ?? [];

  const analysisSummary = useMemo(() => {
    const items: string[] = [];
    if (analysis?.semanticScore !== undefined) {
      items.push(`Fidelidade semântica: ${analysis.semanticScore}%`);
    }
    if (analysis?.styleScore !== undefined) {
      items.push(`Preservação de estilo: ${analysis.styleScore}%`);
    }
    if (analysis?.notes?.length) {
      items.push(...analysis.notes);
    }
    return items;
  }, [analysis]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Revisão HITL · Parágrafo ${paragraphNumber}`}
      size="xl"
      fullScreenOnMobile
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={() => onApprove(draft)}>
            Aprovar com edições
          </Button>
          <Button onClick={() => onApprove(translation)}>Aprovar</Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="space-y-2 rounded-2xl border border-border bg-surface-muted p-4">
          <p className="text-xs font-semibold text-text-muted">Contexto imediato</p>
          {previousText ? (
            <p className="text-sm text-text-muted">Anterior: {previousText}</p>
          ) : null}
          <p className="text-sm text-text">
            Atual: <span className="text-base font-bold text-text">{originalText}</span>
          </p>
          {nextText ? (
            <p className="text-sm text-text-muted">Próximo: {nextText}</p>
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Tradução proposta</h3>
            {edited ? (
              <button
                type="button"
                className="text-xs font-semibold text-brand"
                onClick={() => {
                  setDraft(translation);
                  setEdited(false);
                }}
              >
                Restaurar original
              </button>
            ) : null}
          </div>
          <Textarea
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setEdited(event.target.value !== translation);
            }}
            rows={6}
          />
          <p className="text-xs text-text-muted">
            {draft.length} caracteres · Ctrl/Cmd + Enter para aprovar
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text">Análises dos agentes</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-text-muted">Glossary Agent</p>
              {glossaryItems.length ? (
                <ul className="mt-2 space-y-1 text-sm text-text">
                  {glossaryItems.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-text-muted">Nenhum termo destacado.</p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-text-muted">Consistency Agent</p>
              {consistencyItems.length ? (
                <ul className="mt-2 space-y-1 text-sm text-text">
                  {consistencyItems.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-text-muted">Sem alertas de consistência.</p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4 md:col-span-2">
              <p className="text-xs font-semibold text-text-muted">Semantic / Style Agent</p>
              {analysisSummary.length ? (
                <ul className="mt-2 space-y-1 text-sm text-text">
                  {analysisSummary.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-text-muted">Nenhuma observação adicional.</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text">Sugestões do sistema</h3>
          {hasSuggestions ? (
            <ul className="space-y-2 text-sm text-text">
              {suggestions?.map((suggestion, index) => (
                <li key={`${suggestion}-${index}`} className="rounded-xl border border-border bg-surface p-3">
                  {suggestion}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">Nenhuma sugestão disponível.</p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text">Feedback para refinamento</h3>
          <Textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Explique o que precisa ser melhorado ou adicione instruções específicas..."
            rows={4}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onRefine(feedback, draft)}>
              Solicitar refinamento
            </Button>
            <span className="text-xs text-text-muted">Ctrl/Cmd + R para refinamento rápido</span>
          </div>
        </section>
      </div>
    </Modal>
  );
}
