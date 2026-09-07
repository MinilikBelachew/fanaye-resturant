"use client";

import {
    Clock,
    Coffee,
    CookingPot,
    CupSoda,
    Edit3,
    SlidersHorizontal,
    Trash2,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    deleteMenuItem,
    toggleItemAvailability,
} from "@/context/slices/menuSlice";
import type { MenuItem } from "@/domains/catalog/domain/menu";
import {
    STATION_IDS,
    type StationId,
} from "@/domains/fulfillment/domain/station";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MenuItemDetailSheetProps {
    item: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (item: MenuItem) => void;
}

const STATION_META: Record<
    StationId,
    {
        label: string;
        icon: typeof CookingPot;
        color: string;
    }
> = {
    [STATION_IDS.kitchen]: {
        label: "Kitchen",
        icon: CookingPot,
        color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    },
    [STATION_IDS.barista]: {
        label: "Barista",
        icon: Coffee,
        color: "text-amber-800 bg-amber-800/10 border-amber-800/20",
    },
    [STATION_IDS.cakes]: {
        label: "Cakes",
        icon: UtensilsCrossed,
        color: "text-pink-600 bg-pink-500/10 border-pink-500/20",
    },
    [STATION_IDS.soft_drinks]: {
        label: "Soft Drinks",
        icon: CupSoda,
        color: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    },
};

export default function MenuItemDetailSheet({
    item,
    isOpen,
    onClose,
    onEdit,
}: MenuItemDetailSheetProps) {
    const dispatch = useAppDispatch();
    const stations = useAppSelector(state => state.station.stations);

    if (!isOpen || !item) return null;

    const matchingStation = stations.find(s => s.id === item.stationId);
    const stationLabel =
        matchingStation?.name ||
        STATION_META[item.stationId]?.label ||
        "Kitchen";
    const StationIcon =
        STATION_META[item.stationId]?.icon || CookingPot;
    const stationColorClass =
        STATION_META[item.stationId]?.color ||
        "text-amber-600 bg-amber-500/10 border-amber-500/20";

    function handleToggleStatus() {
        if (!item) return;
        dispatch(toggleItemAvailability(item.id));
    }

    function handleDelete() {
        if (!item) return;
        if (
            confirm(
                `Are you sure you want to remove "${item.name}" from the menu catalog?`,
            )
        ) {
            dispatch(deleteMenuItem(item.id));
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
            {/* Backdrop click */}
            <div className="flex-1" onClick={onClose} aria-hidden="true" />

            {/* Slide-over panel */}
            <div className="relative flex h-full w-full max-w-lg flex-col border-l border-hairline bg-card animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-surface-ivory px-5 py-3.5">
                    <h2 className="text-[16px] font-semibold text-foreground">
                        Item details
                    </h2>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                onEdit(item);
                            }}
                            className="flex size-8 items-center justify-center rounded-full border border-hairline bg-card text-slate-gray transition-colors hover:bg-secondary hover:text-foreground"
                            title="Edit menu item"
                        >
                            <Edit3 className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex size-8 items-center justify-center rounded-full border border-hairline bg-card text-slate-gray transition-colors hover:bg-red-50 hover:text-destructive"
                            title="Delete item"
                        >
                            <Trash2 className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex size-8 items-center justify-center rounded-full border border-hairline bg-card text-slate-gray transition-colors hover:bg-secondary hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="sidebar-scroll flex-1 space-y-5 overflow-y-auto p-5">
                    {/* Image presentation */}
                    {item.image ? (
                        <div className="relative h-56 w-full overflow-hidden rounded-[14px] border border-hairline bg-secondary">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={item.image}
                                alt={item.name}
                                className="size-full object-cover"
                            />
                            <div className="absolute top-3 right-3">
                                <button
                                    type="button"
                                    onClick={handleToggleStatus}
                                    className={cn(
                                        "rounded-full px-3 py-1 text-[12px] font-semibold backdrop-blur-md transition-colors",
                                        item.available
                                            ? "bg-white/95 text-emerald-800 hover:bg-emerald-100"
                                            : "bg-red-600/95 text-white hover:bg-red-700",
                                    )}
                                >
                                    {item.available
                                        ? "Active on floor"
                                        : "86'd (Sold out)"}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {/* Title & Price Header */}
                    <div>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h1 className="text-[22px] font-semibold text-foreground">
                                    {item.name}
                                </h1>
                                <p className="mt-1 text-[14px] text-slate-gray">
                                    {item.description}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[20px] font-semibold text-foreground">
                                    {formatEtb(item.price)}
                                </p>
                                <div className="mt-0.5 flex items-center justify-end gap-1 text-[12px] text-slate-gray">
                                    <Clock className="size-3.5" />
                                    <span>
                                        ~{item.expectedPreparationMinutes} min
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-hairline" />

                    {/* Routing & Station */}
                    <div className="space-y-3">
                        <h3 className="text-[13px] font-medium text-slate-gray uppercase tracking-wider">
                            Station & Classification
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[12px] border border-hairline bg-surface-ivory p-3">
                                <p className="text-[11px] text-slate-gray">
                                    Fulfillment Station
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    <div
                                        className={cn(
                                            "flex size-7 items-center justify-center rounded-full border",
                                            stationColorClass,
                                        )}
                                    >
                                        <StationIcon className="size-3.5" />
                                    </div>
                                    <span className="text-[14px] font-medium text-foreground">
                                        {stationLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-[12px] border border-hairline bg-surface-ivory p-3">
                                <p className="text-[11px] text-slate-gray">
                                    Menu Category
                                </p>
                                <p className="mt-1 text-[14px] font-medium text-foreground">
                                    {item.category}
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-hairline" />

                    {/* Modifier Groups */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[13px] font-medium text-slate-gray uppercase tracking-wider">
                                Options & Modifiers
                            </h3>
                            <Badge variant="secondary">
                                {item.modifierGroups.length} group
                                {item.modifierGroups.length === 1 ? "" : "s"}
                            </Badge>
                        </div>

                        {item.modifierGroups.length > 0 ? (
                            <div className="space-y-3">
                                {item.modifierGroups.map(group => (
                                    <div
                                        key={group.id}
                                        className="rounded-[12px] border border-hairline bg-surface-ivory p-3.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground capitalize">
                                                    {group.kind}
                                                </span>
                                                <span className="text-[13px] font-semibold text-foreground">
                                                    {group.name}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-gray">
                                                {group.options.length} options
                                            </span>
                                        </div>

                                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                                            {group.options.map(opt => (
                                                <span
                                                    key={opt.id}
                                                    className="flex items-center gap-1.5 rounded-full border border-hairline bg-card px-2.5 py-1 text-[12px]"
                                                >
                                                    <span className="text-foreground">
                                                        {opt.name}
                                                    </span>
                                                    {opt.priceDelta > 0 ? (
                                                        <span className="font-semibold text-brand">
                                                            +ETB{" "}
                                                            {opt.priceDelta}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-gray">
                                                            (free)
                                                        </span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-[12px] border border-dashed border-hairline bg-surface-ivory p-3.5 text-[13px] text-slate-gray">
                                No modifier options configured for this dish.
                                Waiters order standard preparation.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-hairline bg-surface-ivory px-5 py-3.5">
                    <Button
                        type="button"
                        variant={item.available ? "outline" : "default"}
                        onClick={handleToggleStatus}
                        className={cn(
                            "h-9 rounded-full px-4 text-[13px]",
                            !item.available &&
                                "bg-emerald-600 text-white hover:bg-emerald-700",
                        )}
                    >
                        {item.available ? "Mark 86 (Sold out)" : "Mark Available"}
                    </Button>

                    <Button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="h-9 flex items-center gap-1.5 rounded-full bg-brand px-5 text-[13px] text-white hover:bg-brand-deep"
                    >
                        <Edit3 className="size-3.5" />
                        Edit dish
                    </Button>
                </div>
            </div>
        </div>
    );
}
