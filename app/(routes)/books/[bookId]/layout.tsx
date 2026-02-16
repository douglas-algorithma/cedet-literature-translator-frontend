import type { ReactNode } from "react";

import { BookBreadcrumb } from "@/components/layout/BookBreadcrumb";
import { BookSidebar } from "@/components/layout/BookSidebar";

export default async function BookLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;

  return (
    <div className="space-y-6">
      <BookBreadcrumb bookId={bookId} />
      <div className="grid gap-4 md:gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <BookSidebar bookId={bookId} />
        <div className="min-h-[60vh] rounded-3xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
