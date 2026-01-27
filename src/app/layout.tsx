import "./globals.css";

import type { ReactNode } from "react";

export const metadata = {
  title: "Cedet Translator",
  description: "Sistema de tradução literária assistida por IA"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body className="app-root">{children}</body>
    </html>
  );
}
