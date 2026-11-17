"use client";

import { useLocale } from "next-intl";
import { useListPublicMarketItemsQuery } from "@/context/services/marketPricesApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import { Link } from "@/i18n/navigation";
import {
    ArrowUpRight,
    Minus,
    ShoppingBasket,
    TrendingDown,
    TrendingUp,
} from "lucide-react";

function formatBirr(value: number | null, isAm: boolean) {
    if (value == null || Number.isNaN(value)) return "—";
    return `${Math.round(value).toLocaleString()} ${isAm ? "ብር" : "ETB"}`;
}

export default function LandingMarquee() {
    const isAm = useLocale() === "am";
    const { data, isLoading } = useListPublicMarketItemsQuery({ limit: 12 });
    const items = (data?.items ?? []).filter(
        item => item.averagePrice !== null,
    );

    // Ensure the track is always wide enough for seamless looping on ultra-wide screens
    const baseItems =
        items.length > 0 && items.length < 6
            ? Array.from({ length: Math.ceil(6 / items.length) }).flatMap(
                  () => items,
              )
            : items;
    const marqueeItems =
        baseItems.length > 0 ? [...baseItems, ...baseItems] : [];

    return (
        <section className="relative border-y border-border/50 bg-background py-6 overflow-hidden">
            <style>{`
                @keyframes restorch-market-marquee {
                    0% {
                        transform: translate3d(0, 0, 0);
                    }
                    100% {
                        transform: translate3d(-50%, 0, 0);
                    }
                }
                .restorch-marquee-track {
                    animation: restorch-market-marquee 38s linear infinite;
                    will-change: transform;
                }
                .restorch-marquee-wrap:hover .restorch-marquee-track {
                    animation-play-state: paused;
                }
            `}</style>

            {/* Header Row */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                            <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
                            {isAm ? "ቀጥታ ገበያ" : "Live Gebeya"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {isAm
                                ? "ዕለታዊ የጅምላ ግብዓት ዋጋዎች"
                                : "Daily wholesale ingredient benchmarks"}
                            {items.length > 0
                                ? isAm
                                    ? ` · ${items.length} እቃዎች`
                                    : ` · ${items.length} tracked`
                                : ""}
                        </span>
                    </div>

                    <Link
                        href="/market-prices"
                        className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-foreground/85 transition-all hover:border-orange-500/40 hover:text-orange-600 dark:hover:text-orange-400"
                    >
                        <span>
                            {isAm ? "ሁሉንም የገበያ ዋጋ ይመልከቱ" : "All Market Prices"}
                        </span>
                        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                </div>
            </div>

            {/* Moving Marquee Strip */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-4">
                {isLoading ? (
                    <div className="flex items-center gap-3.5 overflow-hidden">
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="h-[66px] w-64 shrink-0 animate-pulse rounded-2xl border border-border/50 bg-card/50"
                            />
                        ))}
                    </div>
                ) : marqueeItems.length > 0 ? (
                    <div className="restorch-marquee-wrap relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
                        <div className="restorch-marquee-track flex w-max items-center gap-3.5 py-1">
                            {marqueeItems.map((item, idx) => {
                                const change = item.changePercent;
                                const isUp = change !== null && change > 0.05;
                                const isDown =
                                    change !== null && change < -0.05;
                                const photoSrc = item.photoUrl
                                    ? filePublicUrl(item.photoUrl)
                                    : null;

                                return (
                                    <Link
                                        key={`${item.id}-${idx}`}
                                        href={`/market-prices/${item.slug || item.id}`}
                                        className="group flex shrink-0 items-center gap-3.5 rounded-2xl border border-border/60 bg-card/80 dark:bg-white/[0.03] px-3.5 py-2.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/45 hover:bg-card dark:hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                                    >
                                        <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 ring-black/5 dark:ring-white/10">
                                            {photoSrc ? (
                                                <img
                                                    src={photoSrc}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <ShoppingBasket className="size-4 text-muted-foreground" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="truncate text-[13px] font-semibold tracking-tight text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                    {item.name}
                                                </h4>
                                                {change !== null ? (
                                                    <span
                                                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-mono font-semibold leading-none ${
                                                            isUp
                                                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                                : isDown
                                                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                  : "bg-muted text-muted-foreground"
                                                        }`}
                                                    >
                                                        {isUp ? (
                                                            <TrendingUp className="size-2.5" />
                                                        ) : isDown ? (
                                                            <TrendingDown className="size-2.5" />
                                                        ) : (
                                                            <Minus className="size-2.5" />
                                                        )}
                                                        {isUp ? "+" : ""}
                                                        {change.toFixed(1)}%
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="mt-1 flex items-baseline gap-1.5 text-xs">
                                                <span className="font-mono font-bold text-foreground">
                                                    {formatBirr(
                                                        item.averagePrice,
                                                        isAm,
                                                    )}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    / {item.unit.code}
                                                </span>
                                                {item.marketplaceCount > 0 ? (
                                                    <span className="text-[11px] text-muted-foreground/75">
                                                        ·{" "}
                                                        {item.marketplaceCount}{" "}
                                                        {isAm
                                                            ? "ገበያ"
                                                            : item.marketplaceCount ===
                                                                1
                                                              ? "mkt"
                                                              : "mkts"}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <Link
                        href="/market-prices"
                        className="flex items-center justify-between w-full rounded-2xl border border-border/60 bg-card/60 px-5 py-3.5 text-xs text-muted-foreground hover:border-orange-500/40 hover:text-foreground transition-colors"
                    >
                        <span>
                            {isAm
                                ? "ዕለታዊ የጅምላ ግብዓት ዋጋዎችን በየገበያው በቀጥታ ይከታተሉ።"
                                : "Track daily wholesale ingredient prices across local markets in real time."}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400 shrink-0 ml-4">
                            {isAm ? "የገበያ ዋጋ ይመልከቱ" : "Explore Market Prices"}
                            <ArrowUpRight className="size-3.5" />
                        </span>
                    </Link>
                )}
            </div>
        </section>
    );
}
