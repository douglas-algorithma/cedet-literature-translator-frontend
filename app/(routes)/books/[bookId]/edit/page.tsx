import { EditBookForm } from "@/components/book/EditBookForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGE_TITLES } from "@/config/app";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;

  return (
    <div className="space-y-8">
      <PageHeader
        title={PAGE_TITLES.editBook}
        description="Atualize informações do projeto e mantenha a equipe alinhada."
      />
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
        <EditBookForm bookId={bookId} />
      </div>
    </div>
  );
}
