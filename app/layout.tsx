import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Space_Grotesk } from "next/font/google";

import "./globals.css";

import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
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
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 animate-rise sm:px-6 sm:py-10">
              {children}
            </main>
            <AppFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
