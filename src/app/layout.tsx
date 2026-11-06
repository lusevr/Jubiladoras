import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isDemo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Jubiladores · Análisis y registro de picks",
  description: "Todos los picks, ganados y perdidos. Sin maquillaje.",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/picks", label: "Picks" },
  { href: "/bankroll", label: "Bankroll" },
  { href: "/cementerio", label: "🪦 Cementerio" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              JUBILADORES
            </Link>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-zinc-100">
                  {n.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        {isDemo && (
          <div className="bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-300">
            Modo demostración: configura Supabase en <code>.env.local</code> para ver datos reales.
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-800 px-4 py-6 text-center text-xs text-zinc-500">
          Contenido informativo. Apostar implica riesgo de pérdida. +18. Juega con responsabilidad.
        </footer>
      </body>
    </html>
  );
}
