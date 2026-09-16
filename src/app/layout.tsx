import type { Metadata } from "next";
import "@/styles/globals.css";
import Link from "next/link";
import { Cpu, FileSpreadsheet, LayoutGrid } from "lucide-react";

export const metadata: Metadata = {
  title: "PC Workshop - ShopOrder & QC Hub",
  description: "Localhost Workstation & Video QC Hub for PC Assembly",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased selection:bg-cyan-500 selection:text-black min-h-screen bg-[#090d16] text-slate-100">
        <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="p-1 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.25)] flex items-center justify-center">
                <img src="/logo.png" alt="K2C Komputindo Logo" className="w-7 h-7 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wider text-slate-100 uppercase">
                  PC Workshop Hub
                </span>
                <span className="text-[10px] font-mono text-cyan-400 -mt-0.5 tracking-wide">
                  WORKSTATION &amp; QC LAN
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-3">
              <Link
                href="/"
                className="btn-3d-dark px-4 py-2 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4 text-cyan-400" />
                <span>Kanban Matrix</span>
              </Link>
              <Link
                href="/import"
                className="btn-3d-cyan px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Shopee</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="w-full max-w-[1920px] mx-auto p-3 sm:p-5">{children}</main>
      </body>
    </html>
  );
}