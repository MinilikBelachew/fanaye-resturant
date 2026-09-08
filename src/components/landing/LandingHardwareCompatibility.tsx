"use client";

import { useTranslations } from "next-intl";
import {
    Tablet,
    Smartphone,
    Monitor,
    CheckCircle2,
    Sparkles,
} from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./LandingMotion";

const icons = [Tablet, Monitor, Monitor, Smartphone];

export default function LandingHardwareCompatibility() {
    const t = useTranslations("hardware");
    const devices = t.raw("devices") as Array<{
        title: string;
        desc: string;
        tag: string;
    }>;

    return (
        <section className="relative py-12 md:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <ScrollReveal className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                        <Sparkles className="size-3" />
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

                {/* Device Grid */}
                <StaggerContainer className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {devices.map((d, idx) => {
                        const Icon = icons[idx % icons.length];
                        return (
                            <StaggerItem
                                key={idx}
                                className="rounded-2xl border border-border/80 bg-card/80 p-5 backdrop-blur-xl flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                            <Icon className="size-5" />
                                        </div>
                                        <span className="rounded bg-secondary px-2 py-0.2 text-[9px] font-mono text-muted-foreground">
                                            {d.tag}
                                        </span>
                                    </div>
                                    <h3 className="mt-4 text-sm font-bold text-foreground">
                                        {d.title}
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        {d.desc}
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    <CheckCircle2 className="size-3.5" />
                                    <span>{t("instantPwa")}</span>
                                </div>
                            </StaggerItem>
                        );
                    })}
                </StaggerContainer>
            </div>
        </section>
    );
}
