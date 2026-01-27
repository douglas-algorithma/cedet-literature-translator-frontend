\"use client\";

import Link from \"next/link\";
import { usePathname } from \"next/navigation\";

const NAV_ITEMS = [
  { label: \"Dashboard\", href: \"/\" },
  { label: \"Livros\", href: \"/books\" },
  { label: \"Capitulos\", href: \"/chapters\" },
  { label: \"Paragrafos\", href: \"/paragraphs\" },
  { label: \"Traducao\", href: \"/translate\" },
  { label: \"Glossario\", href: \"/glossary\" }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className=\"sidebar\">
      <div className=\"brand\">
        <h2>Cedet Translator</h2>
        <span>Workspace literario</span>
      </div>
      <nav className=\"nav\">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={active ? \"active\" : \"\"}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
