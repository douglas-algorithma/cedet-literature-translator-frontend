"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { booksService } from "@/services/booksService";

type BookBreadcrumbProps = {
  bookId: string;
};

export function BookBreadcrumb({ bookId }: BookBreadcrumbProps) {
  const { data: book } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => booksService.get(bookId),
    staleTime: 60_000,
  });

  const bookLabel = useMemo(() => {
    const title = book?.title?.trim();
    return title ? title : `Livro ${bookId}`;
  }, [book?.title, bookId]);

  return (
    <Breadcrumb
      items={[
        { label: "Dashboard", href: "/" },
        { label: bookLabel },
      ]}
    />
  );
}
