"use client";

import {
    useGetPublicMarketMetadataQuery,
    useGetTenantMarketItemDetailQuery,
    useListTenantMarketItemsQuery,
} from "@/context/services/marketPricesApi";
import { Search } from "lucide-react";
import { useState } from "react";
import MarketItemDetailView from "./MarketItemDetailView";
import { MarketItemCard } from "./MarketPriceWidgets";

export default function TenantMarketPricesBoard() {
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("ALL");
    const [marketplaceId, setMarketplaceId] = useState("ALL");
    const [page, setPage] = useState(1);
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

    const { data: meta } = useGetPublicMarketMetadataQuery();
    const { data: itemsData, isLoading } = useListTenantMarketItemsQuery({
        page,
        limit: 18,
        search: search.trim() || undefined,
        categoryId: categoryId === "ALL" ? undefined : categoryId,
        marketplaceId: marketplaceId === "ALL" ? undefined : marketplaceId,
    });

    const { data: detailItem, isLoading: isLoadingDetail } =
        useGetTenantMarketItemDetailQuery(selectedSlug ?? "", {
            skip: !selectedSlug,
        });

    if (selectedSlug) {
        if (isLoadingDetail || !detailItem) {
            return (
                <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
            );
        }
        return (
            <MarketItemDetailView
                item={detailItem}
                onBack={() => setSelectedSlug(null)}
            />
        );
    }

    const items = itemsData?.items ?? [];
    const categories = meta?.categories ?? [];
    const marketplaces = meta?.marketplaces ?? [];
    const totalPages = itemsData?.totalPages ?? 1;

    return (
        <div className="space-y-5">
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search onion, tomato, oil, teff..."
                            className="w-full rounded-xl border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>
                    <select
                        value={marketplaceId}
                        onChange={e => {
                            setMarketplaceId(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                        <option value="ALL">All Marketplaces (Gebeya)</option>
                        {marketplaces.map(mp => (
                            <option key={mp.id} value={mp.id}>
                                {mp.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setCategoryId("ALL");
                            setPage(1);
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            categoryId === "ALL"
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        All Categories
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                                setCategoryId(cat.id);
                                setPage(1);
                            }}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                categoryId === cat.id
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

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
                <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                    No market items match your filters right now.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map(item => (
                        <MarketItemCard
                            key={item.id}
                            item={item}
                            onClick={() => setSelectedSlug(item.slug)}
                        />
                    ))}
                </div>
            )}

            {totalPages > 1 ? (
                <div className="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() =>
                            setPage(p => Math.min(totalPages, p + 1))
                        }
                        className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            ) : null}
        </div>
    );
}
