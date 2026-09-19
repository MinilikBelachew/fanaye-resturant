"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Flame,
    Layers,
    Play,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Wifi,
    Zap,
} from "lucide-react";

export default function LandingHero() {
    const t = useTranslations("hero");
    const [activeTab, setActiveTab] = useState<"floor" | "kds" | "audit">(
        "floor",
    );

    const liveTables = [
        {
            id: "T-01",
            status: "occupied",
            guests: 4,
            spent: "1,450 ETB",
            time: "18m",
        },
        {
            id: "T-02",
            status: "ready",
            guests: 2,
            spent: "820 ETB",
            time: "34m",
        },
        {
            id: "T-03",
            status: "billing",
            guests: 6,
            spent: "3,890 ETB",
            time: "52m",
        },
        { id: "T-04", status: "vacant", guests: 0, spent: "-", time: "Free" },
        {
            id: "T-05",
            status: "occupied",
            guests: 3,
            spent: "1,120 ETB",
            time: "8m",
        },
        {
            id: "T-06",
            status: "ready",
            guests: 5,
            spent: "2,640 ETB",
            time: "41m",
        },
    ];

    const kdsTickets = [
        {
            id: "#409",
            table: "Table 03",
            items: "2x Special Tibs, 1x Salad",
            station: "Grill Station",
            status: "Cooking",
            timer: "03:45",
        },
        {
            id: "#410",
            table: "Table 01",
            items: "4x Habesha Draft, 2x Sparkling",
            station: "Main Bar",
            status: "Ready",
            timer: "01:10",
        },
        {
            id: "#411",
            table: "Table 05",
            items: "1x Kitfo Dullet, 1x Injera",
            station: "Hot Line",
            status: "Queued",
            timer: "00:30",
        },
    ];

    return (
        <section className="relative min-h-[92vh] flex flex-col justify-center pt-28 sm:pt-36 pb-16 lg:pb-24 overflow-hidden bg-background">
            {/* Elegant Ambient Atmospheric Light Orbs (Pure CSS) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute -top-24 right-1/4 size-[600px] rounded-full bg-gradient-to-br from-primary/10 via-amber-500/5 to-transparent blur-[140px]" />
                <div className="absolute top-1/3 -left-32 size-[500px] rounded-full bg-gradient-to-tr from-purple-500/8 via-primary/5 to-transparent blur-[120px]" />
                <div className="absolute bottom-0 right-10 size-[450px] rounded-full bg-gradient-to-tl from-primary/8 via-orange-400/5 to-transparent blur-[130px]" />

                {/* Subtle Modern Grid Texture */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                {/* 2-Column Hero Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
                    {/* LEFT COLUMN: Headline, Value Proposition, Action Buttons & Badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-6 space-y-7 text-left"
                    >
                        {/* Live Operating System Badge */}
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-2xs">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-primary" />
                            </span>
                            <span className="tracking-wide uppercase text-[11px] font-bold">
                                {t("badge")}
                            </span>
                        </div>

                        {/* Bold Modern Headline with Gradient Glow */}
                        <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-foreground leading-[1.12]">
                            {t("headlinePrefix")}{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-amber-500 block">
                                {t("headlineHighlight")}
                            </span>
                        </h1>

                        {/* Clear, Impactful Subtitle */}
                        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl font-normal">
                            {t("description")}
                        </p>

                        {/* Dual Action Buttons */}
                        <div className="flex flex-wrap items-center gap-4 pt-1">
                            <Link
                                href="/sign-in"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-deep text-white px-7 py-3.5 text-sm font-bold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 active:scale-[0.98]"
                            >
                                <span>{t("getStarted")}</span>
                                <ArrowUpRight className="size-4 stroke-[2.5]" />
                            </Link>

                            <a
                                href="#stations"
                                className="inline-flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/70 hover:bg-card text-foreground px-6 py-3.5 text-sm font-semibold backdrop-blur-md transition-all shadow-2xs hover:border-primary/40 hover:-translate-y-0.5"
                            >
                                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Play className="size-2.5 fill-current ml-0.5" />
                                </span>
                                <span>{t("watchWalkthrough")}</span>
                            </a>
                        </div>

                        {/* Proof Highlights */}
                        <div className="pt-6 border-t border-border/60 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-emerald-500" />
                                <span className="font-medium text-foreground">
                                    {t("zeroConfig")}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-primary" />
                                <span className="font-medium text-foreground">
                                    {t("fiscalCustody")}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="size-4 text-amber-500" />
                                <span className="font-medium text-foreground">
                                    {t("subSecondSync")}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: Interactive Pure CSS/React Live Operations Studio */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.15,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        className="lg:col-span-6 relative"
                    >
                        {/* Glowing Glass Outer Frame */}
                        <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 via-card/70 to-card/95 backdrop-blur-2xl p-5 sm:p-7 shadow-2xl shadow-primary/5">
                            {/* Panel Top Navigation Bar */}
                            <div className="flex items-center justify-between pb-4 border-b border-border/60">
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-red-400/80" />
                                    <div className="size-3 rounded-full bg-amber-400/80" />
                                    <div className="size-3 rounded-full bg-emerald-400/80" />
                                    <span className="ml-2 text-xs font-bold tracking-tight text-foreground">
                                        {t("stationTitle")}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>{t("cloudSyncActive")}</span>
                                </div>
                            </div>

                            {/* View Switcher Tabs */}
                            <div className="flex items-center gap-2 pt-4 pb-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("floor")}
                                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                        activeTab === "floor"
                                            ? "bg-primary text-white shadow-xs"
                                            : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <Layers className="size-3.5" />
                                    <span>{t("tabFloor")} (6)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("kds")}
                                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                        activeTab === "kds"
                                            ? "bg-primary text-white shadow-xs"
                                            : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <Flame className="size-3.5" />
                                    <span>{t("tabKds")} (3)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("audit")}
                                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                        activeTab === "audit"
                                            ? "bg-primary text-white shadow-xs"
                                            : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <ShieldCheck className="size-3.5" />
                                    <span>{t("tabAudit")}</span>
                                </button>
                            </div>

                            {/* Tab Content Display */}
                            <AnimatePresence mode="wait">
                                {activeTab === "floor" && (
                                    <motion.div
                                        key="floor"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.25 }}
                                        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                                    >
                                        {liveTables.map(tbl => (
                                            <div
                                                key={tbl.id}
                                                className={`rounded-2xl border p-3.5 transition-all relative overflow-hidden ${
                                                    tbl.status === "occupied"
                                                        ? "border-amber-500/30 bg-amber-500/[0.04]"
                                                        : tbl.status === "ready"
                                                          ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                                                          : tbl.status ===
                                                              "billing"
                                                            ? "border-primary/30 bg-primary/[0.04]"
                                                            : "border-border/60 bg-secondary/30 opacity-70"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-extrabold text-sm text-foreground">
                                                        {tbl.id}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                            tbl.status ===
                                                            "occupied"
                                                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                                                : tbl.status ===
                                                                    "ready"
                                                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                                  : tbl.status ===
                                                                      "billing"
                                                                    ? "bg-primary/15 text-primary"
                                                                    : "bg-muted text-muted-foreground"
                                                        }`}
                                                    >
                                                        {tbl.status ===
                                                        "occupied"
                                                            ? t(
                                                                  "statusOccupied",
                                                              )
                                                            : tbl.status ===
                                                                "ready"
                                                              ? t("statusReady")
                                                              : tbl.status ===
                                                                  "billing"
                                                                ? t(
                                                                      "statusBilling",
                                                                  )
                                                                : t(
                                                                      "statusVacant",
                                                                  )}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex items-baseline justify-between">
                                                    <div className="text-xs font-bold text-foreground">
                                                        {tbl.spent}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Clock className="size-3" />
                                                        <span>{tbl.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === "kds" && (
                                    <motion.div
                                        key="kds"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.25 }}
                                        className="space-y-2.5"
                                    >
                                        {kdsTickets.map(k => (
                                            <div
                                                key={k.id}
                                                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 p-3.5 shadow-2xs"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-xs text-primary">
                                                            {k.id}
                                                        </span>
                                                        <span className="text-xs font-semibold text-foreground">
                                                            {k.table}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                                                            {k.station}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {k.items}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        <Clock className="size-3" />
                                                        <span>{k.timer}</span>
                                                    </div>
                                                    <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                                                        {k.status}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === "audit" && (
                                    <motion.div
                                        key="audit"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.25 }}
                                        className="space-y-3"
                                    >
                                        <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    {t("grossShiftVolume")}
                                                </div>
                                                <div className="text-2xl font-black text-foreground">
                                                    42,850.00 ETB
                                                </div>
                                            </div>
                                            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <TrendingUp className="size-5" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                                                <div className="text-[11px] text-muted-foreground">
                                                    {t("qrTransfers")}
                                                </div>
                                                <div className="text-sm font-bold text-foreground">
                                                    28,400 ETB (66%)
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                                                <div className="text-[11px] text-muted-foreground">
                                                    {t("cashInDrawer")}
                                                </div>
                                                <div className="text-sm font-bold text-foreground">
                                                    14,450 ETB (34%)
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Bottom Real-time Stream Bar */}
                            <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Wifi className="size-3.5 text-primary" />
                                    <span>{t("localMeshActive")}</span>
                                </div>
                                <span className="font-semibold text-foreground">
                                    {t("tinaVerifyPass")}
                                </span>
                            </div>
                        </div>

                        {/* Floating Decorative Glass Badge */}
                        <div className="absolute -bottom-5 -left-4 hidden sm:flex items-center gap-2.5 rounded-2xl border border-border/80 bg-background/90 px-4 py-2.5 backdrop-blur-xl shadow-xl">
                            <div className="flex size-7 items-center justify-center rounded-xl bg-primary/15 text-primary">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-foreground">
                                    {t("subSecondBadgeTitle")}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                    {t("subSecondBadgeDesc")}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom 4-Metric Glassmorphism Cards Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.7,
                        delay: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 lg:mt-20"
                >
                    <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-lg p-5 shadow-xs transition-all hover:border-primary/40 hover:-translate-y-0.5">
                        <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            {t("stat1Num")}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-foreground mt-1">
                            {t("stat1Label")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {t("stat1Desc")}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-lg p-5 shadow-xs transition-all hover:border-primary/40 hover:-translate-y-0.5">
                        <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            {t("stat2Num")}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-foreground mt-1">
                            {t("stat2Label")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {t("stat2Desc")}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-lg p-5 shadow-xs transition-all hover:border-primary/40 hover:-translate-y-0.5">
                        <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            {t("stat3Num")}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-foreground mt-1">
                            {t("stat3Label")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {t("stat3Desc")}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-lg p-5 shadow-xs transition-all hover:border-primary/40 hover:-translate-y-0.5">
                        <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            {t("stat4Num")}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-foreground mt-1">
                            {t("stat4Label")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {t("stat4Desc")}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
