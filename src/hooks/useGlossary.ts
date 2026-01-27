import { useCallback, useEffect, useMemo, useState } from "react";

export type GlossaryTerm = {
  id: string;
  book_id: string | null;
  source_term: string;
  target_term: string;
  context: string;
  created_at: string;
};

type GlossaryInput = {
  book_id: string;
  source_term: string;
  target_term: string;
  context: string;
};

export type GlossaryFormState = GlossaryInput & {
  id?: string;
};

export function useGlossary() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterBookId, setFilterBookId] = useState("");

  const loadTerms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = filterBookId ? `?book_id=${encodeURIComponent(filterBookId)}` : "";
      const response = await fetch(`/api/glossary${query}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar glossario.");
      }
      const data = (await response.json()) as GlossaryTerm[];
      setTerms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar glossario.");
    } finally {
      setLoading(false);
    }
  }, [filterBookId]);

  useEffect(() => {
    void loadTerms();
  }, [loadTerms]);

  const createTerm = useCallback(async (payload: GlossaryInput) => {
    const response = await fetch("/api/glossary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapPayload(payload))
    });
    if (!response.ok) {
      throw new Error("Falha ao criar termo.");
    }
    await loadTerms();
  }, [loadTerms]);

  const updateTerm = useCallback(async (id: string, payload: GlossaryInput) => {
    const response = await fetch(`/api/glossary/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapPayload(payload))
    });
    if (!response.ok) {
      throw new Error("Falha ao atualizar termo.");
    }
    await loadTerms();
  }, [loadTerms]);

  const deleteTerm = useCallback(async (id: string) => {
    const response = await fetch(`/api/glossary/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      throw new Error("Falha ao remover termo.");
    }
    await loadTerms();
  }, [loadTerms]);

  const importJson = useCallback(async (payload: GlossaryInput[]) => {
    const response = await fetch("/api/glossary/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.map(mapPayload))
    });
    if (!response.ok) {
      throw new Error("Falha ao importar glossario.");
    }
    await loadTerms();
  }, [loadTerms]);

  const importFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/glossary/import", {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error("Falha ao importar arquivo.");
    }
    await loadTerms();
  }, [loadTerms]);

  const state = useMemo(() => ({ terms, loading, error, filterBookId }), [terms, loading, error, filterBookId]);

  return {
    state,
    setFilterBookId,
    loadTerms,
    createTerm,
    updateTerm,
    deleteTerm,
    importJson,
    importFile
  };
}

function mapPayload(payload: GlossaryInput) {
  return {
    book_id: payload.book_id || null,
    source_term: payload.source_term,
    target_term: payload.target_term,
    context: payload.context
  };
}
