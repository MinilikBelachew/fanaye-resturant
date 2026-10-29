"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Award,
    CalendarRange,
    ChefHat,
    DollarSign,
    FileDown,
    Flame,
    Info,
    Loader2,
    Percent,
    Printer,
    RefreshCw,
    Save,
    Star,
    Target,
    TrendingDown,
    TrendingUp,
    Undo2,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    MenuEngineeringCostSpike,
    MenuEngineeringItem,
    MenuEngineeringQuadrant,
    MenuEngineeringResponse,
    MenuEngineeringVarianceItem,
    useGetMenuEngineeringQuery,
    useGetMenuEngineeringTargetsQuery,
    useUpdateMenuEngineeringTargetsMutation,
} from "@/context/services/menuEngineeringApi";
import { useListBranchesQuery } from "@/context/services/branchesApi";
import { useAdminMenuMetaQuery } from "@/context/services/menuApi";
import {
    filePublicUrl,
    IMAGE_KEY_TO_URL,
    imageForDish,
} from "@/domains/catalog/application/menuImages";

type PeriodPreset =
    | "today"
    | "7d"
    | "30d"
    | "90d"
    | "this_month"
    | "last_month"
    | "custom";

interface QuadrantMeta {
    label: string;
    short: string;
    emoji: string;
    action: string;
    hex: string;
    chip: string;
}

const QUADRANT_META: Record<MenuEngineeringQuadrant, QuadrantMeta> = {
    STAR: {
        label: "Star",
        short: "Stars",
        emoji: "⭐",
        action: "High volume, high margin. Feature it, protect quality and keep it prominent on the menu.",
        hex: "#f59e0b",
        chip: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
    },
    PLOWHORSE: {
        label: "Plowhorse",
        short: "Plowhorses",
        emoji: "🐴",
        action: "Sells well but thin margin. Trim portion cost, adjust the price, or upsell a side or drink.",
        hex: "#0284c7",
        chip: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300",
    },
    PUZZLE: {
        label: "Puzzle",
        short: "Puzzles",
        emoji: "🧩",
        action: "Great margin but low sales. Rename or re-describe it, reposition it on the menu, and train staff to recommend it.",
        hex: "#8b5cf6",
        chip: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300",
    },
    DOG: {
        label: "Dog",
        short: "Dogs",
        emoji: "🐕",
        action: "Low volume, low margin. Remove it or fully reinvent the dish.",
        hex: "#f43f5e",
        chip: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300",
    },
    UNCLASSIFIED: {
        label: "Unclassified",
        short: "Unclassified",
        emoji: "❔",
        action: "Add a recipe (and ingredient costs) so this item can be placed in the matrix.",
        hex: "#94a3b8",
        chip: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300",
    },
};

const COST_ISSUE_LABELS: Record<string, string> = {
    NO_RECIPE: "Needs recipe",
    UNCONVERTIBLE_UNIT: "Unit not convertible",
    MISSING_COST: "Missing ingredient cost",
};

const PRESETS: { id: PeriodPreset; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "7d", label: "7D" },
    { id: "30d", label: "30D" },
    { id: "90d", label: "90D" },
    { id: "this_month", label: "This month" },
    { id: "last_month", label: "Last month" },
    { id: "custom", label: "Custom" },
];

function toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function resolvePresetRange(preset: PeriodPreset): {
    from: string;
    to: string;
} {
    const now = new Date();
    const today = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const daysAgo = (days: number) =>
        new Date(today.getTime() - days * 86400000);

    switch (preset) {
        case "today":
            return { from: toDateInput(today), to: toDateInput(today) };
        case "7d":
            return { from: toDateInput(daysAgo(6)), to: toDateInput(today) };
        case "90d":
            return { from: toDateInput(daysAgo(89)), to: toDateInput(today) };
        case "this_month": {
            const first = new Date(
                Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
            );
            return { from: toDateInput(first), to: toDateInput(today) };
        }
        case "last_month": {
            const first = new Date(
                Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
            );
            const last = new Date(
                Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0),
            );
            return { from: toDateInput(first), to: toDateInput(last) };
        }
        case "30d":
        default:
            return { from: toDateInput(daysAgo(29)), to: toDateInput(today) };
    }
}

function formatMoney(value: number | null, currency: string): string {
    if (value == null) return "—";
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${value.toFixed(2)} ${currency}`;
    }
}

function formatPercent(value: number | null): string {
    return value == null ? "—" : `${value.toFixed(1)}%`;
}

function resolveDishImage(item: MenuEngineeringItem): string | undefined {
    return (
        filePublicUrl(item.imageUrl) ??
        (item.imageKey ? IMAGE_KEY_TO_URL[item.imageKey] : undefined) ??
        imageForDish(item.name)
    );
}

function TrendBadge({ value }: { value: number | null }) {
    if (value == null) {
        return <span className="text-[10px] text-muted-foreground">—</span>;
    }
    const up = value >= 0;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums",
                up
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
            )}
        >
            {up ? (
                <ArrowUpRight className="size-3" />
            ) : (
                <ArrowDownRight className="size-3" />
            )}
            {Math.abs(value).toFixed(0)}%
        </span>
    );
}

function Sparkline({ series }: { series: number[] }) {
    if (series.length < 2) {
        return <span className="text-[10px] text-muted-foreground">—</span>;
    }
    const w = 60;
    const h = 18;
    const max = Math.max(...series, 1);
    const step = w / (series.length - 1);
    const points = series
        .map((value, index) => `${index * step},${h - (value / max) * h}`)
        .join(" ");
    const rising = series[series.length - 1] >= series[0];
    return (
        <svg
            viewBox={`0 0 ${w} ${h}`}
            className="h-4 w-[60px]"
            preserveAspectRatio="none"
            role="img"
            aria-label="Sales trend"
        >
            <polyline
                points={points}
                fill="none"
                strokeWidth={1.25}
                className={cn(
                    rising ? "stroke-emerald-500/80" : "stroke-rose-500/80",
                )}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

function MomentumBadge({
    momentum,
}: {
    momentum: "RISING" | "FALLING" | "FLAT";
}) {
    const map = {
        RISING: {
            label: "Rising",
            cls: "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
            icon: <ArrowUpRight className="size-2.5" />,
        },
        FALLING: {
            label: "Falling",
            cls: "border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-300",
            icon: <ArrowDownRight className="size-2.5" />,
        },
        FLAT: {
            label: "Flat",
            cls: "border-border/60 bg-muted/30 text-muted-foreground",
            icon: null,
        },
    } as const;
    const entry = map[momentum];
    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-medium",
                entry.cls,
            )}
        >
            {entry.icon}
            {entry.label}
        </span>
    );
}

function csvCell(value: unknown): string {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv(data: MenuEngineeringResponse) {
    const header = [
        "Dish",
        "Category",
        "Quadrant",
        "Sold",
        "Menu mix %",
        "Price",
        "Plate cost",
        "Food cost %",
        "Contribution",
        "Total contribution",
        "Suggested price",
        "Price gap %",
        "Units last period",
        "Volume trend %",
        "Units last year",
        "YoY trend %",
        "Momentum",
        "Variance-adjusted cost",
    ];
    const rows = data.items.map(item => [
        item.name,
        item.categoryName ?? "Uncategorized",
        item.quadrant,
        item.quantitySold,
        item.menuMixPercent,
        item.price,
        item.plateCost ?? "",
        item.foodCostPercent ?? "",
        item.contributionMargin ?? "",
        item.totalContribution ?? "",
        item.suggestedPrice ?? "",
        item.priceGapPercent ?? "",
        item.previousQuantitySold,
        item.quantityTrendPercent ?? "",
        item.previousYearQuantitySold,
        item.yearOverYearTrendPercent ?? "",
        item.momentum,
        item.usageAdjustedPlateCost ?? "",
    ]);
    const csv = [header, ...rows]
        .map(row => row.map(csvCell).join(","))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `menu-engineering-${data.meta.from}-to-${data.meta.to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Option 1: Top-bar Pricing Targets Popover (Clean, Minimal, No Shadows)
// ---------------------------------------------------------------------------

function TargetsPopover({
    fallbackTarget,
    fallbackAlert,
}: {
    fallbackTarget: number;
    fallbackAlert: number;
}) {
    const [open, setOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    const { data } = useGetMenuEngineeringTargetsQuery();
    const [updateTargets, { isLoading: saving }] =
        useUpdateMenuEngineeringTargetsMutation();

    const [target, setTarget] = useState<number | null>(null);
    const [alert, setAlert] = useState<number | null>(null);
    const [saved, setSaved] = useState(false);

    const targetValue = target ?? data?.targetFoodCostPercent ?? fallbackTarget;
    const alertValue = alert ?? data?.foodCostAlertPercent ?? fallbackAlert;
    const dirty =
        targetValue !== (data?.targetFoodCostPercent ?? fallbackTarget) ||
        alertValue !== (data?.foodCostAlertPercent ?? fallbackAlert);

    async function handleSave() {
        await updateTargets({
            targetFoodCostPercent: targetValue,
            foodCostAlertPercent: alertValue,
        }).unwrap();
        setTarget(null);
        setAlert(null);
        setSaved(true);
        window.setTimeout(() => {
            setSaved(false);
            setOpen(false);
        }, 800);
    }

    // Click outside to dismiss
    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: MouseEvent) {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open]);

    return (
        <div className="relative" ref={popoverRef}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(prev => !prev)}
                className={cn(
                    "h-8 gap-1.5 border-border/60 text-xs font-medium transition-colors",
                    open && "bg-muted text-foreground border-border",
                )}
            >
                <Target className="size-3.5 text-muted-foreground" />
                <span>
                    Targets:{" "}
                    <span className="font-mono text-foreground font-medium">
                        {targetValue}%
                    </span>
                    <span className="text-muted-foreground/60"> / </span>
                    <span className="font-mono text-foreground font-medium">
                        {alertValue}%
                    </span>
                </span>
            </Button>

            {open ? (
                <div className="absolute right-0 top-10 z-40 w-80 rounded-xl border border-border/80 bg-background p-4 animate-in fade-in-50 zoom-in-95">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <Target className="size-3.5 text-muted-foreground" />
                            <span>Pricing Targets &amp; Alerts</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>

                    <div className="mt-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-xs text-muted-foreground">
                                Target food cost
                            </label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    step={0.5}
                                    value={targetValue}
                                    onChange={e =>
                                        setTarget(
                                            Math.max(
                                                1,
                                                Math.min(
                                                    100,
                                                    Number(e.target.value) || 0,
                                                ),
                                            ),
                                        )
                                    }
                                    className="h-8 w-18 rounded-lg border border-border/70 bg-background px-2 text-right text-xs font-mono font-medium text-foreground focus:border-primary focus:outline-none"
                                />
                                <span className="text-xs text-muted-foreground">
                                    %
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <label className="text-xs text-muted-foreground">
                                Alert threshold
                            </label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    step={0.5}
                                    value={alertValue}
                                    onChange={e =>
                                        setAlert(
                                            Math.max(
                                                1,
                                                Math.min(
                                                    100,
                                                    Number(e.target.value) || 0,
                                                ),
                                            ),
                                        )
                                    }
                                    className="h-8 w-18 rounded-lg border border-border/70 bg-background px-2 text-right text-xs font-mono font-medium text-foreground focus:border-primary focus:outline-none"
                                />
                                <span className="text-xs text-muted-foreground">
                                    %
                                </span>
                            </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                            Dishes above {alertValue}% food cost are
                            highlighted. Suggested price is calculated as plate
                            cost ÷ target.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="h-7.5 px-3 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                disabled={!dirty || saving}
                                onClick={() => void handleSave()}
                                className="h-7.5 gap-1.5 px-3 text-xs font-medium"
                            >
                                {saving ? (
                                    <Loader2 className="size-3 animate-spin" />
                                ) : (
                                    <Save className="size-3" />
                                )}
                                {saved ? "Saved" : "Save"}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Attention Card (Clean & Minimal)
// ---------------------------------------------------------------------------

function AttentionCard({
    title,
    description,
    icon,
    items,
    onSelect,
    badge,
    badgeCls,
    isCostSpike = false,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    items: { menuItemId: string; name: string }[];
    onSelect: (id: string) => void;
    badge: string;
    badgeCls: string;
    isCostSpike?: boolean;
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-card/30 p-3.5 transition-colors hover:border-border">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">{icon}</div>
                    <h3 className="text-xs font-medium text-foreground">
                        {title}
                    </h3>
                </div>
                <span
                    className={cn(
                        "rounded-full border px-2 py-0.5 text-[9px] font-medium tracking-wide",
                        badgeCls,
                    )}
                >
                    {badge}
                </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                {description}
            </p>
            <div className="mt-3 space-y-1">
                {items.length === 0 ? (
                    <p className="text-[11px] italic text-muted-foreground">
                        No items
                    </p>
                ) : (
                    items.map(item => (
                        <button
                            key={item.menuItemId}
                            type="button"
                            onClick={() =>
                                !isCostSpike && onSelect(item.menuItemId)
                            }
                            className={cn(
                                "flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs transition-colors",
                                isCostSpike
                                    ? "cursor-default text-muted-foreground"
                                    : "text-foreground hover:bg-muted/40",
                            )}
                        >
                            <span className="truncate">{item.name}</span>
                            {!isCostSpike && (
                                <ArrowUpRight className="size-3 shrink-0 text-muted-foreground opacity-60" />
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Cost intelligence panel
// ---------------------------------------------------------------------------

function CostIntelligencePanel({
    spikes,
    varianceItems,
    currency,
    onSelect,
}: {
    spikes: MenuEngineeringCostSpike[];
    varianceItems: MenuEngineeringVarianceItem[];
    currency: string;
    onSelect: (id: string) => void;
}) {
    if (spikes.length === 0 && varianceItems.length === 0) {
        return null;
    }
    return (
        <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Flame className="size-3.5 text-rose-500" />
                    <span>Ingredient cost spikes</span>
                </div>
                <div className="mt-3 space-y-2">
                    {spikes.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                            No recent cost spikes.
                        </p>
                    ) : (
                        spikes.map(spike => (
                            <div
                                key={spike.ingredientId}
                                className="flex items-center justify-between gap-2 text-xs"
                            >
                                <span className="min-w-0 truncate text-foreground">
                                    {spike.ingredientName}
                                </span>
                                <span className="shrink-0 text-right tabular-nums text-xs">
                                    <span className="text-muted-foreground">
                                        {formatMoney(
                                            spike.previousCost,
                                            currency,
                                        )}
                                        {" → "}
                                    </span>
                                    {formatMoney(spike.latestCost, currency)}
                                    <span className="ml-1.5 inline-flex items-center gap-0.5 font-medium text-rose-600 dark:text-rose-400">
                                        +{spike.changePercent.toFixed(0)}%
                                    </span>
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <AlertTriangle className="size-3.5 text-amber-500" />
                    <span>True cost vs standard</span>
                </div>
                <div className="mt-3 space-y-2">
                    {varianceItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                            Waste and shrinkage are within normal range.
                        </p>
                    ) : (
                        varianceItems.map(row => (
                            <button
                                key={row.menuItemId}
                                type="button"
                                onClick={() => onSelect(row.menuItemId)}
                                className="flex w-full items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-left text-xs transition-colors hover:bg-muted/40"
                            >
                                <span className="min-w-0 truncate text-foreground">
                                    {row.name}
                                </span>
                                <span className="shrink-0 tabular-nums text-xs">
                                    <span className="text-muted-foreground">
                                        {formatMoney(row.plateCost, currency)}
                                        {" → "}
                                    </span>
                                    {formatMoney(
                                        row.adjustedPlateCost,
                                        currency,
                                    )}
                                    <span className="ml-1.5 font-medium text-amber-600 dark:text-amber-400">
                                        +{row.deltaPercent.toFixed(0)}%
                                    </span>
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Matrix scatter (Modern, Food Images in Bubbles, Minimal, No Shadows)
// ---------------------------------------------------------------------------

const MATRIX_W = 760;
const MATRIX_H = 430;
const PAD = { left: 56, right: 28, top: 32, bottom: 44 };
const INNER_W = MATRIX_W - PAD.left - PAD.right;
const INNER_H = MATRIX_H - PAD.top - PAD.bottom;

function MatrixScatter({
    data,
    onSelect,
    currency,
}: {
    data: MenuEngineeringResponse;
    onSelect: (id: string) => void;
    currency: string;
}) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const plotted = useMemo(() => {
        return data.items.filter(
            item =>
                item.costComplete &&
                item.contributionMargin != null &&
                item.quantitySold > 0,
        );
    }, [data.items]);

    const hoveredItem = useMemo(() => {
        if (!hoveredId) return null;
        return plotted.find(i => i.menuItemId === hoveredId) ?? null;
    }, [hoveredId, plotted]);

    if (plotted.length === 0) {
        return (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-card/20 text-center">
                <ChefHat className="size-6 text-muted-foreground/40" />
                <p className="text-xs font-medium text-foreground">
                    Nothing to plot yet
                </p>
                <p className="max-w-sm text-[11px] text-muted-foreground">
                    Add recipes to your menu items and record sales to see the
                    menu engineering matrix.
                </p>
            </div>
        );
    }

    const maxMix = Math.max(...plotted.map(i => i.menuMixPercent));
    const xMax = Math.max(maxMix, data.meta.expectedPopularityPercent * 1.6, 1);

    const margins = plotted.map(i => i.contributionMargin as number);
    const rawMin = Math.min(0, ...margins);
    const rawMax = Math.max(...margins, data.meta.averageContributionMargin);
    const span = rawMax - rawMin || 1;
    const yMin = rawMin - span * 0.08;
    const yMax = rawMax + span * 0.08;

    const maxContribution = Math.max(
        1,
        ...plotted.map(i => Math.abs(i.totalContribution ?? 0)),
    );

    const xScale = (v: number) => PAD.left + (v / xMax) * INNER_W;
    const yScale = (v: number) =>
        PAD.top + INNER_H - ((v - yMin) / (yMax - yMin)) * INNER_H;

    const avgY = yScale(data.meta.averageContributionMargin);
    const popX = xScale(data.meta.expectedPopularityPercent);

    const yTicks = 4;
    const ticks = Array.from(
        { length: yTicks + 1 },
        (_, index) => yMin + ((yMax - yMin) * index) / yTicks,
    );

    return (
        <div className="relative rounded-xl border border-border/60 bg-card/30 p-3.5">
            {/* Header / Subtitle */}
            <div className="flex items-center justify-between pb-2 px-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                        Menu Engineering Matrix
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        · Click dish bubble to view recipe details
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-amber-500" />{" "}
                        Stars
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-sky-500" />{" "}
                        Plowhorses
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-violet-500" />{" "}
                        Puzzles
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-rose-500" />{" "}
                        Dogs
                    </span>
                </div>
            </div>

            <div className="relative">
                <svg
                    viewBox={`0 0 ${MATRIX_W} ${MATRIX_H}`}
                    className="h-auto w-full select-none"
                    role="img"
                    aria-label="Menu engineering matrix"
                >
                    <defs>
                        {plotted.map(item => {
                            const img = resolveDishImage(item);
                            if (!img) return null;
                            const radius =
                                8 +
                                18 *
                                    Math.sqrt(
                                        Math.abs(item.totalContribution ?? 0) /
                                            maxContribution,
                                    );
                            const cx = xScale(item.menuMixPercent);
                            const cy = yScale(
                                item.contributionMargin as number,
                            );
                            return (
                                <clipPath
                                    key={`clip-${item.menuItemId}`}
                                    id={`clip-${item.menuItemId}`}
                                >
                                    <circle cx={cx} cy={cy} r={radius} />
                                </clipPath>
                            );
                        })}
                    </defs>

                    {/* Quadrant tints (subtle & elegant) */}
                    <rect
                        x={PAD.left}
                        y={PAD.top}
                        width={Math.max(0, popX - PAD.left)}
                        height={Math.max(0, avgY - PAD.top)}
                        fill={QUADRANT_META.PUZZLE.hex}
                        opacity={0.03}
                    />
                    <rect
                        x={popX}
                        y={PAD.top}
                        width={Math.max(0, PAD.left + INNER_W - popX)}
                        height={Math.max(0, avgY - PAD.top)}
                        fill={QUADRANT_META.STAR.hex}
                        opacity={0.04}
                    />
                    <rect
                        x={PAD.left}
                        y={avgY}
                        width={Math.max(0, popX - PAD.left)}
                        height={Math.max(0, PAD.top + INNER_H - avgY)}
                        fill={QUADRANT_META.DOG.hex}
                        opacity={0.03}
                    />
                    <rect
                        x={popX}
                        y={avgY}
                        width={Math.max(0, PAD.left + INNER_W - popX)}
                        height={Math.max(0, PAD.top + INNER_H - avgY)}
                        fill={QUADRANT_META.PLOWHORSE.hex}
                        opacity={0.035}
                    />

                    {/* Axis frame */}
                    <rect
                        x={PAD.left}
                        y={PAD.top}
                        width={INNER_W}
                        height={INNER_H}
                        fill="none"
                        stroke="currentColor"
                        className="stroke-border/40"
                        strokeWidth={0.75}
                    />

                    {/* Y ticks & grid */}
                    {ticks.map((tick, index) => (
                        <g key={index}>
                            <line
                                x1={PAD.left}
                                x2={PAD.left + INNER_W}
                                y1={yScale(tick)}
                                y2={yScale(tick)}
                                stroke="currentColor"
                                className="stroke-border/25"
                                strokeDasharray="2 4"
                                strokeWidth={0.75}
                            />
                            <text
                                x={PAD.left - 6}
                                y={yScale(tick) + 3}
                                textAnchor="end"
                                className="fill-muted-foreground text-[9px] font-mono"
                            >
                                {tick.toFixed(0)}
                            </text>
                        </g>
                    ))}

                    {/* Threshold dividers */}
                    <line
                        x1={popX}
                        x2={popX}
                        y1={PAD.top}
                        y2={PAD.top + INNER_H}
                        stroke="currentColor"
                        className="stroke-border/70"
                        strokeDasharray="4 3"
                        strokeWidth={1}
                    />
                    <line
                        x1={PAD.left}
                        x2={PAD.left + INNER_W}
                        y1={avgY}
                        y2={avgY}
                        stroke="currentColor"
                        className="stroke-border/70"
                        strokeDasharray="4 3"
                        strokeWidth={1}
                    />

                    {/* Threshold labels */}
                    <text
                        x={popX + 4}
                        y={PAD.top + 10}
                        className="fill-muted-foreground text-[9px]"
                    >
                        Fair share{" "}
                        {data.meta.expectedPopularityPercent.toFixed(1)}%
                    </text>
                    <text
                        x={PAD.left + 6}
                        y={avgY - 4}
                        className="fill-muted-foreground text-[9px]"
                    >
                        Avg margin{" "}
                        {formatMoney(
                            data.meta.averageContributionMargin,
                            currency,
                        )}
                    </text>

                    {/* Quadrant corner labels (Clean & Elegant) */}
                    <text
                        x={PAD.left + INNER_W - 8}
                        y={PAD.top + 14}
                        textAnchor="end"
                        className="fill-amber-600/90 dark:fill-amber-400/90 text-[10px] font-medium"
                    >
                        ⭐ Stars
                    </text>
                    <text
                        x={PAD.left + INNER_W - 8}
                        y={PAD.top + INNER_H - 8}
                        textAnchor="end"
                        className="fill-sky-600/90 dark:fill-sky-400/90 text-[10px] font-medium"
                    >
                        🐴 Plowhorses
                    </text>
                    <text
                        x={PAD.left + 8}
                        y={PAD.top + 14}
                        className="fill-violet-600/90 dark:fill-violet-400/90 text-[10px] font-medium"
                    >
                        🧩 Puzzles
                    </text>
                    <text
                        x={PAD.left + 8}
                        y={PAD.top + INNER_H - 8}
                        className="fill-rose-600/90 dark:fill-rose-400/90 text-[10px] font-medium"
                    >
                        🐕 Dogs
                    </text>

                    {/* Axis titles */}
                    <text
                        x={PAD.left + INNER_W / 2}
                        y={MATRIX_H - 12}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[10px]"
                    >
                        Popularity — menu mix %
                    </text>
                    <text
                        x={14}
                        y={PAD.top + INNER_H / 2}
                        textAnchor="middle"
                        transform={`rotate(-90 14 ${PAD.top + INNER_H / 2})`}
                        className="fill-muted-foreground text-[10px]"
                    >
                        Contribution margin
                    </text>

                    {/* Bubbles with Food Image inside! */}
                    {plotted.map(item => {
                        const cx = xScale(item.menuMixPercent);
                        const cy = yScale(item.contributionMargin as number);
                        const radius =
                            8 +
                            18 *
                                Math.sqrt(
                                    Math.abs(item.totalContribution ?? 0) /
                                        maxContribution,
                                );
                        const meta = QUADRANT_META[item.quadrant];
                        const img = resolveDishImage(item);
                        const isHovered = hoveredId === item.menuItemId;

                        return (
                            <g
                                key={item.menuItemId}
                                className="cursor-pointer transition-all duration-150"
                                onClick={() => onSelect(item.menuItemId)}
                                onMouseEnter={() =>
                                    setHoveredId(item.menuItemId)
                                }
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {/* Base background fill */}
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={radius}
                                    fill={meta.hex}
                                    fillOpacity={img ? 0.15 : 0.4}
                                />

                                {/* Render Food Image inside the circle if available */}
                                {img ? (
                                    <image
                                        href={img}
                                        x={cx - radius}
                                        y={cy - radius}
                                        width={radius * 2}
                                        height={radius * 2}
                                        clipPath={`url(#clip-${item.menuItemId})`}
                                        preserveAspectRatio="xMidYMid slice"
                                        className="transition-opacity hover:opacity-90"
                                    />
                                ) : (
                                    /* Monogram initial if no image */
                                    <text
                                        x={cx}
                                        y={cy + 3}
                                        textAnchor="middle"
                                        className="fill-foreground text-[9px] font-mono font-medium pointer-events-none"
                                    >
                                        {item.name.slice(0, 2).toUpperCase()}
                                    </text>
                                )}

                                {/* Border stroke in quadrant color */}
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={radius}
                                    fill="none"
                                    stroke={meta.hex}
                                    strokeWidth={isHovered ? 2.5 : 1.5}
                                    className="transition-all"
                                />

                                {/* Mini name pill on hover */}
                                {isHovered ? (
                                    <g pointerEvents="none">
                                        <rect
                                            x={cx - 40}
                                            y={cy - radius - 18}
                                            width={80}
                                            height={16}
                                            rx={4}
                                            fill="currentColor"
                                            className="fill-background/95 stroke-border"
                                            strokeWidth={0.5}
                                        />
                                        <text
                                            x={cx}
                                            y={cy - radius - 7}
                                            textAnchor="middle"
                                            className="fill-foreground text-[8px] font-medium"
                                        >
                                            {item.name.length > 14
                                                ? `${item.name.slice(0, 13)}…`
                                                : item.name}
                                        </text>
                                    </g>
                                ) : null}
                            </g>
                        );
                    })}
                </svg>

                {/* Floating summary card when hovering a dish */}
                {hoveredItem ? (
                    <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2.5 rounded-lg border border-border/80 bg-background/95 px-3 py-2 text-xs">
                        {resolveDishImage(hoveredItem) ? (
                            <img
                                src={resolveDishImage(hoveredItem)}
                                alt={hoveredItem.name}
                                className="size-8 rounded-md object-cover border border-border/40"
                            />
                        ) : null}
                        <div>
                            <p className="font-medium text-foreground leading-tight">
                                {hoveredItem.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {hoveredItem.quantitySold} sold ·{" "}
                                {formatPercent(hoveredItem.menuMixPercent)} mix
                                · Margin{" "}
                                {formatMoney(
                                    hoveredItem.contributionMargin,
                                    currency,
                                )}
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Board Component
// ---------------------------------------------------------------------------

type SortKey =
    | "name"
    | "quantitySold"
    | "menuMixPercent"
    | "price"
    | "plateCost"
    | "foodCostPercent"
    | "contributionMargin"
    | "totalContribution";

export default function MenuEngineeringBoard() {
    const router = useRouter();
    const pathname = usePathname();
    const [preset, setPreset] = useState<PeriodPreset>("30d");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [branchId, setBranchId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [minQty, setMinQty] = useState(0);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>("totalContribution");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    function handleSelect(id: string) {
        router.push(`${pathname}/${id}`);
    }

    const range = useMemo(() => {
        if (preset === "custom") {
            return {
                from: customFrom || undefined,
                to: customTo || undefined,
            };
        }
        return resolvePresetRange(preset);
    }, [preset, customFrom, customTo]);

    const queryArgs = useMemo(
        () => ({
            from: range.from,
            to: range.to,
            branchId: branchId || undefined,
            categoryId: categoryId || undefined,
            minQty: minQty > 0 ? minQty : undefined,
            includeInactive,
        }),
        [range, branchId, categoryId, minQty, includeInactive],
    );

    const { data, isLoading, isFetching, isError, refetch } =
        useGetMenuEngineeringQuery(queryArgs);
    const { data: branchesData } = useListBranchesQuery();
    const { data: menuMeta } = useAdminMenuMetaQuery();

    const currency = data?.meta.currencyCode ?? "ETB";
    const items = useMemo(() => data?.items ?? [], [data?.items]);
    const meta = data?.meta;
    const summary = data?.summary;

    const sortedItems = useMemo(() => {
        const list = [...items];
        list.sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            if (sortKey === "name") {
                return a.name.localeCompare(b.name) * dir;
            }
            const av = (a[sortKey] ?? -Infinity) as number;
            const bv = (b[sortKey] ?? -Infinity) as number;
            return (av - bv) * dir;
        });
        return list;
    }, [items, sortKey, sortDir]);

    const costIssues = items.filter(item => !item.costComplete);
    const uncostedCount = costIssues.length;

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir(dir => (dir === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir(key === "name" ? "asc" : "desc");
        }
    }

    const shortPeriod =
        meta != null &&
        (new Date(meta.to).getTime() - new Date(meta.from).getTime()) /
            86400000 <
            6;

    const avgFoodCost =
        meta && meta.totalRevenue > 0
            ? (items.reduce(
                  (sum, item) =>
                      sum + (item.plateCost ?? 0) * item.quantitySold,
                  0,
              ) /
                  meta.totalRevenue) *
              100
            : null;

    return (
        <div className="space-y-4">
            {/* Filter bar (Minimal & Clean, with Option 1 Targets Popover) */}
            <div className="space-y-2.5 rounded-xl border border-border/60 bg-card/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Period segmented tabs */}
                    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/40 p-1">
                        {PRESETS.map(option => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setPreset(option.id)}
                                className={cn(
                                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                                    preset === option.id
                                        ? "bg-background text-foreground border border-border/40"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Option 1: Targets Popover placed cleanly in the top bar */}
                        <TargetsPopover
                            fallbackTarget={
                                meta?.targets.targetFoodCostPercent ?? 30
                            }
                            fallbackAlert={
                                meta?.targets.foodCostAlertPercent ?? 35
                            }
                        />

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!data || items.length === 0}
                            onClick={() => (data ? exportCsv(data) : undefined)}
                            className="h-8 gap-1.5 border-border/60 text-xs font-medium"
                        >
                            <FileDown className="size-3.5" />
                            CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!data || items.length === 0}
                            onClick={() => window.print()}
                            className="h-8 gap-1.5 border-border/60 text-xs font-medium print:hidden"
                        >
                            <Printer className="size-3.5" />
                            Print
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void refetch()}
                            className="h-8 gap-1.5 border-border/60 text-xs font-medium"
                        >
                            <RefreshCw
                                className={cn(
                                    "size-3.5",
                                    isFetching && "animate-spin",
                                )}
                            />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/30">
                    {preset === "custom" ? (
                        <div className="flex items-center gap-1.5">
                            <CalendarRange className="size-3.5 text-muted-foreground" />
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">
                                to
                            </span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => setCustomTo(e.target.value)}
                                className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
                            />
                        </div>
                    ) : null}

                    <select
                        value={branchId}
                        onChange={e => setBranchId(e.target.value)}
                        className="h-8 rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none"
                    >
                        <option value="">All branches</option>
                        {(branchesData?.data ?? []).map(branch => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        className="h-8 rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none"
                    >
                        <option value="">All categories</option>
                        {(menuMeta?.data.categories ?? []).map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Min sold:
                        <input
                            type="number"
                            min={0}
                            value={minQty}
                            onChange={e =>
                                setMinQty(
                                    Math.max(0, Number(e.target.value) || 0),
                                )
                            }
                            className="h-8 w-14 rounded-lg border border-border/60 bg-background px-2 text-xs font-mono"
                        />
                    </label>

                    <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeInactive}
                            onChange={e => setIncludeInactive(e.target.checked)}
                            className="size-3.5 rounded border-border"
                        />
                        Include inactive
                    </label>
                </div>

                {shortPeriod ? (
                    <p className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                        <Info className="size-3" />
                        Short period — menu engineering results may be
                        unreliable. Prefer 30 days or more.
                    </p>
                ) : null}
            </div>

            {/* KPI row (Clean & Minimal, 0 shadows) */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Revenue
                    </p>
                    <p className="mt-1 text-xl font-medium tracking-tight tabular-nums text-foreground">
                        {formatMoney(meta?.totalRevenue ?? 0, currency)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        {meta
                            ? `${meta.totalQuantitySold} units · ${meta.itemCount} items`
                            : "—"}
                    </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-muted-foreground">
                            Avg food cost
                        </p>
                        <Percent className="size-3 text-muted-foreground" />
                    </div>
                    <p className="mt-1 text-xl font-medium tracking-tight tabular-nums text-foreground">
                        {formatPercent(avgFoodCost)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        {meta && meta.foodCostAlertCount > 0
                            ? `${meta.foodCostAlertCount} over target`
                            : "Plate cost ÷ revenue"}
                    </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-muted-foreground">
                            Total contribution
                        </p>
                        <DollarSign className="size-3 text-muted-foreground" />
                    </div>
                    <p className="mt-1 text-xl font-medium tracking-tight tabular-nums text-foreground">
                        {formatMoney(meta?.totalContribution ?? 0, currency)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Margin × units sold
                    </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-muted-foreground">
                            Recipe coverage
                        </p>
                        <Award className="size-3 text-muted-foreground" />
                    </div>
                    <p className="mt-1 text-xl font-medium tracking-tight tabular-nums text-foreground">
                        {meta
                            ? `${meta.costedItemCount}/${meta.itemCount}`
                            : "—"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        {meta
                            ? `${meta.recipeCoveragePercent.toFixed(0)}% costed`
                            : "—"}
                    </p>
                </div>
            </div>

            {/* Waste & shrinkage variance (if present, shown cleanly without the old targets card taking space) */}
            {meta && meta.usageVariancePercent > 0 ? (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                        <div>
                            <span className="font-medium text-foreground">
                                Waste &amp; shrinkage variance:{" "}
                            </span>
                            <span className="text-muted-foreground">
                                Extra{" "}
                                {formatMoney(meta.usageVarianceCost, currency)}{" "}
                                of ingredient cost recorded over this period.
                            </span>
                        </div>
                    </div>
                    <span className="font-mono text-sm font-medium text-amber-700 dark:text-amber-400">
                        +{formatPercent(meta.usageVariancePercent)}
                    </span>
                </div>
            ) : null}

            {/* Quadrant summary strip */}
            {summary ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["STAR", "PLOWHORSE", "PUZZLE", "DOG"] as const).map(
                        quadrant => {
                            const qm = QUADRANT_META[quadrant];
                            const share =
                                meta && meta.totalRevenue > 0
                                    ? items
                                          .filter(i => i.quadrant === quadrant)
                                          .reduce(
                                              (sum, i) =>
                                                  sum +
                                                  (i.totalContribution ?? 0),
                                              0,
                                          )
                                    : 0;
                            return (
                                <div
                                    key={quadrant}
                                    className="rounded-xl border border-border/60 bg-card/30 p-3"
                                >
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                        <span
                                            className="size-2 rounded-full shrink-0"
                                            style={{ backgroundColor: qm.hex }}
                                        />
                                        <span>{qm.short}</span>
                                    </div>
                                    <p className="mt-1.5 text-lg font-medium tabular-nums text-foreground">
                                        {summary.quadrantCounts[quadrant]}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground tabular-nums">
                                        {formatMoney(share, currency)}
                                    </p>
                                </div>
                            );
                        },
                    )}
                </div>
            ) : null}

            {/* Data quality strip */}
            {uncostedCount > 0 ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                        <Info className="size-3.5" />
                        {uncostedCount} item
                        {uncostedCount === 1 ? "" : "s"} cannot be classified
                        yet
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Missing complete recipes or ingredient costs. Add
                        recipes in the menu builder.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                        {costIssues.slice(0, 8).map(item => (
                            <button
                                key={item.menuItemId}
                                type="button"
                                onClick={() => handleSelect(item.menuItemId)}
                                className="rounded-md border border-border/60 bg-background px-2 py-0.5 text-[10px] text-foreground transition-colors hover:bg-muted/40"
                            >
                                {item.name}
                                <span className="ml-1 text-muted-foreground">
                                    (
                                    {item.costIssues
                                        .map(
                                            issue =>
                                                COST_ISSUE_LABELS[issue] ??
                                                issue,
                                        )
                                        .join(", ")}
                                    )
                                </span>
                            </button>
                        ))}
                        {uncostedCount > 8 ? (
                            <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                +{uncostedCount - 8} more
                            </span>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/20 py-16 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Analysing menu performance…
                </div>
            ) : isError ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 py-12 text-center text-xs text-rose-600 dark:text-rose-400">
                    Could not load menu engineering data. Try again.
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-card/20 py-12 text-center">
                    <ChefHat className="mx-auto size-7 text-muted-foreground/40" />
                    <p className="mt-2 text-xs font-medium text-foreground">
                        No menu items to analyse
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        No items matched these filters, or there were no sales
                        in this period.
                    </p>
                </div>
            ) : (
                <>
                    {/* Modern Matrix Scatter with Food Images in Bubbles */}
                    <MatrixScatter
                        data={data!}
                        currency={currency}
                        onSelect={handleSelect}
                    />

                    {/* Manager's Attention (Clean & Minimal) */}
                    {summary && (
                        <div className="space-y-2.5">
                            <h2 className="text-xs font-medium text-muted-foreground">
                                Priority Insights
                            </h2>
                            <div className="grid gap-3 md:grid-cols-3">
                                <AttentionCard
                                    title="Top performers"
                                    description="Dishes generating strong sales & margins."
                                    icon={
                                        <Star className="size-3.5 text-amber-500" />
                                    }
                                    items={summary.fastestSellers.slice(0, 3)}
                                    onSelect={handleSelect}
                                    badge="High profit"
                                    badgeCls="bg-emerald-500/5 text-emerald-700 border-emerald-500/20"
                                />
                                <AttentionCard
                                    title="High-cost dishes"
                                    description="Dishes with high ingredient cost ratios."
                                    icon={
                                        <Flame className="size-3.5 text-rose-500" />
                                    }
                                    items={summary.highestFoodCostItems.slice(
                                        0,
                                        3,
                                    )}
                                    onSelect={handleSelect}
                                    badge={
                                        meta?.foodCostAlertCount
                                            ? `${meta.foodCostAlertCount} alerts`
                                            : "Review"
                                    }
                                    badgeCls="bg-rose-500/5 text-rose-700 border-rose-500/20"
                                />
                                <AttentionCard
                                    title="Slow movers"
                                    description="Low volume items with limited contribution."
                                    icon={
                                        <TrendingDown className="size-3.5 text-sky-500" />
                                    }
                                    items={summary.slowestSellers.slice(0, 3)}
                                    onSelect={handleSelect}
                                    badge="Low volume"
                                    badgeCls="bg-sky-500/5 text-sky-700 border-sky-500/20"
                                />
                            </div>
                        </div>
                    )}

                    {/* Main Table with Dish Photos & Clean Layout */}
                    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/20">
                        <table className="w-full min-w-[1020px] text-xs">
                            <thead className="border-b border-border/50 bg-muted/20 text-[10px] text-muted-foreground">
                                <tr>
                                    <Th
                                        label="Dish"
                                        active={sortKey === "name"}
                                        dir={sortDir}
                                        onClick={() => toggleSort("name")}
                                        align="left"
                                    />
                                    <th className="px-3 py-2.5 text-left font-medium">
                                        Quadrant
                                    </th>
                                    <Th
                                        label="Sold"
                                        active={sortKey === "quantitySold"}
                                        dir={sortDir}
                                        onClick={() =>
                                            toggleSort("quantitySold")
                                        }
                                    />
                                    <Th
                                        label="Mix %"
                                        active={sortKey === "menuMixPercent"}
                                        dir={sortDir}
                                        onClick={() =>
                                            toggleSort("menuMixPercent")
                                        }
                                    />
                                    <Th
                                        label="Price"
                                        active={sortKey === "price"}
                                        dir={sortDir}
                                        onClick={() => toggleSort("price")}
                                    />
                                    <Th
                                        label="Plate cost"
                                        active={sortKey === "plateCost"}
                                        dir={sortDir}
                                        onClick={() => toggleSort("plateCost")}
                                    />
                                    <Th
                                        label="Food cost %"
                                        active={sortKey === "foodCostPercent"}
                                        dir={sortDir}
                                        onClick={() =>
                                            toggleSort("foodCostPercent")
                                        }
                                    />
                                    <Th
                                        label="Contribution"
                                        active={
                                            sortKey === "contributionMargin"
                                        }
                                        dir={sortDir}
                                        onClick={() =>
                                            toggleSort("contributionMargin")
                                        }
                                    />
                                    <Th
                                        label="Total contribution"
                                        active={sortKey === "totalContribution"}
                                        dir={sortDir}
                                        onClick={() =>
                                            toggleSort("totalContribution")
                                        }
                                    />
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        Suggested
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        Trend
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        Momentum
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {sortedItems.map(item => {
                                    const qm = QUADRANT_META[item.quadrant];
                                    const dishImg = resolveDishImage(item);
                                    return (
                                        <tr
                                            key={item.menuItemId}
                                            onClick={() =>
                                                handleSelect(item.menuItemId)
                                            }
                                            className={cn(
                                                "cursor-pointer transition-colors hover:bg-muted/30",
                                                item.foodCostAlert &&
                                                    "bg-rose-500/[0.02]",
                                            )}
                                        >
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2.5">
                                                    {dishImg ? (
                                                        <img
                                                            src={dishImg}
                                                            alt={item.name}
                                                            className="size-7 shrink-0 rounded-md object-cover border border-border/40"
                                                        />
                                                    ) : (
                                                        <div
                                                            className="flex size-7 shrink-0 items-center justify-center rounded-md border text-[9px] font-mono text-muted-foreground"
                                                            style={{
                                                                borderColor: `${qm.hex}40`,
                                                                backgroundColor: `${qm.hex}10`,
                                                            }}
                                                        >
                                                            {item.name
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-foreground">
                                                            {item.name}
                                                        </p>
                                                        <p className="truncate text-[10px] text-muted-foreground">
                                                            {item.categoryName ??
                                                                "Uncategorized"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium",
                                                        qm.chip,
                                                    )}
                                                >
                                                    {qm.emoji} {qm.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-mono text-[11px]">
                                                {item.quantitySold}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-mono text-[11px]">
                                                {formatPercent(
                                                    item.menuMixPercent,
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-mono text-[11px]">
                                                {formatMoney(
                                                    item.price,
                                                    currency,
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-mono text-[11px]">
                                                {formatMoney(
                                                    item.plateCost,
                                                    currency,
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-mono text-[11px]">
                                                {formatPercent(
                                                    item.foodCostPercent,
                                                )}
                                                {item.foodCostAlert ? (
                                                    <AlertTriangle className="ml-1 inline size-2.5 text-rose-500" />
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-mono text-[11px]">
                                                {formatMoney(
                                                    item.contributionMargin,
                                                    currency,
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium tabular-nums font-mono text-[11px] text-foreground">
                                                {formatMoney(
                                                    item.totalContribution,
                                                    currency,
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-mono text-[11px]">
                                                {item.suggestedPrice != null ? (
                                                    <span className="inline-flex flex-col items-end leading-tight">
                                                        <span>
                                                            {formatMoney(
                                                                item.suggestedPrice,
                                                                currency,
                                                            )}
                                                        </span>
                                                        {item.priceGapPercent !=
                                                        null ? (
                                                            <span
                                                                className={cn(
                                                                    "text-[9px]",
                                                                    item.priceGapPercent <
                                                                        0
                                                                        ? "text-rose-600 dark:text-rose-400"
                                                                        : "text-emerald-600 dark:text-emerald-400",
                                                                )}
                                                            >
                                                                {item.priceGapPercent >
                                                                0
                                                                    ? "+"
                                                                    : ""}
                                                                {item.priceGapPercent.toFixed(
                                                                    0,
                                                                )}
                                                                %
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <TrendBadge
                                                    value={
                                                        item.quantityTrendPercent
                                                    }
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Sparkline
                                                        series={item.series}
                                                    />
                                                    <MomentumBadge
                                                        momentum={item.momentum}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Cost intelligence */}
                    {summary ? (
                        <CostIntelligencePanel
                            spikes={summary.costSpikes}
                            varianceItems={summary.varianceAdjustedItems}
                            currency={currency}
                            onSelect={handleSelect}
                        />
                    ) : null}

                    {/* Ranked lists */}
                    {summary ? (
                        <div className="grid gap-3 md:grid-cols-3">
                            <RankedList
                                title="Fastest sellers"
                                icon={<TrendingUp className="size-3.5" />}
                                rows={summary.fastestSellers.map(row => ({
                                    id: row.menuItemId,
                                    name: row.name,
                                    value: `${row.quantitySold} sold`,
                                }))}
                                onSelect={handleSelect}
                            />
                            <RankedList
                                title="Slowest sellers"
                                icon={<TrendingDown className="size-3.5" />}
                                rows={summary.slowestSellers.map(row => ({
                                    id: row.menuItemId,
                                    name: row.name,
                                    value: `${row.quantitySold} sold`,
                                }))}
                                onSelect={handleSelect}
                            />
                            <RankedList
                                title="Top contribution"
                                icon={<Star className="size-3.5" />}
                                rows={summary.topContributionItems.map(row => ({
                                    id: row.menuItemId,
                                    name: row.name,
                                    value: formatMoney(
                                        row.totalContribution,
                                        currency,
                                    ),
                                }))}
                                onSelect={handleSelect}
                            />
                        </div>
                    ) : null}

                    {meta ? (
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Undo2 className="size-3" />
                            Comparing {meta.from} → {meta.to} against{" "}
                            {meta.previousFrom} → {meta.previousTo}
                        </p>
                    ) : null}
                </>
            )}
        </div>
    );
}

function Th({
    label,
    active,
    dir,
    onClick,
    align = "right",
}: {
    label: string;
    active: boolean;
    dir: "asc" | "desc";
    onClick: () => void;
    align?: "left" | "right";
}) {
    return (
        <th
            className={cn(
                "cursor-pointer select-none px-3 py-2.5 font-medium transition-colors hover:text-foreground",
                align === "left" ? "text-left" : "text-right",
            )}
            onClick={onClick}
        >
            <span
                className={cn(
                    "inline-flex items-center gap-0.5",
                    active && "text-foreground",
                )}
            >
                {label}
                {active ? (
                    dir === "asc" ? (
                        <ArrowUpRight className="size-3" />
                    ) : (
                        <ArrowDownRight className="size-3" />
                    )
                ) : null}
            </span>
        </th>
    );
}

function RankedList({
    title,
    icon,
    rows,
    onSelect,
}: {
    title: string;
    icon: React.ReactNode;
    rows: { id: string; name: string; value: string }[];
    onSelect: (id: string) => void;
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span className="text-muted-foreground">{icon}</span>
                <span>{title}</span>
            </div>
            <div className="mt-3 space-y-1.5">
                {rows.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No data</p>
                ) : (
                    rows.map(row => (
                        <button
                            key={row.id}
                            type="button"
                            onClick={() => onSelect(row.id)}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left text-xs transition-colors hover:bg-muted/40"
                        >
                            <span className="min-w-0 truncate text-foreground">
                                {row.name}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                                {row.value}
                            </span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
