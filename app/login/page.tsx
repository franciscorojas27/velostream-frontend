"use client";

import React, { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useTranslation } from "@/components/I18nProvider";

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
});

export default function Login() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError(null);
        setErrors({});

        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            setErrors(fieldErrors as Record<string, string[]>);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const json = await res.json();
            if (!res.ok) {
                setServerError(json.error ? JSON.stringify(json.error) : "Login failed");
                setSubmitting(false);
                return;
            }
            window.location.href = "/";
        } catch {
            setServerError("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-100 selection:bg-cyan-500/30">
            {/* Grid background pattern */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
                <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl backdrop-blur-xl">
                    <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"></div>
                    <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-orange-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M3 12h18" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M12 3v18" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">{t.auth.loginTitle}</h2>
                        <p className="mt-2 text-sm text-neutral-400">{t.auth.loginDesc}</p>      
                    </div>

                    <form onSubmit={onSubmit} noValidate className="relative z-10 mt-8 space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{t.auth.email}</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                            />
                            {errors.email && <p className="text-xs font-medium text-red-400">{errors.email.join(", ")}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{t.auth.password}</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                            />
                            {errors.password && <p className="text-xs font-medium text-red-400">{errors.password.join(", ")}</p>}
                        </div>

                        {serverError && <p className="rounded-lg bg-red-500/10 p-3 text-center text-xs font-medium text-red-400 border border-red-500/20">{serverError}</p>}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-2 flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-80"/></svg>
                            ) : t.auth.enter}
                        </button>
                    </form>

                    <div className="relative z-10 mt-8 text-center text-sm text-neutral-500">
                        ¿Aún no tienes cuenta?{" "}
                        <Link href="/register" className="font-semibold text-white transition hover:text-cyan-400">Crear cuenta gratis</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}