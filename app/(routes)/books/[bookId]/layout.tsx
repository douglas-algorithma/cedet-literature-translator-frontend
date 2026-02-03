import type { ReactNode } from "react";

import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { BookSidebar } from "@/components/layout/BookSidebar";

export default function BookLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { bookId: string };
}) {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: `Livro ${params.bookId}` },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <BookSidebar bookId={params.bookId} />
        <div className="min-h-[60vh] rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
          {children}
        </div>
      </div>
    </div>
  );
}
