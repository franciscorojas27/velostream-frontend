"use client";

import Link from "next/link";
import { useTranslation } from "./I18nProvider";

export function Navbar() {
  const { t, lang, setLang } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-orange-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 12h18" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M12 3v18" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">VeloStream</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="/ayuda" className="text-sm font-medium text-neutral-400 transition hover:text-white">
            {t.nav.help}
          </Link>
          <Link href="/legal" className="text-sm font-medium text-neutral-400 transition hover:text-white">
            {t.nav.disclaimer}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold uppercase text-neutral-400 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
          >
            {lang === "es" ? "ES" : "EN"}
          </button>
        </div>
      </div>
    </nav>
  );
}