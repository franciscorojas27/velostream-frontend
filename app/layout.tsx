import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VeloStream | El Mejor Descargador de Videos y MP3",
  description: "Descarga videos y audios de plataformas en la mejor calidad (1080p, 4K, MP3) al instante. Rápido, limpio y seguro.",
  keywords: ["descargar videos", "video a mp3", "plataforma a mp4", "descargador rapido", "video downloader", "velostream", "bajar videos gratis"],
  openGraph: {
    title: "VeloStream | Conversor de Video de Alta Velocidad",
    description: "Extrae y descarga contenido de la web rápidamente, en el formato que necesitas.",
    url: "https://velostream.franciscorojas.dev",
    siteName: "VeloStream",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VeloStream | El Mejor Descargador de Videos",
    description: "Descargas instantáneas en 1080p y MP3. Rápido, seguro y de uso fácil.",
  }
};

import { I18nProvider } from "@/components/I18nProvider";
import { Navbar } from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-neutral-100">
        <I18nProvider>
          <Navbar />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
