import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Space_Grotesk } from "next/font/google";

import "./globals.css";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { BookSidebar } from "@/components/layout/BookSidebar";
import { SEO_DEFAULTS } from "@/config/app";
import { Providers } from "@/app/providers";

const uiFont = Space_Grotesk({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: SEO_DEFAULTS.title,
  description: SEO_DEFAULTS.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${uiFont.variable} ${displayFont.variable} font-ui text-text antialiased`}>
        <Providers>
          <AuthGuard>
            <div className="flex min-h-screen flex-col">
              <AppHeader />
              <div className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-3 px-4 py-8 sm:gap-4 sm:px-6 sm:py-10">
                <BookSidebar />
                <main className="min-w-0 flex-1 animate-rise overflow-x-hidden">{children}</main>
              </div>
              <AppFooter />
            </div>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
