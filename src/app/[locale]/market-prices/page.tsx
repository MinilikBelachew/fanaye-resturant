"use client";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingNavbar from "@/components/landing/LandingNavbar";
import {
    useGetPublicMarketMetadataQuery,
    useListPublicMarketItemsQuery,
} from "@/context/services/marketPricesApi";
import { MarketItemCard } from "@/domains/market-prices/ui/MarketPriceWidgets";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePublicFeedSocket } from "@/hooks/usePublicFeedSocket";
import {
    formatCalendarDateTime,
    useCalendarMode,
} from "@/hooks/useCalendarMode";
import { Search } from "lucide-react";
import { useState } from "react";

export default function PublicMarketPricesPage() {
    usePublicFeedSocket();
    const locale = useLocale();
    const isAm = locale === "am";
    const { calendarMode } = useCalendarMode();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("ALL");
    const [marketplaceId, setMarketplaceId] = useState("ALL");
    const [page, setPage] = useState(1);

    const { data: meta } = useGetPublicMarketMetadataQuery();
    const { data: itemsData, isLoading } = useListPublicMarketItemsQuery({
        page,
        limit: 18,
        search: search.trim() || undefined,
        categoryId: categoryId === "ALL" ? undefined : categoryId,
        marketplaceId: marketplaceId === "ALL" ? undefined : marketplaceId,
    });

    const items = itemsData?.items ?? [];
    const categories = meta?.categories ?? [];
    const marketplaces = meta?.marketplaces ?? [];
    const totalPages = itemsData?.totalPages ?? 1;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <LandingNavbar />

            <main className="mx-auto max-w-6xl px-4 pt-24 pb-20 sm:px-6 sm:pt-28">
                {/* Compact Header + Search Row */}
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="inline-flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                            <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span>
                                {isAm ? "ቀጥታ የገበያ መረጃ" : "Live Gebeya Index"}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground normal-case tracking-normal">
                                {formatCalendarDateTime(
                                    new Date(),
                                    locale,
                                    calendarMode,
                                    true,
                                )}
                            </span>
                        </div>
                        <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {isAm ? "የገበያ ዋጋዎች" : "Market Prices"}
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                            {isAm
                                ? "ዕለታዊ የጅምላ ግብዓት ዋጋዎች በየአካባቢው ገበያዎች።"
                                : "Daily wholesale benchmarks across local markets."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                        <div className="relative sm:w-64">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder={
                                    isAm
                                        ? "ሽንኩርት፣ ዘይት፣ ጤፍ ይፈልጉ..."
                                        : "Search onion, oil, teff..."
                                }
                                className="w-full rounded-full border border-border/80 bg-card py-2 pr-4 pl-10 text-xs sm:text-sm text-foreground outline-none transition-colors focus:border-orange-500"
                            />
                        </div>

                        <select
                            value={marketplaceId}
                            onChange={e => {
                                setMarketplaceId(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-full border border-border/80 bg-card px-4 py-2 text-xs sm:text-sm text-foreground outline-none transition-colors focus:border-orange-500"
                        >
                            <option value="ALL">
                                {isAm ? "ሁሉም ገበያዎች" : "All Markets"}
                            </option>
                            {marketplaces.map(mp => (
                                <option key={mp.id} value={mp.id}>
                                    {mp.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Single-row Scrollable Category Pills */}
                <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-border/50">
                    <button
                        type="button"
                        onClick={() => {
                            setCategoryId("ALL");
                            setPage(1);
                        }}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                            categoryId === "ALL"
                                ? "bg-orange-500 text-white shadow-xs"
                                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                    >
                        {isAm ? "ሁሉም" : "All"}
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                                setCategoryId(cat.id);
                                setPage(1);
                            }}
                            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                                categoryId === cat.id
                                    ? "bg-orange-500 text-white shadow-xs"
                                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="mt-8">
                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-80 animate-pulse rounded-2xl border border-border bg-card"
                                />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                            {isAm
                                ? "ከፍለጋዎ ጋር የሚዛመድ የገበያ እቃ አልተገኘም።"
                                : "No market items match your filters right now."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {items.map(item => (
                                <MarketItemCard
                                    key={item.id}
                                    item={item}
                                    onClick={() =>
                                        router.push(
                                            `/market-prices/${item.slug}`,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>

                {totalPages > 1 ? (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground disabled:opacity-50"
                        >
                            {isAm ? "ቀዳሚ" : "Previous"}
                        </button>
                        <span className="text-xs text-muted-foreground">
                            {isAm
                                ? `ገጽ ${page} ከ ${totalPages}`
                                : `Page ${page} of ${totalPages}`}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage(p => Math.min(totalPages, p + 1))
                            }
                            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground disabled:opacity-50"
                        >
                            {isAm ? "ቀጣይ" : "Next"}
                        </button>
                    </div>
                ) : null}
            </main>

            <LandingFooter />
        </div>
    );
}
