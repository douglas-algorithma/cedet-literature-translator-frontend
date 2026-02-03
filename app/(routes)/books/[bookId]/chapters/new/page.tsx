import { NewChapterWizard } from "@/components/chapter/NewChapterWizard";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGE_TITLES } from "@/config/app";

export default function NewChapterPage({ params }: { params: { bookId: string } }) {
  return (
    <div className="space-y-8">
      <PageHeader
        title={PAGE_TITLES.newChapter}
        description="Defina metadados e escolha o modo de inserção do capítulo."
      />
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
        <NewChapterWizard bookId={params.bookId} />
      </div>
    </div>
  );
}
