"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
    Smartphone,
    ChefHat,
    Receipt,
    UserCheck,
    BarChart3,
    CheckCircle2,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { ScrollReveal } from "./LandingMotion";

const roleIcons = [Smartphone, ChefHat, Receipt, UserCheck, BarChart3];
const roleImages = [
    "/images/landing/hero_restaurant_system.jpg",
    "/images/landing/barista_station.jpg",
    "/images/landing/tinaverify_audit.jpg",
    "/images/landing/hero_restaurant_system.jpg",
    "/images/landing/tinaverify_audit.jpg",
];

export default function LandingRoleMatrix() {
    const t = useTranslations("roles");
    const [selectedRole, setSelectedRole] = useState(0);

    const roleItems = t.raw("roleItems") as Array<{
        id: string;
        title: string;
        subtitle: string;
        badge: string;
        headline: string;
        description: string;
        features: string[];
        metricValue: string;
        metricLabel: string;
    }>;

    const current = roleItems[selectedRole] || roleItems[0];
    const Icon = roleIcons[selectedRole % roleIcons.length];
    const roleImage = roleImages[selectedRole % roleImages.length];

    return (
        <section id="roles" className="relative py-12 md:py-16">
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

                {/* Role Switcher Bar */}
                <div className="mt-8 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {roleItems.map((role, idx) => {
                        const RoleIcon = roleIcons[idx % roleIcons.length];
                        const isSelected = selectedRole === idx;
                        return (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => setSelectedRole(idx)}
                                className={cn(
                                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer border",
                                    isSelected
                                        ? "border-orange-500/60 bg-orange-500/10 text-foreground"
                                        : "border-border/60 bg-card/60 text-muted-foreground hover:bg-secondary hover:text-foreground",
                                )}
                            >
                                <RoleIcon className={cn("size-3.5", isSelected ? "text-orange-500" : "text-muted-foreground")} />
                                <span>{role.title}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Role Showcase Card */}
                <div className="mt-4 rounded-2xl border border-border/80 bg-card/80 p-5 sm:p-7 backdrop-blur-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        {/* Left Details */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                    <Icon className="size-4" />
                                </div>
                                <div>
                                    <span className="rounded-full bg-secondary px-2 py-0.2 text-[10px] font-semibold text-muted-foreground">
                                        {current.badge}
                                    </span>
                                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                                        {current.title}
                                    </h3>
                                </div>
                            </div>

                            <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                                {current.headline}
                            </p>

                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {current.description}
                            </p>

                            {/* Features Checklist */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {current.features.map((feat, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2">
                                <Link
                                    href="/sign-in"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
                                >
                                    <span>{t("demoPrefix")} {current.title} {t("demoSuffix")}</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Right Role Image Frame & Metric */}
                        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-border">
                                <Image
                                    src={roleImage}
                                    alt={current.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-transparent to-transparent flex items-end p-3">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl sm:text-3xl font-black font-mono text-orange-600 dark:text-orange-400">
                                            {current.metricValue}
                                        </span>
                                        <span className="text-[11px] text-white font-medium">
                                            {current.metricLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-1 text-xs">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>{t("permissionsLabel")}</span>
                                    <span className="font-semibold text-foreground">{t("permissionsValue")}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>{t("auditLabel")}</span>
                                    <span className="font-semibold text-emerald-600">{t("auditValue")}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
