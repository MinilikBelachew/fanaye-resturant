"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import { LocaleSwitcher } from "@/components/theme/LocaleSwitcher";
import { useTranslations } from "next-intl";
import {
    ArrowRight,
    Menu,
    X,
    Activity,
    Layers,
    Sparkles,
    Cpu,
    CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingNavbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const t = useTranslations("nav");

    const navLinks = [
        { name: t("stations"), href: "#stations", icon: Layers },
        { name: t("howItWorks"), href: "#how-it-works", icon: Sparkles },
        { name: t("roles"), href: "#roles", icon: Cpu },
        { name: t("pricing"), href: "#pricing", icon: CreditCard },
    ];

    return (
        <header className="fixed top-3 sm:top-4 inset-x-0 mx-auto z-50 w-[94%] max-w-5xl">
            <div className="relative rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-5 py-2 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    {/* Brand Logo with Golden Cloche Mark */}
                    <Link href="/" className="group flex items-center gap-2.5">
                        <div className="relative size-7 sm:size-8 shrink-0 overflow-hidden rounded-lg border border-border/60 transition-transform group-hover:scale-105">
                            <Image
                                src="/media/logos/logo_07_golden_cloche.svg"
                                alt="Fanaye Golden Cloche Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black tracking-tight text-foreground">
                                    FANAYE
                                </span>
                                <span className="rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    OS 2.4
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* System Status Beacon (Desktop) */}
                    <div className="hidden lg:flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        <Activity className="size-3 text-emerald-500 animate-pulse" />
                        <span>{t("meshActive")}</span>
                        <span className="text-foreground/30">•</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                            {t("meshSync")}
                        </span>
                    </div>

                    {/* 4 Clean Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => {
                            const Icon = link.icon;
                            return (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                >
                                    <Icon className="size-3 opacity-70" />
                                    {link.name}
                                </a>
                            );
                        })}
                    </nav>

                    {/* Right Action Hub: Locale Switcher, Theme Toggle, CTA */}
                    <div className="flex items-center gap-2">
                        <LocaleSwitcher />
                        <ThemeToggleButton className="hidden sm:flex border border-border/50 bg-secondary/40 size-7" />

                        <Link
                            href="/sign-in"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
                        >
                            <span>{t("launchDemo")}</span>
                            <ArrowRight className="size-3" />
                        </Link>

                        {/* Mobile Menu Trigger */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="flex md:hidden size-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-foreground"
                            aria-label="Toggle navigation menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="size-4" />
                            ) : (
                                <Menu className="size-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-3 pt-3 border-t border-border/60 space-y-1.5">
                        <div className="flex items-center justify-between pb-2">
                            <LocaleSwitcher />
                            <ThemeToggleButton className="size-7" />
                        </div>
                        {navLinks.map(link => {
                            const Icon = link.icon;
                            return (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-secondary"
                                >
                                    <Icon className="size-3.5 text-orange-500" />
                                    {link.name}
                                </a>
                            );
                        })}
                        <div className="pt-2">
                            <Link
                                href="/sign-in"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground"
                            >
                                {t("openPos")}
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
