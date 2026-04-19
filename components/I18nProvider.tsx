"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../dictionaries/en.json";
import es from "../dictionaries/es.json";

type Dictionary = typeof es;
type Language = "en" | "es";

interface I18nContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only access localStorage on the client after mount
    const saved = localStorage.getItem("lang") as Language;
    if (saved && (saved === "en" || saved === "es")) {
      // Delay to avoid synchronous state update in effect
      setTimeout(() => setLang(saved), 0);
    } else {
      const browserLang = navigator.language.startsWith("en") ? "en" : "es";
      setTimeout(() => setLang(browserLang), 0);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const t = lang === "es" ? es : en;

  // Render children normally, but prevent hydration mismatch
  // by returning context immediately, though lang might shift slightly.
  // Actually, for pure SSR without hydration errors, it is safer to mount it.
  
  if (!mounted) {
     return (
       <I18nContext.Provider value={{ lang: "es", setLang: handleSetLang, t: es }}>
         <div className="invisible">{children}</div>
       </I18nContext.Provider>
     );
  }

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
