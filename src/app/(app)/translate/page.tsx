"use client";

import { useEffect } from "react";

import { useGlossaryLookup } from "@/hooks/useGlossaryLookup";
import { useTranslationWorkspace } from "@/hooks/useTranslationWorkspace";

/**
 * Renders the translation workspace page.
 *
 * Returns:
 *   JSX element with workspace layout.
 */
export default function TranslatePage() {
  const {
    state,
    selectedParagraph,
    loadParagraphs,
    selectParagraph,
    updateField,
    translateSelected,
    saveTranslation
  } = useTranslationWorkspace();

  useEffect(() => {
    void loadParagraphs();
  }, [loadParagraphs]);

  const { state: glossaryState } = useGlossaryLookup(
    state.bookId,
    selectedParagraph?.original_text ?? ""
  );

  const meta = state.meta;
  const agentCount = meta ? Object.keys(meta.agent_outputs).length : 0;
  const memoryMatches = buildMemoryMatches(state.paragraphs, selectedParagraph);

  return (
    <section className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Traducao</h1>
        </div>
        <div className="actions">
          <button className="ghost" onClick={loadParagraphs} disabled={state.loading}>
            Atualizar lista
          </button>
          <button className="primary" onClick={translateSelected} disabled={state.translating}>
            Traduzir
          </button>
        </div>
      </header>

      <div className="card workspace-filters">
        <div className="field">
          <label>Book ID</label>
          <input
            value={state.bookId}
            onChange={(event) => updateField("bookId", event.target.value)}
            placeholder="book-1"
          />
        </div>
        <div className="field">
          <label>Chapter ID</label>
          <input
            value={state.chapterId}
            onChange={(event) => updateField("chapterId", event.target.value)}
            placeholder="chapter-id"
          />
        </div>
        <div className="field">
          <label>Numero do capitulo</label>
          <input
            type="number"
            value={state.chapterNumber}
            onChange={(event) => updateField("chapterNumber", Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Idioma origem</label>
          <input
            value={state.sourceLanguage}
            onChange={(event) => updateField("sourceLanguage", event.target.value)}
          />
        </div>
        <div className="field">
          <label>Idioma destino</label>
          <input
            value={state.targetLanguage}
            onChange={(event) => updateField("targetLanguage", event.target.value)}
          />
        </div>
      </div>

      <div className="workspace-grid">
        <aside className="card workspace-list">
          <h2>Paragrafos</h2>
          {state.loading && <p className="muted">Carregando paragrafos...</p>}
          {!state.loading && state.paragraphs.length === 0 && (
            <p className="muted">Informe um chapter_id para listar.</p>
          )}
          <ul className="paragraph-list">
            {state.paragraphs.map((paragraph) => (
              <li key={paragraph.id}>
                <button
                  className={
                    paragraph.id === state.selectedId ? "paragraph-item active" : "paragraph-item"
                  }
                  onClick={() => selectParagraph(paragraph.id)}
                >
                  <span>#{paragraph.order}</span>
                  <span className="muted">{paragraph.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="card workspace-editor">
          <div className="page-header">
            <div>
              <h2>Edicao</h2>
              {selectedParagraph && (
                <p className="muted">Paragrafo #{selectedParagraph.order}</p>
              )}
            </div>
            <div className="actions">
              <button
                className="ghost"
                onClick={() => {
                  const index = state.paragraphs.findIndex(
                    (item) => item.id === state.selectedId
                  );
                  if (index > 0) {
                    selectParagraph(state.paragraphs[index - 1].id);
                  }
                }}
                disabled={!selectedParagraph}
              >
                Anterior
              </button>
              <button
                className="ghost"
                onClick={() => {
                  const index = state.paragraphs.findIndex(
                    (item) => item.id === state.selectedId
                  );
                  if (index >= 0 && index < state.paragraphs.length - 1) {
                    selectParagraph(state.paragraphs[index + 1].id);
                  }
                }}
                disabled={!selectedParagraph}
              >
                Proximo
              </button>
              <button className="secondary" onClick={saveTranslation} disabled={state.saving}>
                Salvar
              </button>
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Texto original</label>
              <textarea value={selectedParagraph?.original_text ?? ""} readOnly />
            </div>
            <div className="field">
              <label>Texto traduzido</label>
              <textarea
                value={state.translatedText}
                onChange={(event) => updateField("translatedText", event.target.value)}
                placeholder="Traduza ou revise aqui"
              />
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={state.translationStatus}
                onChange={(event) => updateField("translationStatus", event.target.value)}
              >
                <option value="pending">pending</option>
                <option value="translated">translated</option>
                <option value="approved">approved</option>
              </select>
            </div>
            {state.error && <p className="muted">{state.error}</p>}
          </div>
        </div>

        <aside className="card workspace-context">
          <h2>Contexto e agentes</h2>
          {!meta && <p className="muted">Execute uma traducao para ver detalhes.</p>}
          {meta && (
            <div className="form-grid">
              <p className="muted">Status: {meta.status}</p>
              <p className="muted">Strategy: {meta.strategy ?? "-"}</p>
              <p className="muted">Thread: {meta.thread_id ?? "-"}</p>
              <p className="muted">Agentes usados: {agentCount}</p>
            </div>
          )}
          <div className="divider" />
          <h3>Glossario sugerido</h3>
          {glossaryState.loading && <p className="muted">Carregando glossario...</p>}
          {!glossaryState.loading && glossaryState.matches.length === 0 && (
            <p className="muted">Nenhum termo encontrado para este paragrafo.</p>
          )}
          <ul className="list">
            {glossaryState.matches.map((term) => (
              <li key={term.id}>
                {term.source_term} → {term.target_term}
              </li>
            ))}
          </ul>
          <div className="divider" />
          <h3>Memoria de traducao</h3>
          {memoryMatches.length === 0 && (
            <p className="muted">Nenhum segmento semelhante neste capitulo.</p>
          )}
          <ul className="list">
            {memoryMatches.map((match) => (
              <li key={match.id}>
                <span className="muted">{match.original}</span>
                <br />
                {match.translated}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

type MemoryMatch = {
  id: string;
  original: string;
  translated: string;
};

/**
 * Builds translation memory suggestions from chapter data.
 *
 * Args:
 *   paragraphs: Chapter paragraphs.
 *   selected: Selected paragraph.
 *
 * Returns:
 *   List of memory matches.
 */
function buildMemoryMatches(
  paragraphs: { id: string; original_text: string; translated_text: string | null }[],
  selected: { id: string; original_text: string } | null
): MemoryMatch[] {
  if (!selected) {
    return [];
  }
  const text = selected.original_text.trim();
  if (!text) {
    return [];
  }
  return paragraphs
    .filter(
      (paragraph) =>
        paragraph.id !== selected.id &&
        paragraph.original_text.trim() === text &&
        paragraph.translated_text
    )
    .slice(0, 3)
    .map((paragraph) => ({
      id: paragraph.id,
      original: paragraph.original_text,
      translated: paragraph.translated_text ?? ""
    }));
}
