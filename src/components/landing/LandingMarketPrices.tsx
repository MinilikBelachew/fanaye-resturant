"use client";

import {
    useGetPublicMarketMetadataQuery,
    useListPublicMarketItemsQuery,
} from "@/context/services/marketPricesApi";
import { MarketItemCard } from "@/domains/market-prices/ui/MarketPriceWidgets";
import { Link, useRouter } from "@/i18n/navigation";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function LandingMarketPrices() {
    const router = useRouter();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");

    const { data: meta } = useGetPublicMarketMetadataQuery();
    const { data: itemsData, isLoading } = useListPublicMarketItemsQuery({
        limit: 6,
        featuredOnly: selectedCategoryId === "ALL" ? true : undefined,
        categoryId:
            selectedCategoryId === "ALL" ? undefined : selectedCategoryId,
    });

    const items = itemsData?.items ?? [];
    const categories = meta?.categories ?? [];

    if (!isLoading && items.length === 0 && selectedCategoryId === "ALL") {
        return null;
    }

    return (
        <section
            id="market-prices"
            className="relative py-16 sm:py-24 px-4 sm:px-6"
        >
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Live Gebeya Benchmark
                        </span>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Today&apos;s Restaurant Market Prices
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                            Compare daily ingredient prices across local
                            marketplaces, track averages and trends, and click
                            any item to inspect per-market breakdowns.
                        </p>
                    </div>

                    <Link
                        href="/market-prices"
                        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:border-primary-border hover:bg-muted"
                    >
                        <span>View all prices</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {categories.length > 0 ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCategoryId("ALL")}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                                selectedCategoryId === "ALL"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Featured
                        </button>
                        {categories.slice(0, 6).map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                                    selectedCategoryId === cat.id
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                ) : null}

                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading
                        ? Array.from({ length: 3 }).map((_, idx) => (
                              <div
                                  key={idx}
                                  className="h-80 animate-pulse rounded-2xl border border-border bg-card"
                              />
                          ))
                        : items.map(item => (
                              <MarketItemCard
                                  key={item.id}
                                  item={item}
                                  onClick={() =>
                                      router.push(`/market-prices/${item.slug}`)
                                  }
                              />
                          ))}
                </div>
            </div>
        </section>
    );
}
