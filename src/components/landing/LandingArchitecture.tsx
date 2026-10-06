"use client";

import { useTranslations } from "next-intl";
import {
    Cpu,
    Database,
    Radio,
    ShieldCheck,
    Smartphone,
    CheckCircle2,
} from "lucide-react";
import { ScrollReveal } from "./LandingMotion";

export default function LandingArchitecture() {
    const t = useTranslations("architecture");

    return (
        <section id="architecture" className="relative py-12 md:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <ScrollReveal className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Cpu className="size-3" />
                        <span>{t("badge")}</span>
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {t("titlePrefix")}{" "}
                        <span className="text-foreground">
                            {t("titleHighlight")}
                        </span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        {t("description")}
                    </p>
                </ScrollReveal>

                {/* Architecture Visual Grid */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Layer 1: Edge Client Mesh */}
                    <div className="rounded-2xl border border-border/80 bg-card/80 p-4 sm:p-5 backdrop-blur-xl flex flex-col justify-between">
                        <div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border">
                                <Smartphone className="size-5" />
                            </div>
                            <span className="mt-3 inline-block text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                                {t("layer1.label")}
                            </span>
                            <h3 className="mt-1 text-base font-bold text-foreground">
                                {t("layer1.title")}
                            </h3>
                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                {t("layer1.desc")}
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/50 space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-foreground" />
                                <span>{t("layer1.p1")}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-foreground" />
                                <span>{t("layer1.p2")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Layer 2: Real-Time Event Bus */}
                    <div className="rounded-2xl border border-border bg-gradient-to-b from-card via-card to-card p-4 sm:p-5 backdrop-blur-xl flex flex-col justify-between">
                        <div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
                                <Radio className="size-5 animate-pulse" />
                            </div>
                            <span className="mt-3 inline-block text-[10px] font-mono font-semibold uppercase tracking-wider text-foreground">
                                {t("layer2.label")}
                            </span>
                            <h3 className="mt-1 text-base font-bold text-foreground">
                                {t("layer2.title")}
                            </h3>
                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                {t("layer2.desc")}
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/50 space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-foreground" />
                                <span>{t("layer2.p1")}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-foreground" />
                                <span>{t("layer2.p2")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Layer 3: TinaVerify AI & Banking */}
                    <div className="rounded-2xl border border-border/80 bg-card/80 p-4 sm:p-5 backdrop-blur-xl flex flex-col justify-between">
                        <div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border">
                                <ShieldCheck className="size-5" />
                            </div>
                            <span className="mt-3 inline-block text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                                {t("layer3.label")}
                            </span>
                            <h3 className="mt-1 text-base font-bold text-foreground">
                                {t("layer3.title")}
                            </h3>
                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                {t("layer3.desc")}
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/50 space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-foreground" />
                                <span>{t("layer3.p1")}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-foreground" />
                                <span>{t("layer3.p2")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Layer 4: Multi-Tenant PostgreSQL Core */}
                    <div className="rounded-2xl border border-border/80 bg-card/80 p-4 sm:p-5 backdrop-blur-xl flex flex-col justify-between">
                        <div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border">
                                <Database className="size-5" />
                            </div>
                            <span className="mt-4 inline-block text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                                {t("layer4.label")}
                            </span>
                            <h3 className="mt-1 text-base font-bold text-foreground">
                                {t("layer4.title")}
                            </h3>
                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                {t("layer4.desc")}
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/50 space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-foreground" />
                                <span>{t("layer4.p1")}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-foreground" />
                                <span>{t("layer4.p2")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
