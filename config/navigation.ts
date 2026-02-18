export type NavIcon = "home" | "book" | "plus" | "glossary" | "export" | "settings";

export type NavMatchMode = "exact" | "startsWith";

export type NavScope = "global" | "book" | "chapter";

export type NavItemKind = "route" | "quick-action";

export type NavItem = {
  id: string;
  label: string;
  hrefTemplate: string;
  icon: NavIcon;
  kind: NavItemKind;
  matchMode?: NavMatchMode;
};

export type NavSection = {
  id: string;
  label: string;
  scope: NavScope;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "global",
    label: "Geral",
    scope: "global",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        hrefTemplate: "/",
        icon: "home",
        kind: "route",
        matchMode: "exact",
      },
      {
        id: "new-book",
        label: "Novo Projeto",
        hrefTemplate: "/books/new",
        icon: "plus",
        kind: "quick-action",
        matchMode: "exact",
      },
    ],
  },
  {
    id: "book-workspace",
    label: "Livro",
    scope: "book",
    items: [
      {
        id: "book-overview",
        label: "Capítulos",
        hrefTemplate: "/books/[bookId]",
        icon: "book",
        kind: "route",
      },
      {
        id: "book-glossary",
        label: "Glossário",
        hrefTemplate: "/books/[bookId]/glossary",
        icon: "glossary",
        kind: "route",
        matchMode: "startsWith",
      },
      {
        id: "book-export",
        label: "Exportação",
        hrefTemplate: "/books/[bookId]/export",
        icon: "export",
        kind: "route",
        matchMode: "startsWith",
      },
    ],
  },
  {
    id: "book-actions",
    label: "Ações rápidas",
    scope: "book",
    items: [
      {
        id: "book-edit",
        label: "Editar Projeto",
        hrefTemplate: "/books/[bookId]/edit",
        icon: "settings",
        kind: "quick-action",
        matchMode: "exact",
      },
      {
        id: "chapter-new",
        label: "Novo Capítulo",
        hrefTemplate: "/books/[bookId]/chapters/new",
        icon: "plus",
        kind: "quick-action",
        matchMode: "exact",
      },
    ],
  },
  {
    id: "chapter-context",
    label: "Capítulo atual",
    scope: "chapter",
    items: [
      {
        id: "chapter-editor",
        label: "Editor de Tradução",
        hrefTemplate: "/books/[bookId]/chapters/[chapterId]",
        icon: "book",
        kind: "route",
        matchMode: "exact",
      },
    ],
  },
];
