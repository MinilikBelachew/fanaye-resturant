"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

const FOOTER_COLUMNS = [
    {
        title: "Platform",
        titleAm: "መድረክ",
        links: [
            {
                label: "Front of House",
                labelAm: "የአዳራሽ አገልግሎት",
                href: "#connected-platform",
            },
            {
                label: "Kitchen KDS",
                labelAm: "ኩሽና (KDS)",
                href: "#connected-platform",
            },
            {
                label: "Inventory & Store",
                labelAm: "ክምችት እና ስቶር",
                href: "#connected-platform",
            },
            {
                label: "Cashier & Z-Report",
                labelAm: "ካሼር እና Z-Report",
                href: "#how-it-works",
            },
            {
                label: "Delivery & Hotel",
                labelAm: "ዴሊቨሪ እና ሆቴል",
                href: "#connected-platform",
            },
        ],
    },
    {
        title: "Solutions",
        titleAm: "መፍትሄዎች",
        links: [
            {
                label: "Restaurants & Lounges",
                labelAm: "ሬስቶራንቶች እና ላውንጆች",
                href: "#connected-platform",
            },
            {
                label: "Hotels & Resorts",
                labelAm: "ሆቴሎች እና ሪዞርቶች",
                href: "#connected-platform",
            },
            {
                label: "Cafés & Bakeries",
                labelAm: "ካፌዎች እና ዳቦ ቤቶች",
                href: "#connected-platform",
            },
            {
                label: "Market Prices",
                labelAm: "የገበያ ዋጋ",
                href: "/market-prices",
                isRoute: true,
            },
            {
                label: "Testimonials",
                labelAm: "ምስክርነቶች",
                href: "#testimonials",
            },
        ],
    },
    {
        title: "Roles",
        titleAm: "ሚናዎች",
        links: [
            {
                label: "Owner Admin",
                labelAm: "ባለቤት",
                href: "/sign-in",
                isRoute: true,
            },
            {
                label: "Branch Manager",
                labelAm: "የቅርንጫፍ ስራ አስኪያጅ",
                href: "/sign-in",
                isRoute: true,
            },
            {
                label: "Waiter POS",
                labelAm: "አስተናጋጅ POS",
                href: "/sign-in",
                isRoute: true,
            },
            {
                label: "Kitchen & Bar",
                labelAm: "ኩሽና እና ባር",
                href: "/sign-in",
                isRoute: true,
            },
            {
                label: "Store & Cashier",
                labelAm: "ስቶር እና ካሼር",
                href: "/sign-in",
                isRoute: true,
            },
        ],
    },
    {
        title: "Resources",
        titleAm: "መርጃዎች",
        links: [
            {
                label: "How It Works",
                labelAm: "እንዴት ይሰራል",
                href: "#how-it-works",
            },
            {
                label: "Testimonials",
                labelAm: "ምስክርነቶች",
                href: "#testimonials",
            },
            {
                label: "Market Prices",
                labelAm: "የገበያ ዋጋ",
                href: "/market-prices",
                isRoute: true,
            },
            { label: "FAQs", labelAm: "ተደጋጋሚ ጥያቄዎች", href: "#faq" },
            {
                label: "Get Started",
                labelAm: "ይጀምሩ",
                href: "/sign-in",
                isRoute: true,
            },
        ],
    },
];

export default function LandingFooter() {
    const isAm = useLocale() === "am";

    return (
        <footer className="relative overflow-hidden border-t border-border/60 bg-secondary/25 dark:bg-background text-foreground pt-16 sm:pt-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* 5-Column Footer Links */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10">
                    {FOOTER_COLUMNS.map(col => (
                        <div key={col.title}>
                            <h4 className="text-sm font-semibold tracking-tight text-foreground">
                                {isAm ? col.titleAm : col.title}
                            </h4>
                            <ul className="mt-4 space-y-2.5 text-xs sm:text-[13px] text-muted-foreground">
                                {col.links.map(item => (
                                    <li key={item.label}>
                                        {item.isRoute ? (
                                            <Link
                                                href={item.href}
                                                className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                            >
                                                {isAm
                                                    ? item.labelAm
                                                    : item.label}
                                            </Link>
                                        ) : (
                                            <a
                                                href={item.href}
                                                className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                            >
                                                {isAm
                                                    ? item.labelAm
                                                    : item.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Contact Column */}
                    <div>
                        <h4 className="text-sm font-semibold tracking-tight text-foreground">
                            {isAm ? "ያግኙን" : "Contact"}
                        </h4>
                        <ul className="mt-4 space-y-2.5 text-xs sm:text-[13px] text-muted-foreground">
                            <li>
                                <a
                                    href="mailto:hello@restorch.com"
                                    className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                >
                                    hello@restorch.com
                                </a>
                            </li>
                            <li>
                                <a
                                    href="tel:+251911000000"
                                    className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                >
                                    +251 911 000 000
                                </a>
                            </li>
                            <li>
                                {isAm ? "ቦሌ፣ አዲስ አበባ" : "Bole, Addis Ababa"}
                            </li>
                            <li>
                                <Link
                                    href="/sign-in"
                                    className="font-medium text-orange-600 dark:text-orange-400 hover:underline transition-colors"
                                >
                                    {isAm
                                        ? "ወደ ስራ ቦታ ይግቡ →"
                                        : "Launch Workspace →"}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Hairline Divider */}
                <div className="mt-12 border-t border-border/60 pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1.5 text-xs sm:text-[13px] text-muted-foreground">
                        <p className="text-foreground/85">
                            {isAm
                                ? "Restorch Hospitality OS፣ ቦሌ መድኃኔዓለም፣ አዲስ አበባ፣ ኢትዮጵያ።"
                                : "Restorch Hospitality OS, Bole Medhanealem, Addis Ababa, Ethiopia."}
                        </p>
                        <p>
                            &copy; {new Date().getFullYear()} Restorch.{" "}
                            {isAm
                                ? "መብቱ በህግ የተጠበቀ ነው።"
                                : "All rights reserved."}
                        </p>
                    </div>

                    {/* Circular Social Icons */}
                    <div className="flex items-center gap-2.5">
                        <a
                            href="#faq"
                            aria-label="LinkedIn"
                            className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105"
                        >
                            <span className="text-xs font-extrabold leading-none">
                                in
                            </span>
                        </a>
                        <a
                            href="#faq"
                            aria-label="X"
                            className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="size-3.5 fill-current"
                                aria-hidden="true"
                            >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        <a
                            href="#faq"
                            aria-label="Instagram"
                            className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="size-3.5 fill-none stroke-current"
                                strokeWidth="2.2"
                                aria-hidden="true"
                            >
                                <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="5"
                                />
                                <circle cx="12" cy="12" r="4" />
                                <circle
                                    cx="17.5"
                                    cy="6.5"
                                    r="0.8"
                                    className="fill-current"
                                />
                            </svg>
                        </a>
                        <a
                            href="#faq"
                            aria-label="Facebook"
                            className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105"
                        >
                            <span className="text-sm font-extrabold leading-none">
                                f
                            </span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Oversized Bottom Brand Wordmark */}
            <div
                aria-hidden="true"
                className="pointer-events-none select-none mt-8 sm:mt-10 overflow-hidden text-center"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <span className="block font-bold tracking-[-0.04em] leading-[0.82] text-foreground/[0.06] dark:text-white/[0.06] text-[20vw] sm:text-[17vw] lg:text-[185px] translate-y-2 sm:translate-y-4">
                        Restorch
                    </span>
                </div>
            </div>
        </footer>
    );
}
