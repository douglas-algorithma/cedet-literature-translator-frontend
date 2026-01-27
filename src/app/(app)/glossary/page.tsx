"use client";

import { useMemo, useState } from "react";

import type { GlossaryFormState } from "@/hooks/useGlossary";
import { useGlossary } from "@/hooks/useGlossary";

const emptyForm: GlossaryFormState = {
  book_id: "",
  source_term: "",
  target_term: "",
  context: ""
};

export default function GlossaryPage() {
  const { state, setFilterBookId, createTerm, updateTerm, deleteTerm, importJson, importFile } =
    useGlossary();
  const [form, setForm] = useState<GlossaryFormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const isEditing = Boolean(form.id);
  const terms = state.terms;
  const status = useMemo(() => {
    if (state.loading) {
      return "Carregando...";
    }
    if (state.error) {
      return state.error;
    }
    if (message) {
      return message;
    }
    return "";
  }, [state.loading, state.error, message]);

  const handleSubmit = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (isEditing && form.id) {
        await updateTerm(form.id, form);
        setMessage("Termo atualizado.");
      } else {
        await createTerm(form);
        setMessage("Termo criado.");
      }
      setForm(emptyForm);
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
      await deleteTerm(id);
      setMessage("Termo removido.");
      if (form.id === id) {
        setForm(emptyForm);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao remover.");
    } finally {
      setBusy(false);
    }
  };

  const handleImportJson = async () => {
    setBusy(true);
    setMessage("");
    try {
      await importJson([{ ...form }]);
      setMessage("Importacao concluida.");
      setForm(emptyForm);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao importar.");
    } finally {
      setBusy(false);
    }
  };

  const handleFileImport = async (file: File | null) => {
    if (!file) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await importFile(file);
      setMessage("Arquivo importado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao importar.");
    } finally {
      setBusy(false);
    }
  };

  const handleSelect = (id: string) => {
    const term = terms.find((item) => item.id === id);
    if (!term) {
      return;
    }
    setForm({
      id: term.id,
      book_id: term.book_id ?? "",
      source_term: term.source_term,
      target_term: term.target_term,
      context: term.context
    });
  };

  return (
    <section className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Gestao de termos</p>
          <h1>Glossario</h1>
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => setForm(emptyForm)}>
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
              value={state.filterBookId}
              onChange={(event) => setFilterBookId(event.target.value)}
              placeholder="book_id"
            />
          </div>
          <div className="field">
            <label>Livro (opcional)</label>
            <input
              value={form.book_id}
              onChange={(event) => setForm({ ...form, book_id: event.target.value })}
              placeholder="book_id"
            />
          </div>
          <div className="field">
            <label>Termo origem</label>
            <input
              value={form.source_term}
              onChange={(event) => setForm({ ...form, source_term: event.target.value })}
              placeholder="Termo original"
            />
          </div>
          <div className="field">
            <label>Termo alvo</label>
            <input
              value={form.target_term}
              onChange={(event) => setForm({ ...form, target_term: event.target.value })}
              placeholder="Termo traduzido"
            />
          </div>
          <div className="field">
            <label>Contexto</label>
            <textarea
              value={form.context}
              onChange={(event) => setForm({ ...form, context: event.target.value })}
              placeholder="Contexto e observacoes"
            />
          </div>
          <div className="actions">
            <button className="secondary" onClick={handleImportJson} disabled={busy}>
              Importar JSON do formulario
            </button>
            <label className="secondary">
              Importar CSV ou JSON
              <input
                type="file"
                hidden
                accept=".csv,.json"
                onChange={(event) => handleFileImport(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
        <div className="card">
          <h2>Resumo</h2>
          <p className="muted">Total de termos: {terms.length}</p>
          <p className="muted">{status}</p>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Livro</th>
            <th>Origem</th>
            <th>Destino</th>
            <th>Contexto</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {terms.map((term) => (
            <tr key={term.id}>
              <td>{term.book_id ?? "-"}</td>
              <td>{term.source_term}</td>
              <td>{term.target_term}</td>
              <td>{term.context}</td>
              <td>
                <div className="table-actions">
                  <button className="ghost" onClick={() => handleSelect(term.id)}>
                    Editar
                  </button>
                  <button className="danger" onClick={() => handleDelete(term.id)} disabled={busy}>
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {terms.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                Nenhum termo encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
