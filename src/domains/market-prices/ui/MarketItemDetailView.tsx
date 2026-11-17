"use client";

import type { MarketItemDetail } from "@/context/services/marketPricesApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    ShoppingBasket,
    Store,
    TrendingUp,
} from "lucide-react";
import {
    MarketPriceTrendChart,
    TrendBadge,
    formatEtb,
} from "./MarketPriceWidgets";

export default function MarketItemDetailView({
    item,
    onBack,
    backLabel = "Back to Market Prices",
}: {
    item: MarketItemDetail;
    onBack?: () => void;
    backLabel?: string;
}) {
    const imgSrc = item.photoUrl
        ? (filePublicUrl(item.photoUrl) ?? item.photoUrl)
        : null;

    const sortedPrices = [...item.marketPrices].sort(
        (a, b) => a.price - b.price,
    );
    const maxMarketPrice =
        sortedPrices.length > 0
            ? Math.max(...sortedPrices.map(p => p.price))
            : 1;
    const minMarketPrice =
        sortedPrices.length > 0
            ? Math.min(...sortedPrices.map(p => p.price))
            : 0;

    return (
        <div className="space-y-6">
            {onBack ? (
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {backLabel}
                </button>
            ) : null}

            {/* Hero Card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="relative h-56 w-full bg-muted md:h-auto md:min-h-[240px]">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={item.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-muted text-primary">
                                <ShoppingBasket className="h-14 w-14 opacity-70" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-between p-6 md:col-span-2">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                                    {item.category.name}
                                </span>
                                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                    Unit: {item.unit.label}
                                </span>
                                <TrendBadge
                                    changePercent={item.changePercent}
                                    size="md"
                                />
                            </div>

                            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                {item.name}
                            </h1>
                            {item.description ? (
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    {item.description}
                                </p>
                            ) : null}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Average Price
                                </div>
                                <div className="mt-1 text-xl font-bold text-foreground">
                                    {formatEtb(item.averagePrice)}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    per {item.unit.code}
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Price Range
                                </div>
                                <div className="mt-1 text-lg font-bold text-foreground">
                                    {item.minPrice !== null &&
                                    item.maxPrice !== null
                                        ? `${item.minPrice.toLocaleString()} – ${item.maxPrice.toLocaleString()}`
                                        : "—"}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    ETB across {item.marketplaceCount} markets
                                </div>
                            </div>

                            <div className="col-span-2 rounded-xl border border-border bg-muted/30 p-3.5 sm:col-span-1">
                                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Last Updated
                                </div>
                                <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    {new Date(
                                        item.lastUpdatedAt,
                                    ).toLocaleDateString()}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    {new Date(
                                        item.lastUpdatedAt,
                                    ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Marketplace Breakdown */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                            <Store className="h-5 w-5 text-primary" />
                            Prices by Marketplace (Gebeya)
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Sorted from lowest to highest price per{" "}
                            {item.unit.code}.
                        </p>
                    </div>
                </div>

                {sortedPrices.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        No marketplace prices have been posted for this item
                        yet.
                    </div>
                ) : (
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {sortedPrices.map((mp, idx) => {
                            const barPct =
                                maxMarketPrice > 0
                                    ? Math.max(
                                          18,
                                          Math.round(
                                              (mp.price / maxMarketPrice) * 100,
                                          ),
                                      )
                                    : 100;
                            const isLowest =
                                sortedPrices.length > 1 &&
                                mp.price === minMarketPrice;
                            const isHighest =
                                sortedPrices.length > 1 &&
                                mp.price === maxMarketPrice &&
                                maxMarketPrice !== minMarketPrice;

                            return (
                                <div
                                    key={mp.id}
                                    className={`rounded-xl border p-4 transition ${
                                        isLowest
                                            ? "border-emerald-500/40 bg-emerald-500/5"
                                            : "border-border bg-background"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                                                    {idx + 1}
                                                </span>
                                                <h3 className="font-semibold text-foreground">
                                                    {mp.marketplaceName}
                                                </h3>
                                                {isLowest ? (
                                                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                        Lowest
                                                    </span>
                                                ) : null}
                                                {isHighest ? (
                                                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                                        Highest
                                                    </span>
                                                ) : null}
                                            </div>
                                            {mp.area || mp.city ? (
                                                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    {[mp.area, mp.city]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="text-right">
                                            <div className="text-lg font-bold text-foreground">
                                                {formatEtb(mp.price)}
                                            </div>
                                            <div className="mt-0.5 flex items-center justify-end gap-1.5">
                                                {mp.previousPrice !== null ? (
                                                    <span className="text-[11px] text-muted-foreground line-through">
                                                        {formatEtb(
                                                            mp.previousPrice,
                                                        )}
                                                    </span>
                                                ) : null}
                                                <TrendBadge
                                                    changePercent={
                                                        mp.changePercent
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full transition-all ${
                                                isLowest
                                                    ? "bg-emerald-500"
                                                    : isHighest
                                                      ? "bg-rose-500"
                                                      : "bg-primary"
                                            }`}
                                            style={{ width: `${barPct}%` }}
                                        />
                                    </div>

                                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>
                                            Updated{" "}
                                            {new Date(
                                                mp.updatedAt,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Price Trend Chart & Recent History */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Price Trend
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Historical price movements across marketplaces.
                </p>

                <div className="mt-4">
                    <MarketPriceTrendChart history={item.history} />
                </div>

                {item.history.length > 0 ? (
                    <div className="mt-6 overflow-x-auto rounded-xl border border-border">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-2.5">Marketplace</th>
                                    <th className="px-4 py-2.5">Price</th>
                                    <th className="px-4 py-2.5">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {[...item.history]
                                    .reverse()
                                    .slice(0, 15)
                                    .map(h => (
                                        <tr
                                            key={h.id}
                                            className="hover:bg-muted/20"
                                        >
                                            <td className="px-4 py-2.5 font-medium text-foreground">
                                                {h.marketplaceName}
                                            </td>
                                            <td className="px-4 py-2.5 font-semibold text-foreground">
                                                {formatEtb(h.price)}
                                            </td>
                                            <td className="px-4 py-2.5 text-muted-foreground">
                                                {new Date(
                                                    h.recordedAt,
                                                ).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
