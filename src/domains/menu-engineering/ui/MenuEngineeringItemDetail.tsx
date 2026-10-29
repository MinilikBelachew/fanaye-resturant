"use client";

import { useState, useMemo } from "react";
import {
    AlertTriangle,
    ArrowLeft,
    ChevronRight,
    Flame,
    Loader2,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    ChefHat,
    DollarSign,
    Award,
    Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    MenuEngineeringRecipeLine,
    MenuEngineeringTrendDirection,
    useGetMenuEngineeringQuery,
} from "@/context/services/menuEngineeringApi";
import {
    filePublicUrl,
    IMAGE_KEY_TO_URL,
    imageForDish,
} from "@/domains/catalog/application/menuImages";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface QuadrantMeta {
    label: string;
    short: string;
    emoji: string;
    action: string;
    hex: string;
    chip: string;
}

const QUADRANT_META: Record<string, QuadrantMeta> = {
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

function MomentumBadge({
    momentum,
}: {
    momentum: MenuEngineeringTrendDirection;
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

function Stat({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
                <p className="text-[11px] font-medium text-muted-foreground">
                    {label}
                </p>
                {icon && <div className="text-muted-foreground/60">{icon}</div>}
            </div>
            <p className="mt-1 text-lg font-medium tabular-nums tracking-tight text-foreground font-mono">
                {value}
            </p>
        </div>
    );
}

function RecipeBreakdown({
    lines,
    currency,
}: {
    lines: MenuEngineeringRecipeLine[];
    currency: string;
}) {
    if (lines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center">
                <ChefHat className="size-6 text-muted-foreground/40" />
                <p className="mt-2 text-xs font-medium text-foreground">
                    No recipe lines found
                </p>
                <p className="text-[11px] text-muted-foreground">
                    This item has no plate cost yet.
                </p>
            </div>
        );
    }
    return (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/20">
            <table className="w-full text-xs">
                <thead className="border-b border-border/50 bg-muted/20 text-[10px] text-muted-foreground">
                    <tr>
                        <th className="px-3.5 py-2 text-left font-medium">
                            Ingredient
                        </th>
                        <th className="px-3.5 py-2 text-right font-medium">
                            Qty
                        </th>
                        <th className="px-3.5 py-2 text-right font-medium">
                            Unit Cost
                        </th>
                        <th className="px-3.5 py-2 text-right font-medium">
                            Line Cost
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {lines.map(line => (
                        <tr
                            key={line.ingredientId}
                            className="hover:bg-muted/30 transition-colors"
                        >
                            <td className="px-3.5 py-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-foreground">
                                        {line.ingredientName}
                                    </span>
                                    <span
                                        className={cn(
                                            "rounded-full border px-1.5 py-0.2 text-[8px] font-medium tracking-wide",
                                            line.costSource === "LEDGER"
                                                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                                                : "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300",
                                        )}
                                    >
                                        {line.costSource === "LEDGER"
                                            ? "Latest"
                                            : "List"}
                                    </span>
                                </div>
                            </td>
                            <td className="px-3.5 py-2 text-right tabular-nums font-mono text-[11px] text-muted-foreground">
                                {line.quantityPerServing}{" "}
                                {line.unit ?? line.baseUnit}
                            </td>
                            <td className="px-3.5 py-2 text-right tabular-nums font-mono text-[11px]">
                                <span className="text-foreground">
                                    {formatMoney(
                                        line.costPerBaseUnit,
                                        currency,
                                    )}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    /{line.baseUnit}
                                </span>
                                {line.costChangePercent != null &&
                                    line.costChangePercent !== 0 && (
                                        <span
                                            className={cn(
                                                "ml-1 text-[9px] font-medium",
                                                line.costChangePercent > 0
                                                    ? "text-rose-600"
                                                    : "text-emerald-600",
                                            )}
                                        >
                                            {line.costChangePercent > 0
                                                ? "+"
                                                : ""}
                                            {line.costChangePercent.toFixed(0)}%
                                        </span>
                                    )}
                            </td>
                            <td className="px-3.5 py-2 text-right font-medium tabular-nums font-mono text-[11px] text-foreground">
                                {formatMoney(line.lineCost, currency)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function MenuEngineeringItemDetail({
    itemId,
    backPath,
}: {
    itemId: string;
    backPath: string;
}) {
    const router = useRouter();
    const { data, isLoading } = useGetMenuEngineeringQuery();
    const [simPrice, setSimPrice] = useState<number | null>(null);
    const [simPortion, setSimPortion] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<
        "performance" | "recipe" | "simulator"
    >("performance");

    const item = useMemo(
        () => data?.items.find(i => i.menuItemId === itemId),
        [data, itemId],
    );

    const actualImageUrl = useMemo(() => {
        if (!item) return undefined;
        return (
            filePublicUrl(item.imageUrl) ??
            (item.imageKey ? IMAGE_KEY_TO_URL[item.imageKey] : undefined) ??
            imageForDish(item.name)
        );
    }, [item]);

    const imageUrl = useMemo(() => {
        if (!item) return "";
        if (actualImageUrl) return actualImageUrl;
        const imagePrompt = `gourmet ${item.name} food photography, professional plating, restaurant background`;
        return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(imagePrompt)}&image_size=landscape_16_9`;
    }, [item, actualImageUrl]);

    if (isLoading) {
        return (
            <div className="flex h-[320px] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                        Loading dish performance…
                    </p>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex h-[320px] flex-col items-center justify-center text-center">
                <ChefHat className="size-7 text-muted-foreground/30 mb-2" />
                <h3 className="text-sm font-medium text-foreground">
                    Dish not found
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    Could not find engineering data for this item.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-xs"
                    onClick={() => router.push(backPath)}
                >
                    <ArrowLeft className="mr-1.5 size-3.5" /> Back to Dashboard
                </Button>
            </div>
        );
    }

    const currency = data?.meta.currencyCode ?? "ETB";
    const targetFoodCostPercent =
        data?.meta.targets.targetFoodCostPercent ?? 30;
    const meta = QUADRANT_META[item.quadrant] ?? QUADRANT_META.UNCLASSIFIED;
    const buckets = data?.meta.buckets ?? [];

    const price = simPrice ?? item.price;
    const portion = simPortion ?? 1;
    const simPlateCost =
        item.plateCost != null ? item.plateCost * portion : null;
    const simFoodCostPercent =
        simPlateCost != null && price > 0 ? (simPlateCost / price) * 100 : null;
    const simMargin = simPlateCost != null ? price - simPlateCost : null;
    const simSuggestedPrice =
        simPlateCost != null && targetFoodCostPercent > 0
            ? simPlateCost / (targetFoodCostPercent / 100)
            : null;

    return (
        <div className="space-y-4">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Link
                    href={backPath}
                    className="hover:text-foreground transition-colors"
                >
                    Menu Engineering
                </Link>
                <ChevronRight className="size-3 text-muted-foreground/50" />
                <span className="text-foreground font-medium">{item.name}</span>
            </div>

            {/* Top Grid: Hero & Strategy */}
            <div className="grid gap-3 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-3">
                    {/* Hero Visual Card */}
                    <div className="relative h-52 w-full overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                        <img
                            src={imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium tracking-wide",
                                        meta.chip,
                                    )}
                                >
                                    {meta.emoji} {meta.label}
                                </span>
                                {item.foodCostAlert && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/80 px-2 py-0.5 text-[9px] font-medium text-white">
                                        <AlertTriangle className="size-2.5" />{" "}
                                        High Cost
                                    </span>
                                )}
                            </div>
                            <h1 className="mt-1.5 text-xl font-medium tracking-tight text-white">
                                {item.name}
                            </h1>
                            <p className="text-[11px] text-white/80">
                                {item.categoryName ?? "Uncategorized"}
                                {item.stationName
                                    ? ` · ${item.stationName}`
                                    : ""}
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Stat
                            label="Price"
                            value={formatMoney(item.price, currency)}
                            icon={<DollarSign className="size-3.5" />}
                        />
                        <Stat
                            label="Plate Cost"
                            value={formatMoney(item.plateCost, currency)}
                            icon={<ChefHat className="size-3.5" />}
                        />
                        <Stat
                            label="Margin"
                            value={formatMoney(
                                item.contributionMargin,
                                currency,
                            )}
                            icon={<Percent className="size-3.5" />}
                        />
                        <Stat
                            label="Food Cost %"
                            value={formatPercent(item.foodCostPercent)}
                            icon={<Target className="size-3.5" />}
                        />
                    </div>
                </div>

                {/* Strategy Card */}
                <div className="rounded-xl border border-border/60 bg-card/30 p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-medium text-muted-foreground">
                                Strategic Action
                            </h3>
                            <MomentumBadge momentum={item.momentum} />
                        </div>
                        <div className="mt-4 flex flex-col items-center text-center">
                            <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center text-2xl mb-2">
                                {meta.emoji}
                            </div>
                            <h4 className="text-sm font-medium text-foreground">
                                {meta.short}
                            </h4>
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                {meta.action}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                            <span>Sales Momentum</span>
                            <span className="font-mono text-foreground font-medium">
                                {item.quantitySold} sold
                            </span>
                        </div>
                        <div className="flex h-9 items-end gap-1">
                            {item.series.map((val, i) => {
                                const max = Math.max(...item.series, 1);
                                const height = (val / max) * 100;
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 bg-primary/25 hover:bg-primary transition-colors rounded-t-sm"
                                        style={{
                                            height: `${Math.max(4, height)}%`,
                                        }}
                                        title={`${val} units on ${buckets[i]?.label ?? i}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Clean Segmented Tabs Navigation */}
            <div className="flex items-center gap-1 border-b border-border/50 pb-2">
                {(["performance", "recipe", "simulator"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                            activeTab === tab
                                ? "bg-muted/70 text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "performance" && (
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-3">
                            <div className="rounded-xl border border-border/60 bg-card/30 p-4">
                                <h4 className="text-xs font-medium text-muted-foreground mb-4">
                                    Sales Performance
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[11px] text-muted-foreground">
                                            Volume growth
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-medium font-mono tabular-nums">
                                                {item.quantitySold}
                                            </span>
                                            <TrendBadge
                                                value={
                                                    item.quantityTrendPercent
                                                }
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            vs previous period
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] text-muted-foreground">
                                            Market share
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-medium font-mono tabular-nums">
                                                {formatPercent(
                                                    item.menuMixPercent,
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            of total category sales
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/60 bg-card/30 p-4">
                                <h4 className="text-xs font-medium text-muted-foreground mb-4">
                                    Profit Impact
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[11px] text-muted-foreground">
                                            Total contribution
                                        </p>
                                        <span className="text-xl font-medium font-mono tabular-nums text-foreground">
                                            {formatMoney(
                                                item.totalContribution,
                                                currency,
                                            )}
                                        </span>
                                        <p className="text-[10px] text-muted-foreground">
                                            Revenue − Food cost
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] text-muted-foreground">
                                            Margin quality
                                        </p>
                                        <span className="text-xl font-medium font-mono tabular-nums text-foreground">
                                            {formatPercent(
                                                item.contributionMarginPercent,
                                            )}
                                        </span>
                                        <p className="text-[10px] text-muted-foreground">
                                            Contribution per unit
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {item.foodCostAlert && (
                                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex gap-3">
                                    <AlertTriangle className="size-4 shrink-0 text-rose-500 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-medium text-rose-700 dark:text-rose-400">
                                            High Cost Alert
                                        </h4>
                                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                            Food cost is{" "}
                                            <span className="font-medium text-rose-600">
                                                {formatPercent(
                                                    item.foodCostPercent,
                                                )}
                                            </span>
                                            , exceeding target of{" "}
                                            {targetFoodCostPercent}%. Review
                                            portion sizes or pricing.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {item.topCostDriver && (
                                <div className="rounded-xl border border-border/60 bg-card/30 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-medium text-muted-foreground">
                                            Top Cost Driver
                                        </h4>
                                        <Flame className="size-3.5 text-rose-500" />
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-medium text-foreground">
                                                {
                                                    item.topCostDriver
                                                        .ingredientName
                                                }
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {formatPercent(
                                                    item.topCostDriver
                                                        .percentOfPlateCost,
                                                )}{" "}
                                                of plate cost
                                            </p>
                                        </div>
                                        <p className="text-sm font-medium font-mono tabular-nums text-foreground">
                                            {formatMoney(
                                                item.topCostDriver.cost,
                                                currency,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "recipe" && (
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    Standard Plate Cost
                                </span>
                                <span className="text-[11px]">
                                    Yield: 1 serving
                                </span>
                            </div>
                            <RecipeBreakdown
                                lines={item.recipe}
                                currency={currency}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    Theoretical Consumption
                                </span>
                                <span className="text-[11px] font-mono">
                                    {item.quantitySold} units sold
                                </span>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-border/60 bg-card/20">
                                <table className="w-full text-xs">
                                    <thead className="border-b border-border/50 bg-muted/20 text-[10px] text-muted-foreground">
                                        <tr>
                                            <th className="px-3.5 py-2 text-left font-medium">
                                                Ingredient
                                            </th>
                                            <th className="px-3.5 py-2 text-right font-medium">
                                                Total Qty Used
                                            </th>
                                            <th className="px-3.5 py-2 text-right font-medium">
                                                Usage Cost
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {item.recipe.map(line => {
                                            const totalQty =
                                                line.quantityPerServing *
                                                item.quantitySold;
                                            const totalCost =
                                                (line.lineCost ?? 0) *
                                                item.quantitySold;
                                            return (
                                                <tr
                                                    key={line.ingredientId}
                                                    className="hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="px-3.5 py-2 font-medium text-foreground">
                                                        {line.ingredientName}
                                                    </td>
                                                    <td className="px-3.5 py-2 text-right tabular-nums font-mono text-[11px] text-muted-foreground">
                                                        {totalQty.toFixed(2)}{" "}
                                                        {line.unit ??
                                                            line.baseUnit}
                                                    </td>
                                                    <td className="px-3.5 py-2 text-right tabular-nums font-mono text-[11px] text-foreground">
                                                        {formatMoney(
                                                            totalCost,
                                                            currency,
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-muted/15 font-medium">
                                            <td
                                                colSpan={2}
                                                className="px-3.5 py-2.5 text-right text-[11px] text-muted-foreground"
                                            >
                                                Total Period Cost
                                            </td>
                                            <td className="px-3.5 py-2.5 text-right text-xs tabular-nums font-mono text-foreground font-medium">
                                                {formatMoney(
                                                    (item.plateCost ?? 0) *
                                                        item.quantitySold,
                                                    currency,
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {item.usageAdjustedPlateCost != null && (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
                                <Award className="size-4 shrink-0 text-amber-500 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                        Variance-Adjusted Plate Cost
                                    </h4>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        Including recorded waste and stock count
                                        shrinkage, actual plate cost is
                                        <span className="font-medium text-foreground mx-1">
                                            {formatMoney(
                                                item.usageAdjustedPlateCost,
                                                currency,
                                            )}
                                        </span>
                                        (+
                                        {formatPercent(
                                            item.varianceDeltaPercent,
                                        )}{" "}
                                        variance).
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "simulator" && (
                    <div className="max-w-xl mx-auto space-y-6 py-2">
                        <div className="text-center space-y-1">
                            <h4 className="text-sm font-medium text-foreground">
                                Profitability Simulator
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Adjust price and portion to evaluate impact
                                against your {targetFoodCostPercent}% target.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5 rounded-xl border border-border/60 bg-card/30 p-3.5">
                                <label className="text-[11px] text-muted-foreground">
                                    Simulated Price
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={e =>
                                            setSimPrice(Number(e.target.value))
                                        }
                                        className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        {currency}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5 rounded-xl border border-border/60 bg-card/30 p-3.5">
                                <label className="text-[11px] text-muted-foreground">
                                    Portion Multiplier
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.05"
                                        value={portion}
                                        onChange={e =>
                                            setSimPortion(
                                                Number(e.target.value),
                                            )
                                        }
                                        className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        x
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-border/60 bg-card/30 p-4 text-center">
                                <p className="text-[11px] text-muted-foreground">
                                    Simulated Food Cost
                                </p>
                                <p
                                    className={cn(
                                        "mt-1 text-2xl font-medium font-mono tabular-nums",
                                        simFoodCostPercent &&
                                            simFoodCostPercent >
                                                targetFoodCostPercent
                                            ? "text-rose-500"
                                            : "text-emerald-500",
                                    )}
                                >
                                    {formatPercent(simFoodCostPercent)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-card/30 p-4 text-center">
                                <p className="text-[11px] text-muted-foreground">
                                    Simulated Margin
                                </p>
                                <p className="mt-1 text-2xl font-medium font-mono tabular-nums text-foreground">
                                    {formatMoney(simMargin, currency)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-card/30 p-4 text-center">
                            <p className="text-xs text-muted-foreground">
                                To achieve {targetFoodCostPercent}% target with
                                this portion, recommend charging:
                            </p>
                            <p className="mt-1 text-2xl font-medium text-foreground font-mono tabular-nums">
                                {formatMoney(simSuggestedPrice, currency)}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
