"use client";

import { useMemo, useState } from "react";

import type { BookFormState } from "@/hooks/useBooks";
import { useBooks } from "@/hooks/useBooks";

export default function BooksPage() {
  const { books, loading, error, emptyBook, createBook, updateBook, deleteBook } = useBooks();
  const [form, setForm] = useState<BookFormState>(emptyBook);
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
        await updateBook(form.id, form);
        setMessage("Livro atualizado.");
      } else {
        await createBook(form);
        setMessage("Livro criado.");
      }
      setForm(emptyBook);
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
      await deleteBook(id);
      setMessage("Livro removido.");
      if (form.id === id) {
        setForm(emptyBook);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao remover.");
    } finally {
      setBusy(false);
    }
  };

  const handleSelect = (id: string) => {
    const book = books.find((item) => item.id === id);
    if (!book) {
      return;
    }
    setForm({
      id: book.id,
      title: book.title,
      author: book.author,
      source_language: book.source_language,
      target_language: book.target_language
    });
  };

  return (
    <section className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1>Livros</h1>
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => setForm(emptyBook)}>
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
            <label>Titulo</label>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Titulo do livro"
            />
          </div>
          <div className="field">
            <label>Autor</label>
            <input
              value={form.author}
              onChange={(event) => setForm({ ...form, author: event.target.value })}
              placeholder="Autor"
            />
          </div>
          <div className="field">
            <label>Idioma origem</label>
            <input
              value={form.source_language}
              onChange={(event) => setForm({ ...form, source_language: event.target.value })}
              placeholder="en"
            />
          </div>
          <div className="field">
            <label>Idioma destino</label>
            <input
              value={form.target_language}
              onChange={(event) => setForm({ ...form, target_language: event.target.value })}
              placeholder="pt-BR"
            />
          </div>
        </div>
        <div className="card">
          <h2>Resumo</h2>
          <p className="muted">Total de livros: {books.length}</p>
          <p className="muted">{status}</p>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Titulo</th>
            <th>Autor</th>
            <th>Origem</th>
            <th>Destino</th>
            <th>Status</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.source_language}</td>
              <td>{book.target_language}</td>
              <td>{book.status}</td>
              <td>
                <div className="table-actions">
                  <button className="ghost" onClick={() => handleSelect(book.id)}>
                    Editar
                  </button>
                  <button className="danger" onClick={() => handleDelete(book.id)} disabled={busy}>
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {books.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                Nenhum livro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
