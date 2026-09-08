"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    Calculator,
    TrendingUp,
    ShieldCheck,
    Clock,
    ArrowRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ScrollReveal } from "./LandingMotion";

export default function LandingRoiCalculator() {
    const t = useTranslations("roi");
    const [tables, setTables] = useState<number>(30);
    const [dailyOrders, setDailyOrders] = useState<number>(220);
    const [avgCheck, setAvgCheck] = useState<number>(45);

    // Dynamic Calculations
    const monthlyGrossRevenue = dailyOrders * avgCheck * 30;
    const monthlyFraudSavings = monthlyGrossRevenue * 0.025;
    const monthlyTurnoverGain = monthlyGrossRevenue * 0.08;
    const monthlyHoursSaved = 2.5 * 30;
    const totalAnnualValue = (monthlyFraudSavings + monthlyTurnoverGain) * 12;

    return (
        <section id="roi" className="relative py-12 md:py-16 bg-secondary/30">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <ScrollReveal className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                        <Calculator className="size-3" />
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

                {/* Calculator Container */}
                <div className="mt-10 rounded-2xl border border-border/80 bg-card/80 p-5 sm:p-7 backdrop-blur-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                        {/* Left Inputs / Sliders */}
                        <div className="lg:col-span-6 space-y-6">
                            {/* Slider 1: Active Tables */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label
                                        htmlFor="tables-slider"
                                        className="text-xs font-bold text-foreground"
                                    >
                                        {t("activeTables")}
                                    </label>
                                    <span className="rounded-lg border border-border bg-background px-2.5 py-0.5 font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                                        {tables} {t("tablesUnit")}
                                    </span>
                                </div>
                                <input
                                    id="tables-slider"
                                    type="range"
                                    min="5"
                                    max="150"
                                    step="5"
                                    value={tables}
                                    onChange={e => setTables(Number(e.target.value))}
                                    className="w-full accent-orange-500 cursor-pointer h-1.5 bg-secondary rounded-lg appearance-none"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{t("tablesBoutique")}</span>
                                    <span>{t("tablesLarge")}</span>
                                </div>
                            </div>

                            {/* Slider 2: Daily Orders / Covers */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label
                                        htmlFor="orders-slider"
                                        className="text-xs font-bold text-foreground"
                                    >
                                        {t("dailyOrders")}
                                    </label>
                                    <span className="rounded-lg border border-border bg-background px-2.5 py-0.5 font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                                        {dailyOrders} {t("ordersUnit")}
                                    </span>
                                </div>
                                <input
                                    id="orders-slider"
                                    type="range"
                                    min="30"
                                    max="1000"
                                    step="10"
                                    value={dailyOrders}
                                    onChange={e => setDailyOrders(Number(e.target.value))}
                                    className="w-full accent-orange-500 cursor-pointer h-1.5 bg-secondary rounded-lg appearance-none"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{t("ordersMin")}</span>
                                    <span>{t("ordersMax")}</span>
                                </div>
                            </div>

                            {/* Slider 3: Average Check */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label
                                        htmlFor="avgcheck-slider"
                                        className="text-xs font-bold text-foreground"
                                    >
                                        {t("avgCheck")}
                                    </label>
                                    <span className="rounded-lg border border-border bg-background px-2.5 py-0.5 font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                                        ${avgCheck}.00
                                    </span>
                                </div>
                                <input
                                    id="avgcheck-slider"
                                    type="range"
                                    min="10"
                                    max="200"
                                    step="5"
                                    value={avgCheck}
                                    onChange={e => setAvgCheck(Number(e.target.value))}
                                    className="w-full accent-orange-500 cursor-pointer h-1.5 bg-secondary rounded-lg appearance-none"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{t("checkCafe")}</span>
                                    <span>{t("checkFineDining")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Computed Output */}
                        <div className="lg:col-span-6 rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                    {t("annualValue")}
                                </span>
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    +ROI Positive
                                </span>
                            </div>

                            <div>
                                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-foreground">
                                    ${totalAnnualValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground ml-1.5">
                                    {t("perYear")}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 space-y-0.5">
                                    <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                                        <ShieldCheck className="size-3" />
                                        <span>{t("antiFraudSavings")}</span>
                                    </div>
                                    <p className="font-mono text-xs sm:text-sm font-bold text-foreground">
                                        +${(monthlyFraudSavings * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}{t("perYr")}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 space-y-0.5">
                                    <div className="flex items-center gap-1 text-orange-600 text-[10px] font-semibold">
                                        <TrendingUp className="size-3" />
                                        <span>{t("turnoverGain")}</span>
                                    </div>
                                    <p className="font-mono text-xs sm:text-sm font-bold text-foreground">
                                        +${(monthlyTurnoverGain * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}{t("perYr")}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 space-y-0.5">
                                    <div className="flex items-center gap-1 text-purple-600 text-[10px] font-semibold">
                                        <Clock className="size-3" />
                                        <span>{t("hoursSaved")}</span>
                                    </div>
                                    <p className="font-mono text-xs sm:text-sm font-bold text-foreground">
                                        {monthlyHoursSaved} {t("hrsMo")}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-1">
                                <Link
                                    href="/sign-in"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 py-2.5 text-xs font-bold text-white transition"
                                >
                                    <span>{t("deployBtn")}</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
