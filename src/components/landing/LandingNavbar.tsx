"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import { LocaleSwitcher } from "@/components/theme/LocaleSwitcher";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { RestorchLogo } from "@/components/common/RestorchLogo";
import { useCalendarMode } from "@/hooks/useCalendarMode";

export default function LandingNavbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const locale = useLocale();
    const isAm = locale === "am";
    const t = useTranslations("nav");
    const { calendarMode, setCalendarMode } = useCalendarMode();

    const isMarketPrices = pathname?.startsWith("/market-prices");
    const isHomePage =
        !pathname || pathname === "/" || pathname === `/${locale}`;

    const navLinks = [
        {
            name: isAm ? "ዋና ገጽ" : "Home",
            href: isHomePage ? "#home" : `/${locale}#home`,
            isRoute: false,
        },
        {
            name: isAm ? "መድረክ" : "Platform",
            href: isHomePage
                ? "#connected-platform"
                : `/${locale}#connected-platform`,
            isRoute: false,
        },
        {
            name: isAm ? "ባህሪያት" : "Features",
            href: isHomePage ? "#features" : `/${locale}#features`,
            isRoute: false,
        },
        {
            name: t("howItWorks"),
            href: isHomePage ? "#how-it-works" : `/${locale}#how-it-works`,
            isRoute: false,
        },
        {
            name: isAm ? "የገበያ ዋጋ" : "Market Prices",
            href: "/market-prices",
            isRoute: true,
        },
        {
            name: isAm ? "ምስክርነቶች" : "Testimonials",
            href: isHomePage ? "#testimonials" : `/${locale}#testimonials`,
            isRoute: false,
        },
        {
            name: isAm ? "ጥያቄዎች" : "FAQ",
            href: isHomePage ? "#faq" : `/${locale}#faq`,
            isRoute: false,
        },
    ];

    return (
        <header className="fixed top-4 sm:top-5 inset-x-0 mx-auto z-50 w-[94%] max-w-6xl">
            <div className="relative rounded-full border border-border/70 dark:border-white/10 bg-background/80 dark:bg-[#0B0F17]/80 px-4 sm:px-6 py-2.5 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all">
                <div className="flex items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="group flex items-center gap-2 shrink-0 transition-opacity hover:opacity-90"
                    >
                        <RestorchLogo variant="full" height={26} priority />
                    </Link>

                    {/* Centered Navigation Links */}
                    <nav className="hidden md:flex items-center gap-5 lg:gap-7">
                        {navLinks.map(link => {
                            const isActive =
                                link.isRoute &&
                                link.href === "/market-prices" &&
                                isMarketPrices;

                            return link.isRoute ? (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative py-1 text-xs sm:text-[13px] font-medium transition-colors whitespace-nowrap ${
                                        isActive
                                            ? "text-orange-600 dark:text-orange-400 font-semibold"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <span>{link.name}</span>
                                    {isActive ? (
                                        <span className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full bg-orange-500" />
                                    ) : null}
                                </Link>
                            ) : (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="relative py-1 text-xs sm:text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
                                >
                                    <span>{link.name}</span>
                                </a>
                            );
                        })}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <LocaleSwitcher />

                        {/* EC / GC Calendar Switcher */}
                        <div
                            className="hidden sm:inline-flex items-center rounded-full border border-border/70 dark:border-white/10 bg-background/60 p-0.5 text-[10px] font-mono font-semibold"
                            role="group"
                            aria-label="Calendar mode"
                        >
                            <button
                                type="button"
                                onClick={() => setCalendarMode("ETHIOPIAN")}
                                className={`rounded-full px-2 py-1 transition-colors ${
                                    calendarMode === "ETHIOPIAN"
                                        ? "bg-orange-500 text-white"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                                title={
                                    isAm
                                        ? "የኢትዮጵያ ዘመን አቆጣጠር"
                                        : "Ethiopian Calendar"
                                }
                            >
                                EC
                            </button>
                            <button
                                type="button"
                                onClick={() => setCalendarMode("GREGORIAN")}
                                className={`rounded-full px-2 py-1 transition-colors ${
                                    calendarMode === "GREGORIAN"
                                        ? "bg-foreground text-background"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                                title={
                                    isAm
                                        ? "የፈረንጆች ዘመን አቆጣጠር"
                                        : "Gregorian Calendar"
                                }
                            >
                                GC
                            </button>
                        </div>

                        <ThemeToggleButton className="hidden sm:flex border border-border/70 dark:border-white/10 bg-background/60 size-8 rounded-full" />

                        <Link
                            href="/sign-in"
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground hover:bg-foreground/90 text-background px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
                        >
                            <span>{t("getStarted")}</span>
                            <ArrowUpRight className="size-3.5 stroke-[2.5]" />
                        </Link>

                        {/* Mobile Menu Trigger */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="flex md:hidden size-8 items-center justify-center rounded-full border border-border/70 bg-background/60 text-foreground"
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
                    <div className="md:hidden mt-3 pt-3 border-t border-border/40 space-y-1.5 animate-in fade-in">
                        <div className="flex items-center justify-between gap-2 pb-2">
                            <LocaleSwitcher />
                            <div className="inline-flex items-center rounded-full border border-border/70 bg-background/60 p-0.5 text-[10px] font-mono font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setCalendarMode("ETHIOPIAN")}
                                    className={`rounded-full px-2 py-1 ${
                                        calendarMode === "ETHIOPIAN"
                                            ? "bg-orange-500 text-white"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    EC
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalendarMode("GREGORIAN")}
                                    className={`rounded-full px-2 py-1 ${
                                        calendarMode === "GREGORIAN"
                                            ? "bg-foreground text-background"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    GC
                                </button>
                            </div>
                            <ThemeToggleButton className="size-8" />
                        </div>
                        {navLinks.map(link =>
                            link.isRoute ? (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/60"
                                >
                                    {link.name}
                                </Link>
                            ) : (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/60"
                                >
                                    {link.name}
                                </a>
                            ),
                        )}
                        <div className="pt-2">
                            <Link
                                href="/sign-in"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-foreground text-background py-2.5 text-xs font-semibold"
                            >
                                <span>{t("getStarted")}</span>
                                <ArrowUpRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
