"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { BookCard } from "@/components/book/BookCard";
import { BookCardSkeleton } from "@/components/book/BookCardSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { buttonStyles } from "@/components/common/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGE_TITLES } from "@/config/app";
import { ORDER_OPTIONS, STATUS_OPTIONS } from "@/config/books";
import { useDebouncedValue } from "@/lib/hooks";
import { getBookProgress } from "@/lib/utils";
import { booksService } from "@/services/booksService";
import type { Book } from "@/types/book";

const applySearch = (books: Book[], query: string) => {
  if (!query) return books;
  const normalized = query.toLowerCase();
  return books.filter(
    (book) =>
      book.title.toLowerCase().includes(normalized) ||
      book.author.toLowerCase().includes(normalized),
  );
};

const applyStatus = (books: Book[], status: string) => {
  if (!status || status === "all") return books;
  return books.filter((book) => book.status === status);
};

const applyOrder = (books: Book[], order: string) => {
  const sorted = [...books];
  switch (order) {
    case "alpha":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "progress":
      return sorted.sort((a, b) => getBookProgress(b) - getBookProgress(a));
    default:
      return sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }
};

const buildQueryString = (current: URLSearchParams, updates: Record<string, string>) => {
  const params = new URLSearchParams(current.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return query ? `/?${query}` : "/";
};

export function BookDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const [statusValue, setStatusValue] = useState(searchParams.get("status") ?? "all");
  const [orderValue, setOrderValue] = useState(searchParams.get("order") ?? "recent");

  const debouncedSearch = useDebouncedValue(searchValue, 300);

  const { data: books = [], isLoading, error, refetch } = useQuery({
    queryKey: ["books"],
    queryFn: () => booksService.listWithStats(),
  });

  useEffect(() => {
    const nextUrl = buildQueryString(searchParams, {
      q: debouncedSearch,
      status: statusValue,
      order: orderValue,
    });
    const current = searchParams.toString();
    const currentUrl = current ? `/?${current}` : "/";
    if (currentUrl === nextUrl) return;
    router.replace(nextUrl, { scroll: false });
  }, [debouncedSearch, statusValue, orderValue, router, searchParams]);

  const filteredBooks = useMemo(() => {
    const withSearch = applySearch(books, debouncedSearch);
    const withStatus = applyStatus(withSearch, statusValue);
    return applyOrder(withStatus, orderValue);
  }, [books, debouncedSearch, statusValue, orderValue]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={PAGE_TITLES.dashboard}
        description="Acompanhe o andamento dos seus projetos e retome traduções em poucos cliques."
        action={
          <Link className={buttonStyles({})} href="/books/new">
            Novo Livro
          </Link>
        }
      />

      <section className="grid gap-4 rounded-3xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] md:grid-cols-[2fr_1fr_1fr]">
        <Input
          placeholder="Buscar por título ou autor"
          aria-label="Buscar por título ou autor"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <Select
          aria-label="Filtrar por status"
          value={statusValue}
          onChange={(event) => setStatusValue(event.target.value)}
          options={STATUS_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
        <Select
          aria-label="Ordenar livros"
          value={orderValue}
          onChange={(event) => setOrderValue(event.target.value)}
          options={ORDER_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </section>

      {isLoading ? (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <BookCardSkeleton key={`skeleton-${index}`} />
          ))}
        </section>
      ) : error ? (
        <EmptyState
          title="Não foi possível carregar os livros"
          description="Tente novamente para atualizar a lista de projetos."
          action={
            <button className={buttonStyles({})} type="button" onClick={() => refetch()}>
              Recarregar
            </button>
          }
        />
      ) : filteredBooks.length === 0 ? (
        <EmptyState
          title="Nenhum projeto encontrado"
          description="Crie o primeiro livro para começar a traduzir com IA."
          action={
            <Link className={buttonStyles({})} href="/books/new">
              Criar projeto
            </Link>
          }
        />
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooks.map((book, index) => (
            <div
              key={book.id}
              className="h-full animate-rise"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <BookCard book={book} onDeleted={() => refetch()} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
