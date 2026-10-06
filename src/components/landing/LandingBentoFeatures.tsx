"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
    Split,
    ShieldCheck,
    Coins,
    LayoutGrid,
    WifiOff,
    FileSpreadsheet,
    Sparkles,
} from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./LandingMotion";

export default function LandingBentoFeatures() {
    const t = useTranslations("bento");

    return (
        <section
            id="features"
            className="relative py-12 md:py-16 bg-secondary/30"
        >
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <ScrollReveal className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Sparkles className="size-3" />
                        <span>{t("badge")}</span>
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {t("titlePrefix")}
                        <span className="text-foreground">
                            {t("titleHighlight")}
                        </span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        {t("description")}
                    </p>
                </ScrollReveal>

                {/* Bento Grid */}
                <StaggerContainer className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                    {/* BENTO 1: Multi-Station Routing (Col 7 / 12) */}
                    <StaggerItem className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-border/80 bg-card/80 p-5 backdrop-blur-xl">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border">
                                    <Split className="size-5" />
                                </div>
                                <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-foreground font-mono">
                                    {t("routingBadge")}
                                </span>
                            </div>

                            <h3 className="mt-4 text-lg sm:text-xl font-bold text-foreground">
                                {t("routingTitle")}
                            </h3>
                            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {t("routingDesc")}
                            </p>
                        </div>

                        {/* Station Visual Badges */}
                        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border/50">
                            <div className="rounded-lg border border-border/60 bg-background/60 p-2 text-center">
                                <span className="text-[9px] font-medium uppercase text-muted-foreground">
                                    Station 01
                                </span>
                                <p className="text-xs font-bold text-foreground mt-0.5">
                                    {t("station1")}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-background/60 p-2 text-center">
                                <span className="text-[9px] font-medium uppercase text-muted-foreground">
                                    Station 02
                                </span>
                                <p className="text-xs font-bold text-foreground mt-0.5">
                                    {t("station2")}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-background/60 p-2 text-center">
                                <span className="text-[9px] font-medium uppercase text-muted-foreground">
                                    Station 03
                                </span>
                                <p className="text-xs font-bold text-foreground mt-0.5">
                                    {t("station3")}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-background/60 p-2 text-center">
                                <span className="text-[9px] font-medium uppercase text-muted-foreground">
                                    Station 04
                                </span>
                                <p className="text-xs font-bold text-foreground mt-0.5">
                                    {t("station4")}
                                </p>
                            </div>
                        </div>
                    </StaggerItem>

                    {/* BENTO 2: TinaVerify AI Anti-Fraud with Image (Col 5 / 12) */}
                    <StaggerItem
                        id="tinaverify"
                        className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-secondary/80 via-card to-card p-5 backdrop-blur-xl"
                    >
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-foreground">
                                    {t("tinaVerifyBadge")}
                                </span>
                            </div>

                            <h3 className="mt-4 text-lg sm:text-xl font-bold text-foreground">
                                {t("tinaVerifyTitle")}
                            </h3>
                            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {t("tinaVerifyDesc")}
                            </p>
                        </div>

                        <div className="mt-4 relative aspect-[16/7] w-full rounded-xl overflow-hidden border border-border">
                            <Image
                                src="/images/landing/tinaverify_audit.jpg"
                                alt="TinaVerify Bank Verification"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </StaggerItem>

                    {/* BENTO 3: Cashier Custody & Drops (Col 4 / 12) */}
                    <StaggerItem className="lg:col-span-4 rounded-2xl border border-border/80 bg-card/80 p-5 backdrop-blur-xl">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border">
                            <Coins className="size-5" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-foreground">
                            {t("cashDropTitle")}
                        </h3>
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                            {t("cashDropDesc")}
                        </p>
                    </StaggerItem>

                    {/* BENTO 4: Live Floor Matrix (Col 4 / 12) */}
                    <StaggerItem className="lg:col-span-4 rounded-2xl border border-border/80 bg-card/80 p-5 backdrop-blur-xl">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border">
                            <LayoutGrid className="size-5" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-foreground">
                            {t("floorMatrixTitle")}
                        </h3>
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                            {t("floorMatrixDesc")}
                        </p>
                    </StaggerItem>

                    {/* BENTO 5: Offline-First PWA (Col 4 / 12) */}
                    <StaggerItem className="lg:col-span-4 rounded-2xl border border-border/80 bg-card/80 p-5 backdrop-blur-xl">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground border border-border">
                            <WifiOff className="size-5" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-foreground">
                            {t("offlineTitle")}
                        </h3>
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                            {t("offlineDesc")}
                        </p>
                    </StaggerItem>

                    {/* BENTO 6: One-Click Operational Close (Col 12 / 12) */}
                    <StaggerItem className="lg:col-span-12 rounded-2xl border border-border/80 bg-card/80 p-5 sm:p-6 backdrop-blur-xl">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1.5 max-w-2xl">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="size-4 text-foreground" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                                        {t("closeBadge")}
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                                    {t("closeTitle")}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    {t("closeDesc")}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                                <div className="rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-center">
                                    <span className="text-[10px] text-muted-foreground">
                                        {t("closeTimeLabel")}
                                    </span>
                                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                                        {t("closeTimeValue")}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-center">
                                    <span className="text-[10px] text-muted-foreground">
                                        {t("discrepancyLabel")}
                                    </span>
                                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                                        {t("discrepancyValue")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </StaggerItem>
                </StaggerContainer>
            </div>
        </section>
    );
}
