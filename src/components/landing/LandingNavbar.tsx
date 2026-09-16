"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import { LocaleSwitcher } from "@/components/theme/LocaleSwitcher";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Menu, Sparkles, X } from "lucide-react";

export default function LandingNavbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const t = useTranslations("nav");

    const navLinks = [
        { name: t("stations"), href: "#stations", active: true },
        { name: t("howItWorks"), href: "#how-it-works" },
        { name: t("roles"), href: "#roles" },
        { name: t("pricing"), href: "#pricing" },
    ];

    return (
        <header className="fixed top-4 sm:top-6 inset-x-0 mx-auto z-50 w-[94%] max-w-6xl">
            <div className="relative rounded-full border border-white/50 dark:border-white/10 bg-background/60 dark:bg-background/40 px-5 sm:px-7 py-3 backdrop-blur-2xl shadow-sm transition-all">
                <div className="flex items-center justify-between gap-4">
                    {/* Brand: LUMEN style clean logo + uppercase bold title */}
                    <Link
                        href="/"
                        className="group flex items-center gap-2.5 shrink-0"
                    >
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                            <Sparkles className="size-4 fill-primary/20" />
                        </div>
                        <span className="text-sm sm:text-base font-extrabold tracking-widest uppercase text-foreground whitespace-nowrap">
                            FANAYE
                        </span>
                    </Link>

                    {/* Centered Navigation Links in One Clean Line */}
                    <nav className="hidden md:flex items-center gap-7 lg:gap-9">
                        {navLinks.map(link => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="relative py-1 text-xs sm:text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap group"
                            >
                                <span>{link.name}</span>
                                {link.active && (
                                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-primary/80" />
                                )}
                            </a>
                        ))}
                    </nav>

                    {/* Right Action Hub: Locale Switcher, Theme Toggle, Dark Pill CTA */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <LocaleSwitcher />
                        <ThemeToggleButton className="hidden sm:flex border border-white/40 dark:border-white/10 bg-background/50 size-8 rounded-full" />

                        <Link
                            href="/sign-in"
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground hover:bg-primary text-background hover:text-white px-5 sm:px-6 py-2.5 text-xs sm:text-[13px] font-semibold transition-all duration-300 shadow-sm active:scale-[0.98] whitespace-nowrap"
                        >
                            <span>{t("launchDemo") || "Launch Demo"}</span>
                            <ArrowUpRight className="size-3.5 stroke-[2.5]" />
                        </Link>

                        {/* Mobile Menu Trigger */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="flex md:hidden size-8 items-center justify-center rounded-full border border-white/40 bg-background/50 text-foreground"
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
                    <div className="md:hidden mt-3 pt-3 border-t border-border/40 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between pb-2">
                            <LocaleSwitcher />
                            <ThemeToggleButton className="size-8" />
                        </div>
                        {navLinks.map(link => (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/60"
                            >
                                {link.name}
                            </a>
                        ))}
                        <div className="pt-2">
                            <Link
                                href="/sign-in"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-foreground text-background py-2.5 text-xs font-semibold"
                            >
                                <span>{t("openPos") || "Launch Demo"}</span>
                                <ArrowUpRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
