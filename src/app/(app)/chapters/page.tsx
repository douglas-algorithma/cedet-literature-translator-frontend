"use client";

import { useMemo, useState } from "react";

import type { ChapterFormState } from "@/hooks/useChapters";
import { useChapters } from "@/hooks/useChapters";

export default function ChaptersPage() {
  const {
    chapters,
    loading,
    error,
    emptyChapter,
    filterBookId,
    setFilterBookId,
    createChapter,
    updateChapter,
    deleteChapter
  } = useChapters();
  const [form, setForm] = useState<ChapterFormState>(emptyChapter);
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
        await updateChapter(form.id, form);
        setMessage("Capitulo atualizado.");
      } else {
        await createChapter(form);
        setMessage("Capitulo criado.");
      }
      setForm(emptyChapter);
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
      await deleteChapter(id);
      setMessage("Capitulo removido.");
      if (form.id === id) {
        setForm(emptyChapter);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao remover.");
    } finally {
      setBusy(false);
    }
  };

  const handleSelect = (id: string) => {
    const chapter = chapters.find((item) => item.id === id);
    if (!chapter) {
      return;
    }
    setForm({
      id: chapter.id,
      book_id: chapter.book_id,
      title: chapter.title,
      order: chapter.order,
      epigraph: chapter.epigraph ?? "",
      insertion_mode: chapter.insertion_mode,
      status: chapter.status
    });
  };

  return (
    <section className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Organizacao</p>
          <h1>Capitulos</h1>
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => setForm(emptyChapter)}>
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
            <label>Filtro por livro</label>
            <input
              value={filterBookId}
              onChange={(event) => setFilterBookId(event.target.value)}
              placeholder="book_id"
            />
          </div>
          <div className="field">
            <label>Book ID</label>
            <input
              value={form.book_id}
              onChange={(event) => setForm({ ...form, book_id: event.target.value })}
              placeholder="book_id"
            />
          </div>
          <div className="field">
            <label>Titulo</label>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Titulo do capitulo"
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
            <label>Epigrafe</label>
            <textarea
              value={form.epigraph}
              onChange={(event) => setForm({ ...form, epigraph: event.target.value })}
              placeholder="Epigrafe opcional"
            />
          </div>
          <div className="field">
            <label>Modo de insercao</label>
            <select
              value={form.insertion_mode}
              onChange={(event) => setForm({ ...form, insertion_mode: event.target.value })}
              disabled={isEditing}
            >
              <option value="paragraph">paragraph</option>
              <option value="bulk">bulk</option>
            </select>
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
          <p className="muted">Total de capitulos: {chapters.length}</p>
          <p className="muted">{status}</p>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Ordem</th>
            <th>Titulo</th>
            <th>Status</th>
            <th>Insercao</th>
            <th>Book</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map((chapter) => (
            <tr key={chapter.id}>
              <td>{chapter.order}</td>
              <td>{chapter.title}</td>
              <td>{chapter.status}</td>
              <td>{chapter.insertion_mode}</td>
              <td>{chapter.book_id}</td>
              <td>
                <div className="table-actions">
                  <button className="ghost" onClick={() => handleSelect(chapter.id)}>
                    Editar
                  </button>
                  <button className="danger" onClick={() => handleDelete(chapter.id)} disabled={busy}>
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {chapters.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                Nenhum capitulo encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
