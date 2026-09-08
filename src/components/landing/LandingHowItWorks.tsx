"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Smartphone,
    ChefHat,
    ShieldCheck,
    FileSpreadsheet,
    CheckCircle2,
    Sparkles,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./LandingMotion";
import { useTranslations } from "next-intl";

export default function LandingHowItWorks() {
    const [activeStep, setActiveStep] = useState(0);
    const t = useTranslations("howItWorks");

    const steps = [
        {
            num: t("step1.num"),
            title: t("step1.title"),
            subtitle: t("step1.subtitle"),
            icon: Smartphone,
            image: "/images/landing/hero_restaurant_system.jpg",
            headline: t("step1.headline"),
            points: [
                t("step1.points.0"),
                t("step1.points.1"),
                t("step1.points.2"),
                t("step1.points.3"),
            ],
            metric: t("step1.metric"),
        },
        {
            num: t("step2.num"),
            title: t("step2.title"),
            subtitle: t("step2.subtitle"),
            icon: ChefHat,
            image: "/images/landing/barista_station.jpg",
            headline: t("step2.headline"),
            points: [
                t("step2.points.0"),
                t("step2.points.1"),
                t("step2.points.2"),
                t("step2.points.3"),
            ],
            metric: t("step2.metric"),
        },
        {
            num: t("step3.num"),
            title: t("step3.title"),
            subtitle: t("step3.subtitle"),
            icon: ShieldCheck,
            image: "/images/landing/tinaverify_audit.jpg",
            headline: t("step3.headline"),
            points: [
                t("step3.points.0"),
                t("step3.points.1"),
                t("step3.points.2"),
                t("step3.points.3"),
            ],
            metric: t("step3.metric"),
        },
        {
            num: t("step4.num"),
            title: t("step4.title"),
            subtitle: t("step4.subtitle"),
            icon: FileSpreadsheet,
            image: "/images/landing/tinaverify_audit.jpg",
            headline: t("step4.headline"),
            points: [
                t("step4.points.0"),
                t("step4.points.1"),
                t("step4.points.2"),
                t("step4.points.3"),
            ],
            metric: t("step4.metric"),
        },
    ];

    const current = steps[activeStep];

    return (
        <section id="how-it-works" className="relative py-12 md:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <ScrollReveal className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                        <Sparkles className="size-3" />
                        <span>{t("badge")}</span>
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {t("titlePrefix")}{" "}
                        <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                            {t("titleHighlight")}
                        </span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        {t("description")}
                    </p>
                </ScrollReveal>

                {/* Steps Navigation Bar */}
                <ScrollReveal delay={0.1} className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {steps.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isActive = activeStep === idx;
                        return (
                            <button
                                key={step.num}
                                type="button"
                                onClick={() => setActiveStep(idx)}
                                className={cn(
                                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer",
                                    isActive
                                        ? "border-orange-500 bg-orange-500/10"
                                        : "border-border/70 bg-card/70 hover:bg-secondary hover:border-orange-500/40",
                                )}
                            >
                                <div className="flex w-full items-center justify-between text-xs font-mono">
                                    <span className={cn("font-bold", isActive ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground")}>
                                        STEP {step.num}
                                    </span>
                                    <StepIcon className={cn("size-3.5", isActive ? "text-orange-500" : "text-muted-foreground")} />
                                </div>
                                <h3 className="mt-2 text-xs font-bold text-foreground line-clamp-1">
                                    {step.title}
                                </h3>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">
                                    {step.subtitle}
                                </p>
                            </button>
                        );
                    })}
                </ScrollReveal>

                {/* Active Step Feature Box */}
                <ScrollReveal delay={0.2} className="mt-6 rounded-2xl border border-border/80 bg-card/85 p-5 sm:p-7 backdrop-blur-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        {/* Left Details */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="rounded-md bg-orange-500/10 px-2 py-0.5 font-mono text-xs font-bold text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                    STAGE {current.num}
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {current.subtitle}
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold text-foreground">
                                {current.headline}
                            </h3>

                            <div className="space-y-2 pt-1">
                                {current.points.map((pt, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-foreground/90">{pt}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs">
                                    <Zap className="size-3.5 text-orange-500" />
                                    <span className="text-muted-foreground">{t("speedBenchmark")}</span>
                                    <span className="font-bold text-emerald-600 font-mono">{current.metric}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {steps.map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setActiveStep(i)}
                                            className={cn(
                                                "size-1.5 rounded-full transition-all cursor-pointer",
                                                activeStep === i ? "w-4 bg-orange-500" : "bg-muted-foreground/30"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Visual Image */}
                        <div className="lg:col-span-5 relative aspect-[16/10] rounded-xl overflow-hidden border border-border">
                            <Image
                                src={current.image}
                                alt={current.title}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex items-end p-3">
                                <div className="flex items-center gap-2 text-xs text-white">
                                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="font-mono">{current.title} • Live Flow</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
