import { NewBookForm } from "@/components/book/NewBookForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGE_TITLES } from "@/config/app";

export default function NewBookPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={PAGE_TITLES.newBook}
        description="Cadastre os metadados principais para iniciar a tradução."
      />
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
        <NewBookForm />
      </div>
    </div>
  );
}
