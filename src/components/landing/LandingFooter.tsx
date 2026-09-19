"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";

export default function LandingFooter() {
    const t = useTranslations("footer");

    return (
        <footer className="relative border-t border-border/80 bg-card/60 backdrop-blur-2xl">
            {/* Top High-Conversion CTA Banner */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -translate-y-8">
                <div className="relative overflow-hidden rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 p-6 sm:p-8 text-white">
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center lg:text-left max-w-xl">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                <Sparkles className="size-3" />
                                <span>{t("ctaBadge")}</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                                {t("ctaTitle")}
                            </h3>
                            <p className="text-white/90 text-xs sm:text-sm">
                                {t("ctaDesc")}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <Link
                                href="/sign-in"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-orange-600 hover:bg-white/90 transition"
                            >
                                <Zap className="size-3.5 fill-current" />
                                <span>{t("getStarted")}</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Links Container */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-2 pb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {/* Brand Column with Golden Cloche Logo */}
                    <div className="col-span-2 space-y-3">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="relative size-8 shrink-0 overflow-hidden rounded-lg border border-border/60">
                                <Image
                                    src="/media/logos/logo_07_golden_cloche.svg"
                                    alt="Fanaye Golden Cloche Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-base font-bold tracking-tight text-foreground">
                                FANAYE OS
                            </span>
                        </Link>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                            {t("brandDesc")}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                {t("meshOnline")}
                            </span>
                        </div>
                    </div>

                    {/* Col 1: Platform */}
                    <div className="space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                            {t("colStations")}
                        </h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li>
                                <a
                                    href="#stations"
                                    className="hover:text-foreground transition"
                                >
                                    Kitchen KDS
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#stations"
                                    className="hover:text-foreground transition"
                                >
                                    Barista Bar
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#stations"
                                    className="hover:text-foreground transition"
                                >
                                    Bakery & Cakes
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#stations"
                                    className="hover:text-foreground transition"
                                >
                                    Soft Drinks
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#stations"
                                    className="hover:text-foreground transition"
                                >
                                    Waiter POS
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Col 2: Capabilities */}
                    <div className="space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                            {t("colCapabilities")}
                        </h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li>
                                <a
                                    href="#tinaverify"
                                    className="hover:text-foreground transition"
                                >
                                    TinaVerify™ AI
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#how-it-works"
                                    className="hover:text-foreground transition"
                                >
                                    4-Stage Lifecycle
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#comparison"
                                    className="hover:text-foreground transition"
                                >
                                    Legacy POS vs Fanaye
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#features"
                                    className="hover:text-foreground transition"
                                >
                                    Cash Drops
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#features"
                                    className="hover:text-foreground transition"
                                >
                                    Daily Close
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Col 3: Roles */}
                    <div className="space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                            {t("colRoles")}
                        </h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link
                                    href="/sign-in"
                                    className="hover:text-foreground transition"
                                >
                                    Waiter
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/sign-in"
                                    className="hover:text-foreground transition"
                                >
                                    Chef & Barista
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/sign-in"
                                    className="hover:text-foreground transition"
                                >
                                    Cashier Desk
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/sign-in"
                                    className="hover:text-foreground transition"
                                >
                                    Manager
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/sign-in"
                                    className="hover:text-foreground transition"
                                >
                                    Owner Admin
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
                    <p>{t("copyright")}</p>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <ShieldCheck className="size-3" /> {t("encryption")}
                        </span>
                        <span>•</span>
                        <span>v2.4.0</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
