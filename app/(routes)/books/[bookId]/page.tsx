import { BookDetails } from "@/components/book/BookDetails";

export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;

  return <BookDetails bookId={bookId} />;
}
