"use client";

import { useMemo, useState } from "react";

import type { ParagraphFormState } from "@/hooks/useParagraphs";
import { useParagraphs } from "@/hooks/useParagraphs";

export default function ParagraphsPage() {
  const {
    paragraphs,
    loading,
    error,
    emptyParagraph,
    filterChapterId,
    setFilterChapterId,
    createParagraph,
    updateParagraph,
    deleteParagraph
  } = useParagraphs();
  const [form, setForm] = useState<ParagraphFormState>(emptyParagraph);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const isEditing = Boolean(form.id);
  const status = useMemo(() => {
    if (loading) {
      return "Carregando...";
    }
    if (error) {
      return error;
    }
    if (message) {
      return message;
    }
    return "";
  }, [loading, error, message]);

  const handleSubmit = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (isEditing && form.id) {
        await updateParagraph(form.id, form);
        setMessage("Paragrafo atualizado.");
      } else {
        await createParagraph(form);
        setMessage("Paragrafo criado.");
      }
      setForm(emptyParagraph);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    setMessage("");
    try {
      await deleteParagraph(id);
      setMessage("Paragrafo removido.");
      if (form.id === id) {
        setForm(emptyParagraph);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao remover.");
    } finally {
      setBusy(false);
    }
  };

  const handleSelect = (id: string) => {
    const paragraph = paragraphs.find((item) => item.id === id);
    if (!paragraph) {
      return;
    }
    setForm({
      id: paragraph.id,
      chapter_id: paragraph.chapter_id,
      order: paragraph.order,
      original_text: paragraph.original_text,
      translated_text: paragraph.translated_text ?? "",
      status: paragraph.status
    });
  };

  return (
    <section className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Conteudo</p>
          <h1>Paragrafos</h1>
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => setForm(emptyParagraph)}>
            Limpar
          </button>
          <button className="primary" onClick={handleSubmit} disabled={busy}>
            {isEditing ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </header>

      <div className="card two-columns">
        <div className="form-grid">
          <div className="field">
            <label>Filtro por capitulo</label>
            <input
              value={filterChapterId}
              onChange={(event) => setFilterChapterId(event.target.value)}
              placeholder="chapter_id"
            />
          </div>
          <div className="field">
            <label>Chapter ID</label>
            <input
              value={form.chapter_id}
              onChange={(event) => setForm({ ...form, chapter_id: event.target.value })}
              placeholder="chapter_id"
            />
          </div>
          <div className="field">
            <label>Ordem</label>
            <input
              type="number"
              value={form.order}
              onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
            />
          </div>
          <div className="field">
            <label>Texto original</label>
            <textarea
              value={form.original_text}
              onChange={(event) => setForm({ ...form, original_text: event.target.value })}
              placeholder="Texto original"
            />
          </div>
          <div className="field">
            <label>Texto traduzido</label>
            <textarea
              value={form.translated_text}
              onChange={(event) => setForm({ ...form, translated_text: event.target.value })}
              placeholder="Texto traduzido"
            />
          </div>
          <div className="field">
            <label>Status</label>
            <input
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              placeholder="pending"
            />
          </div>
        </div>
        <div className="card">
          <h2>Resumo</h2>
          <p className="muted">Total de paragrafos: {paragraphs.length}</p>
          <p className="muted">{status}</p>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Ordem</th>
            <th>Original</th>
            <th>Traduzido</th>
            <th>Status</th>
            <th>Chapter</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {paragraphs.map((paragraph) => (
            <tr key={paragraph.id}>
              <td>{paragraph.order}</td>
              <td>{paragraph.original_text}</td>
              <td>{paragraph.translated_text ?? "-"}</td>
              <td>{paragraph.status}</td>
              <td>{paragraph.chapter_id}</td>
              <td>
                <div className="table-actions">
                  <button className="ghost" onClick={() => handleSelect(paragraph.id)}>
                    Editar
                  </button>
                  <button className="danger" onClick={() => handleDelete(paragraph.id)} disabled={busy}>
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {paragraphs.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                Nenhum paragrafo encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
