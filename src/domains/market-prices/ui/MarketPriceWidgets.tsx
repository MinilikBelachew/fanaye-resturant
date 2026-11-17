"use client";

import { useLocale } from "next-intl";
import type {
    MarketItem,
    MarketPriceHistoryEntry,
} from "@/context/services/marketPricesApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import {
    formatCalendarDateTime,
    useCalendarMode,
} from "@/hooks/useCalendarMode";
import {
    ArrowDownRight,
    ArrowUpRight,
    MapPin,
    Minus,
    ShoppingBasket,
    Store,
} from "lucide-react";

export function formatEtb(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "—";
    }
    return `${value.toLocaleString(undefined, {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    })} ETB`;
}

export function TrendBadge({
    changePercent,
    size = "sm",
}: {
    changePercent: number | null | undefined;
    size?: "sm" | "md";
}) {
    if (changePercent === null || changePercent === undefined) {
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 font-medium text-muted-foreground ${
                    size === "md"
                        ? "px-3 py-1 text-xs"
                        : "px-2 py-0.5 text-[11px]"
                }`}
            >
                <Minus className="h-3 w-3" />
                New
            </span>
        );
    }

    if (changePercent > 0) {
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 font-semibold text-rose-600 dark:text-rose-400 ${
                    size === "md"
                        ? "px-3 py-1 text-xs"
                        : "px-2 py-0.5 text-[11px]"
                }`}
            >
                <ArrowUpRight className="h-3.5 w-3.5" />+
                {changePercent.toFixed(1)}%
            </span>
        );
    }

    if (changePercent < 0) {
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400 ${
                    size === "md"
                        ? "px-3 py-1 text-xs"
                        : "px-2 py-0.5 text-[11px]"
                }`}
            >
                <ArrowDownRight className="h-3.5 w-3.5" />
                {changePercent.toFixed(1)}%
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 font-medium text-muted-foreground ${
                size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]"
            }`}
        >
            <Minus className="h-3 w-3" />
            0.0%
        </span>
    );
}

export function MarketItemCard({
    item,
    onClick,
}: {
    item: MarketItem;
    onClick?: () => void;
}) {
    const locale = useLocale();
    const isAm = locale === "am";
    const { calendarMode } = useCalendarMode();
    const latestUpdatedAt = item.marketPrices.reduce<string | null>(
        (latest, mp) =>
            !latest || mp.updatedAt > latest ? mp.updatedAt : latest,
        null,
    );
    const imgSrc = item.photoUrl
        ? (filePublicUrl(item.photoUrl) ?? item.photoUrl)
        : null;

    return (
        <div
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={e => {
                if (onClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition duration-200 ${
                onClick
                    ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary-border hover:shadow-md"
                    : ""
            }`}
        >
            <div className="relative h-40 w-full overflow-hidden bg-muted">
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-muted text-primary">
                        <ShoppingBasket className="h-10 w-10 opacity-70" />
                    </div>
                )}

                <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs backdrop-blur-xs">
                        {item.category.name}
                    </span>
                    <TrendBadge changePercent={item.changePercent} />
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary">
                            {item.name}
                        </h3>
                        <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {isAm
                                ? `በ ${item.unit.code}`
                                : `per ${item.unit.code}`}
                        </span>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
                        <div>
                            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {isAm ? "አማካይ ዋጋ" : "Avg Price"}
                            </div>
                            <div className="text-xl font-bold text-foreground">
                                {formatEtb(item.averagePrice)}
                            </div>
                        </div>
                        {item.minPrice !== null && item.maxPrice !== null ? (
                            <div className="text-right">
                                <div className="text-[11px] text-muted-foreground">
                                    {isAm ? "ክልል" : "Range"}
                                </div>
                                <div className="text-xs font-semibold text-foreground">
                                    {item.minPrice === item.maxPrice
                                        ? formatEtb(item.minPrice)
                                        : `${item.minPrice.toLocaleString()} – ${item.maxPrice.toLocaleString()} ${isAm ? "ብር" : "ETB"}`}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {item.marketPrices.length > 0 ? (
                        <div className="mt-3 space-y-1.5">
                            {item.marketPrices.slice(0, 3).map(mp => (
                                <div
                                    key={mp.id}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <span className="inline-flex items-center gap-1.5 truncate text-muted-foreground">
                                        <MapPin className="h-3 w-3 shrink-0 text-primary/70" />
                                        <span className="truncate">
                                            {mp.marketplaceName}
                                        </span>
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {formatEtb(mp.price)}
                                    </span>
                                </div>
                            ))}
                            {item.marketPrices.length > 3 ? (
                                <div className="text-[11px] font-medium text-primary">
                                    +{item.marketPrices.length - 3} more markets
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Store className="h-3.5 w-3.5" />
                            <span>No marketplace prices posted yet</span>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span className="truncate">
                        {latestUpdatedAt
                            ? formatCalendarDateTime(
                                  latestUpdatedAt,
                                  locale,
                                  calendarMode,
                                  true,
                              )
                            : `${item.marketplaceCount} ${isAm ? "ገበያ" : item.marketplaceCount === 1 ? "market" : "markets"}`}
                    </span>
                    <span className="shrink-0 font-semibold text-primary group-hover:underline">
                        {isAm ? "ዝርዝር ይመልከቱ →" : "View breakdown →"}
                    </span>
                </div>
            </div>
        </div>
    );
}

const CHART_COLORS = [
    "#ea580c",
    "#0284c7",
    "#16a34a",
    "#9333ea",
    "#d97706",
    "#e11d48",
];

export function MarketPriceTrendChart({
    history,
}: {
    history: MarketPriceHistoryEntry[];
}) {
    if (!history.length) {
        return (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                No historical trend points recorded yet.
            </div>
        );
    }

    const byMarket = new Map<string, MarketPriceHistoryEntry[]>();
    for (const row of history) {
        const list = byMarket.get(row.marketplaceName) ?? [];
        list.push(row);
        byMarket.set(row.marketplaceName, list);
    }

    const prices = history.map(h => h.price);
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    const pad = Math.max((maxVal - minVal) * 0.15, 2);
    const yMin = Math.max(0, minVal - pad);
    const yMax = maxVal + pad;
    const ySpan = Math.max(yMax - yMin, 1);

    const width = 640;
    const height = 220;
    const padX = 48;
    const padY = 20;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    const times = history.map(h => new Date(h.recordedAt).getTime());
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const tSpan = Math.max(maxT - minT, 1);

    const toX = (iso: string, idx: number, total: number) => {
        if (tSpan <= 1) {
            return (
                padX + (total <= 1 ? plotW / 2 : (idx / (total - 1)) * plotW)
            );
        }
        return padX + ((new Date(iso).getTime() - minT) / tSpan) * plotW;
    };

    const toY = (val: number) => padY + plotH - ((val - yMin) / ySpan) * plotH;

    const marketEntries = Array.from(byMarket.entries());

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                {marketEntries.map(([name], i) => (
                    <div
                        key={name}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground"
                    >
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                                backgroundColor:
                                    CHART_COLORS[i % CHART_COLORS.length],
                            }}
                        />
                        {name}
                    </div>
                ))}
            </div>

            <div className="w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-56 w-full min-w-[420px]"
                >
                    {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                        const y = padY + plotH * ratio;
                        const labelVal = yMax - ySpan * ratio;
                        return (
                            <g key={ratio}>
                                <line
                                    x1={padX}
                                    y1={y}
                                    x2={width - padX}
                                    y2={y}
                                    stroke="currentColor"
                                    strokeOpacity={0.1}
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={padX - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="currentColor"
                                    opacity={0.55}
                                >
                                    {Math.round(labelVal)}
                                </text>
                            </g>
                        );
                    })}

                    {marketEntries.map(([name, pts], i) => {
                        const color = CHART_COLORS[i % CHART_COLORS.length];
                        const coords = pts.map((p, idx) => ({
                            x: toX(p.recordedAt, idx, pts.length),
                            y: toY(p.price),
                            p,
                        }));
                        const pathD = coords
                            .map(
                                (c, idx) =>
                                    `${idx === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`,
                            )
                            .join(" ");

                        return (
                            <g key={name}>
                                {coords.length > 1 ? (
                                    <path
                                        d={pathD}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={2.5}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                ) : null}
                                {coords.map(c => (
                                    <circle
                                        key={c.p.id}
                                        cx={c.x}
                                        cy={c.y}
                                        r={4}
                                        fill={color}
                                        stroke="#ffffff"
                                        strokeWidth={1.5}
                                    >
                                        <title>
                                            {`${name}: ${c.p.price} ETB (${new Date(c.p.recordedAt).toLocaleDateString()})`}
                                        </title>
                                    </circle>
                                ))}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
