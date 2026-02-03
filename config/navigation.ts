export type NavItem = {
  label: string;
  href: string;
  icon: "home" | "book" | "plus" | "glossary" | "export" | "settings";
};

export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "home" },
  { label: "Novo Livro", href: "/books/new", icon: "plus" },
];

export const BOOK_NAV: NavItem[] = [
  { label: "Capítulos", href: "/books/[bookId]", icon: "book" },
  { label: "Glossário", href: "/books/[bookId]/glossary", icon: "glossary" },
  { label: "Exportação", href: "/books/[bookId]/export", icon: "export" },
];
