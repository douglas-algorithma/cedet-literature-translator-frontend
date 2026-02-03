import { BookDetails } from "@/components/book/BookDetails";

export default function BookDetailsPage({ params }: { params: { bookId: string } }) {
  return <BookDetails bookId={params.bookId} />;
}
