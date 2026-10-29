"use client";

import React from "react";
import { Check, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DiningTableVisualCardProps {
    tableId: string;
    displayName: string;
    displayNumber?: string | null;
    selected: boolean;
    ownedByOther: boolean;
    ownedBySelf: boolean;
    ownerName?: string | null;
    currentWaiterName?: string;
    onToggle: () => void;
    labels: {
        mine: string;
        free: string;
        assigned: (name: string) => string;
        thisWaiter: string;
    };
    variant?: "minimal" | "compact";
}

export function DiningTableVisualCard({
    displayName,
    displayNumber,
    selected,
    ownedByOther,
    ownedBySelf: _ownedBySelf,
    ownerName,
    currentWaiterName: _currentWaiterName,
    onToggle,
    labels,
}: DiningTableVisualCardProps) {
    const tableNum = displayNumber ? `#${displayNumber}` : displayName;
    const secondaryName = displayNumber ? displayName : null;

    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                "group relative flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left transition-all duration-150 select-none",
                "hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0",
                selected
                    ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1.5 ring-emerald-500/30 dark:bg-emerald-950/25 dark:border-emerald-500"
                    : ownedByOther
                      ? "border-indigo-300/80 bg-indigo-50/60 text-foreground dark:border-indigo-500/40 dark:bg-indigo-950/30 hover:border-indigo-400 dark:hover:border-indigo-400"
                      : "border-hairline bg-card/70 text-foreground hover:border-zinc-400/50 hover:bg-secondary/50",
            )}
        >
            {/* Table Number Badge & Names */}
            <div className="flex min-w-0 items-center gap-2">
                <span
                    className={cn(
                        "flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg px-1.5 text-[11px] font-bold tracking-tight transition-colors",
                        selected
                            ? "bg-emerald-600 text-white shadow-xs font-bold"
                            : ownedByOther
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-700/60"
                              : "bg-secondary text-foreground group-hover:bg-muted group-hover:text-foreground",
                    )}
                >
                    {tableNum}
                </span>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium leading-tight">
                        {secondaryName || tableNum}
                    </p>
                    <p
                        className={cn(
                            "truncate text-[10px] leading-tight",
                            selected
                                ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                : ownedByOther
                                  ? "font-semibold text-indigo-600 dark:text-indigo-400"
                                  : "text-slate-gray",
                        )}
                    >
                        {selected
                            ? labels.mine
                            : ownedByOther
                              ? ownerName
                                  ? `Taken · ${ownerName.split(" ")[0]}`
                                  : "Taken"
                              : labels.free}
                    </p>
                </div>
            </div>

            {/* Status indicator on the right */}
            <div className="shrink-0">
                {selected ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                        <Check className="size-3 stroke-[2.5]" />
                    </span>
                ) : ownedByOther ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-700/60">
                        <UserRound className="size-2.5" />
                    </span>
                ) : (
                    <span className="flex size-5 items-center justify-center rounded-full border border-border/80 bg-background/50 text-slate-gray group-hover:border-zinc-400">
                        <span className="size-1.5 rounded-full bg-emerald-500/80" />
                    </span>
                )}
            </div>
        </button>
    );
}

export default DiningTableVisualCard;
