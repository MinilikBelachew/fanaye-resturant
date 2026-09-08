"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./LandingMotion";

export default function LandingPricing() {
    const t = useTranslations("pricing");
    const [annual, setAnnual] = useState(true);

    const plans = t.raw("plans") as Array<{
        name: string;
        tagline: string;
        monthlyPrice: number;
        annualPrice: number;
        highlight: boolean;
        badge: string | null;
        features: string[];
        cta: string;
    }>;

    return (
        <section id="pricing" className="relative py-12 md:py-16 bg-secondary/30">
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

                    {/* Billing Interval Toggle */}
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 p-1">
                        <button
                            type="button"
                            onClick={() => setAnnual(false)}
                            className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
                                !annual
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {t("monthly")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setAnnual(true)}
                            className={cn(
                                "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
                                annual
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <span>{t("annual")}</span>
                            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {t("save20")}
                            </span>
                        </button>
                    </div>
                </ScrollReveal>

                {/* Pricing Cards Grid */}
                <StaggerContainer className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    {plans.map(plan => {
                        const price = annual ? plan.annualPrice : plan.monthlyPrice;
                        return (
                            <StaggerItem
                                key={plan.name}
                                className={cn(
                                    "relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 backdrop-blur-xl transition-colors",
                                    plan.highlight
                                        ? "border-2 border-orange-500 bg-gradient-to-b from-orange-500/10 via-card to-card"
                                        : "border border-border/80 bg-card/80 hover:border-orange-500/30",
                                )}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 px-3 py-0.5 text-[10px] font-bold text-white">
                                        {plan.badge}
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        {plan.name}
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground min-h-[32px]">
                                        {plan.tagline}
                                    </p>

                                    {/* Price Display */}
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-foreground">
                                            ${price}
                                        </span>
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {t("perMonth")}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {annual ? t("billedAnnually") : t("billedMonthly")}
                                    </p>

                                    {/* Features List */}
                                    <div className="mt-5 space-y-2.5 pt-4 border-t border-border/50">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {t("includedFeatures")}
                                        </span>
                                        <ul className="space-y-2 text-xs text-muted-foreground">
                                            {plan.features.map(feat => (
                                                <li key={feat} className="flex items-start gap-2">
                                                    <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span className="text-foreground/90">{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-6 pt-2">
                                    <Link
                                        href="/sign-in"
                                        className={cn(
                                            "flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors",
                                            plan.highlight
                                                ? "bg-orange-600 hover:bg-orange-700 text-white"
                                                : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground",
                                        )}
                                    >
                                        <span>{plan.cta}</span>
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                </div>
                            </StaggerItem>
                        );
                    })}
                </StaggerContainer>
            </div>
        </section>
    );
}
