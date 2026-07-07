import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Ferragens do Elson — Painel de Gestão",
  description: "Sistema de gestão e estoque da Ferragens do Elson",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full font-body">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
