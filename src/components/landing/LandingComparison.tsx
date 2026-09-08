"use client";

import { useTranslations } from "next-intl";
import { Check, X, GitCompare } from "lucide-react";
import { ScrollReveal } from "./LandingMotion";

export default function LandingComparison() {
    const t = useTranslations("comparison");
    const rows = t.raw("rows") as Array<{
        feature: string;
        legacy: string;
        fanaye: string;
    }>;

    return (
        <section id="comparison" className="relative py-12 md:py-16 bg-secondary/30">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <ScrollReveal className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                        <GitCompare className="size-3" />
                        <span>{t("badge")}</span>
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {t("titlePrefix")}
                        <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                            {t("titleHighlight")}
                        </span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        {t("description")}
                    </p>
                </ScrollReveal>

                {/* Comparison Table */}
                <div className="mt-10 overflow-hidden rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl">
                    <div className="grid grid-cols-12 border-b border-border/60 bg-secondary/40 p-4 text-xs font-bold text-foreground">
                        <div className="col-span-4 sm:col-span-4">{t("tableHeaderCapability")}</div>
                        <div className="col-span-4 sm:col-span-4 text-muted-foreground">{t("tableHeaderLegacy")}</div>
                        <div className="col-span-4 sm:col-span-4 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                            <span>{t("tableHeaderFanaye")}</span>
                            <span className="rounded bg-orange-500/10 px-1 py-0.2 text-[9px] font-bold">{t("nextGen")}</span>
                        </div>
                    </div>

                    <div className="divide-y divide-border/50 text-xs">
                        {rows.map((row, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-12 p-4 items-center hover:bg-secondary/30 transition-colors"
                            >
                                <div className="col-span-4 sm:col-span-4 font-semibold text-foreground pr-2">
                                    {row.feature}
                                </div>
                                <div className="col-span-4 sm:col-span-4 flex items-start gap-2 text-muted-foreground pr-2">
                                    <X className="size-3.5 text-rose-500 shrink-0 mt-0.5" />
                                    <span>{row.legacy}</span>
                                </div>
                                <div className="col-span-4 sm:col-span-4 flex items-start gap-2 text-foreground font-medium bg-orange-500/5 -my-4 py-4 px-2.5 rounded-lg">
                                    <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-foreground">{row.fanaye}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
