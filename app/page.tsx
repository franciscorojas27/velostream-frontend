"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useTranslation } from "@/components/I18nProvider";
import { Link } from "lucide-react";

type DownloadFormat = "mp4" | "mp3";
type VideoQuality = "1080" | "720" | "480" | "360";

type VideoInfo = {
  thumbnail?: string;
  author?: string;
  duration?: string;
  description?: string;
  title?: string;
};

export default function Home() {
  const { t } = useTranslation();
  const [format, setFormat] = useState<DownloadFormat>("mp4");
  const [quality, setQuality] = useState<VideoQuality>("720");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadLabel, setDownloadLabel] = useState("");
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopProgressSimulation() {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  function startProgressSimulation() {
    stopProgressSimulation();
    progressTimerRef.current = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + Math.max(1, Math.round((85 - prev) / 14));
      });
    }, 550);
  }

  useEffect(() => {
    return () => {
      stopProgressSimulation();
    };
  }, []);

  function redirectToLoginIfInvalidSession(status: number, message?: string) {
    const normalized = (message || "").toLowerCase();
    const tokenHints = ["token", "jwt", "unauthorized", "forbidden", "expired", "invalido", "invalid"];
    const hasTokenHint = tokenHints.some((hint) => normalized.includes(hint));

    if (status === 401 || status === 403 || hasTokenHint) {
      window.location.href = "/login";
      return true;
    }

    return false;
  }

  function extractVideoId(urlStr: string): string | null {
    try {
      const u = new URL(urlStr);
      const hostname = u.hostname.replace(/^www\./, "").toLowerCase();
      const v = u.searchParams.get("v");
      if (v) return v;
      if (hostname === "youtu.be") {
        const parts = u.pathname.split("/").filter(Boolean);
        return parts.length ? parts[0] : null;
      }

      if (hostname.endsWith("youtube.com") || hostname.endsWith("youtube-nocookie.com")) {
        const parts = u.pathname.split("/").filter(Boolean);
        return parts.length ? parts[parts.length - 1] : null;
      }
      const parts = u.pathname.split("/").filter(Boolean);
      return parts.length ? parts[parts.length - 1] : null;
    } catch {
      return null;
    }
  }

  const urlSchema = z
    .url({ message: "URL invalida" })
    .refine((u) => !!extractVideoId(u), { message: "No se encontró id en la URL" });

  async function validateAndFetchInfo(value: string) {
    setError(null);
    setVideoInfo(null);
    const result = urlSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.issues[0]?.message || "URL invalida");
      return null;
    }
    const id = extractVideoId(value);
    if (!id) {
      setError("No se pudo extraer el id del video");
      return null;
    }

    setLoadingInfo(true);
    try {
      const res = await fetch(`/api/video/${encodeURIComponent(id)}/info`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.error || "Fallo al obtener info";
        if (redirectToLoginIfInvalidSession(res.status, errorMessage)) {
          return null;
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      const payload = data.data ?? data;
      setVideoInfo({
        thumbnail: payload.thumbnail,
        author: payload.author,
        duration: payload.duration,
        description: payload.description,
        title: payload.title,
      });
      return payload;
    } catch {
      setError("No se pudo obtener la información del video");
      return null;
    } finally {
      setLoadingInfo(false);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pastedText = e.clipboardData.getData("text").trim();
    if (!pastedText) {
      return;
    }
    e.preventDefault();
    setUrl(pastedText);
    void validateAndFetchInfo(pastedText);
  }

  async function handleDownload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDownloadLabel("");

    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "URL invalida");
      return;
    }

    const id = extractVideoId(url);
    if (!id) {
      setError("No se pudo extraer el id del video");
      return;
    }

    const qualityParam = format === "mp3" ? "mp3" : quality;

    setIsDownloading(true);
    setDownloadProgress(2);
    setDownloadLabel("Iniciando descarga...");
    startProgressSimulation();

    try {
      const res = await fetch(`/api/video/${encodeURIComponent(id)}/download?quality=${encodeURIComponent(qualityParam)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errorMessage = data?.error || "No se pudo descargar el archivo";
        if (redirectToLoginIfInvalidSession(res.status, errorMessage)) {
          return;
        }
        throw new Error(errorMessage);
      }

      const total = Number(res.headers.get("x-upstream-content-length") || res.headers.get("content-length") || 0);
      const disposition = res.headers.get("content-disposition") || "";
      const fileNameFromHeader = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      const fallbackName = `velostream-${id}.${format === "mp3" ? "mp3" : "mp4"}`;
      const fileName = decodeURIComponent(fileNameFromHeader?.[1] || fileNameFromHeader?.[2] || fallbackName);

      if (!res.body) {
        const blob = await res.blob();
        const link = document.createElement("a");
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(blobUrl);
        stopProgressSimulation();
        setDownloadProgress(100);
        setDownloadLabel("Descarga completada");
        return;
      }

      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            const progress = Math.min(100, Math.round((received / total) * 100));
            stopProgressSimulation();
            setDownloadProgress((prev) => Math.max(prev, progress));
            setDownloadLabel(`${t.home.downloading} ${progress}%`);
          } else {
            setDownloadProgress((prev) => Math.min(92, Math.max(prev, 8)));
            setDownloadLabel(t.home.downloading);
          }
        }
      }

      const blob = new Blob(chunks);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(blobUrl);
      stopProgressSimulation();
      setDownloadProgress(100);
      setDownloadLabel(t.home.completed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error en la descarga";
      stopProgressSimulation();
      setError(message);
      setDownloadLabel("");
      setDownloadProgress(0);
    } finally {
      stopProgressSimulation();
      setIsDownloading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#050505] text-neutral-100 selection:bg-cyan-500/30">
      {/* Grid background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <main className="grid gap-12 lg:grid-cols-[1fr_400px]">
          <section className="flex flex-col justify-center">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300 backdrop-blur-md">
                <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                v2.0 is live
              </span>
            </div>

            <h2 className="text-5xl font-medium tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t.home.title}
            </h2>

            <p className="mt-6 max-w-xl text-lg text-neutral-400">
              {t.home.subtitle}
            </p>

            <form onSubmit={handleDownload} className="mt-10">
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-2xl bg-linear-to-r from-cyan-500/30 to-orange-500/30 opacity-20 blur transition duration-500 group-focus-within:opacity-50"></div>

                <div className="relative flex items-center justify-between rounded-2xl border border-white/10 bg-[#0a0a0a] p-2 shadow-2xl backdrop-blur-xl">
                  <div className="flex w-full items-center pl-3">
                    <Link className="h-5 w-5 text-neutral-500" />
                    <input
                      id="videoUrl"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onPaste={handlePaste}
                      onBlur={() => url && validateAndFetchInfo(url)}
                      placeholder={t.home.placeholder}
                      required
                      className="w-full bg-transparent px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pr-1">
                    <div className="hidden items-center gap-1 overflow-hidden rounded-xl border border-white/5 bg-white/5 p-1 md:flex">
                      <select
                        id="format"
                        value={format}
                        onChange={(e) => setFormat(e.target.value as DownloadFormat)}
                        className="appearance-none cursor-pointer bg-transparent pl-3 pr-2 py-1.5 text-sm font-medium text-white transition hover:bg-white/5 rounded-lg outline-none [&>option]:bg-neutral-900 [&>option]:text-white"
                      >
                        <option value="mp4">MP4</option>
                        <option value="mp3">MP3</option>
                      </select>
                      <div className="w-px h-4 bg-white/10"></div>
                      <select
                        id="quality"
                        value={quality}
                        onChange={(e) => setQuality(e.target.value as VideoQuality)}
                        disabled={format === "mp3"}
                        className="appearance-none flex-1 cursor-pointer bg-transparent pl-3 pr-2 py-1.5 text-sm font-medium text-white transition hover:bg-white/5 rounded-lg outline-none disabled:opacity-30 disabled:cursor-not-allowed [&>option]:bg-neutral-900 [&>option]:text-white"
                      >
                        <option value="1080">1080p</option>
                        <option value="720">720p</option>
                        <option value="480">480p</option>
                        <option value="360">360p</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isDownloading || loadingInfo || !url}
                      className="flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDownloading ? (
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-80" /></svg>
                      ) : t.home.extract}
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile controls */}
              <div className="mt-4 flex items-center gap-3 md:hidden">
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as DownloadFormat)}
                  className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-2.5 text-sm text-white outline-none [&>option]:bg-neutral-900 [&>option]:text-white"
                >
                  <option value="mp4">MP4 Video</option>
                  <option value="mp3">MP3 Audio</option>
                </select>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as VideoQuality)}
                  disabled={format === "mp3"}
                  className="flex-1 rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-2.5 text-sm text-white outline-none disabled:opacity-30 [&>option]:bg-neutral-900 [&>option]:text-white"
                >
                  <option value="1080">1080p</option>
                  <option value="720">720p</option>
                  <option value="480">480p</option>
                  <option value="360">360p</option>
                </select>
              </div>

              {isDownloading && (
                <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
                  <div className="mb-3 flex items-center justify-between text-sm font-medium">
                    <span className="text-white">{downloadLabel || "Procesando..."}</span>
                    <span className="text-cyan-400">{downloadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-400 transition-all duration-300 ease-out" style={{ width: `${downloadProgress}%` }} />
                  </div>
                </div>
              )}

              {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}
              {!error && downloadLabel && !isDownloading && <p className="mt-4 text-sm font-medium text-emerald-400">{downloadLabel}</p>}
            </form>
          </section>

          <aside className="lg:mt-0 mt-8">
            <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl">
              <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent opacity-50"></div>

              <div className="relative p-6">
                <div className="mb-6 flex items-center gap-2 text-sm text-neutral-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {t.home.preview}
                </div>

                <div className="min-h-80">
                  {loadingInfo && (
                    <div className="flex h-80 flex-col items-center justify-center space-y-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-cyan-400"></div>
                      <p className="text-sm text-neutral-500">Obteniendo metadatos...</p>
                    </div>
                  )}

                  {!loadingInfo && !videoInfo && (
                    <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 px-6 text-center">
                      <svg className="mb-4 h-8 w-8 text-neutral-600" viewBox="0 0 24 24" fill="none"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <p className="text-sm text-neutral-400">{t.home.waiting}</p>
                    </div>
                  )}

                  {!loadingInfo && videoInfo && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="group relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-900">
                        {videoInfo.thumbnail ? (
                          <Image
                            src={videoInfo.thumbnail}
                            alt="thumbnail"
                            width={640}
                            height={360}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-neutral-600">Sin imagen</div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                          {videoInfo.duration || "Live"}
                        </div>
                      </div>

                      <div className="mt-5">
                        <h4 className="line-clamp-2 text-base font-medium leading-tight text-white" title={videoInfo.title}>
                          {videoInfo.title || "Untitled Video"}
                        </h4>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-tr from-cyan-500 to-emerald-500 text-[10px] font-bold text-white">
                              {videoInfo.author?.[0]?.toUpperCase() || "?"}
                            </div>
                            <p className="text-sm text-neutral-400">{videoInfo.author || "Unknown"}</p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-neutral-300">
                              {format.toUpperCase()}
                            </span>
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-neutral-300">
                              {quality}P
                            </span>
                          </div>
                        </div>

                        {videoInfo.description && (
                          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-neutral-500">
                            {videoInfo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}


