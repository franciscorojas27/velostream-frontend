"use client";

import { useTranslation } from "@/components/I18nProvider";

export default function Legal() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-100 selection:bg-cyan-500/30">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="relative mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{t.legal.title}</h1>
                    <p className="mt-4 text-lg text-neutral-400">{t.legal.desc}</p>
                </div>

                <div className="space-y-6 rounded-3xl border border-white/10 bg-[#0a0a0a]/60 p-8 shadow-2xl backdrop-blur-xl">
                    <p className="text-neutral-300 leading-relaxed">
                        {t.legal.body1}
                    </p>
                    <p className="text-neutral-300 leading-relaxed">
                        {t.legal.body2}
                    </p>
                    <p className="text-neutral-300 leading-relaxed">
                        {t.legal.body3}
                    </p>

                    <div className="mt-8 border-t border-white/10 pt-8">
                        <h2 className="text-lg font-semibold text-white">{t.legal.dmcaTitle}</h2>
                        <p className="mt-2 text-neutral-300 leading-relaxed">
                            {t.legal.dmcaDesc}
                        </p>
                        <p className="mt-4 font-mono text-cyan-400">
                            {t.legal.dmcaEmail}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}