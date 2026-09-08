"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export type FloorCardTone = "free" | "mine" | "other" | "occupied" | "available";

export default function FloorTableCard({
    tableNumber,
    location,
    seats,
    badge,
    waiter,
    total,
    note,
    footerLeft,
    footerAction,
    extraStatus,
    onClick,
}: {
    tableNumber: string;
    location?: string;
    seats?: number;
    badge: { label: string; tone: FloorCardTone };
    waiter?: string | null;
    total?: string | null;
    note?: string | null;
    footerLeft: string;
    footerAction: string;
    extraStatus?: string | null;
    onClick: () => void;
}) {
    const occupied =
        badge.tone === "mine" ||
        badge.tone === "other" ||
        badge.tone === "occupied";

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group flex w-full flex-col rounded-[16px] border bg-card p-4 text-left shadow-subtle transition-all hover:scale-[1.01]",
                badge.tone === "mine"
                    ? "border-primary/45 bg-accent/70 hover:border-primary"
                    : occupied
                      ? "border-primary/30 hover:border-primary/60"
                      : "border-hairline hover:border-primary/35",
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[12px] font-medium text-slate-gray">
                        Table
                    </p>
                    <p className="text-[28px] font-semibold leading-none tracking-tight">
                        {tableNumber}
                    </p>
                    {location ? (
                        <p className="mt-1.5 text-[12px] text-slate-gray">
                            {location}
                        </p>
                    ) : null}
                </div>
                <div className="text-right">
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                            badge.tone === "mine" || badge.tone === "occupied"
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : badge.tone === "other"
                                  ? "border-hairline bg-secondary text-foreground"
                                  : "border-hairline bg-secondary text-slate-gray",
                        )}
                    >
                        <span
                            className={cn(
                                "size-1.5 rounded-full",
                                badge.tone === "mine" ||
                                    badge.tone === "occupied"
                                    ? "bg-primary"
                                    : "bg-steel-gray",
                            )}
                        />
                        {badge.label}
                    </span>
                    {seats != null ? (
                        <p className="mt-1.5 text-[12px] text-slate-gray">
                            {seats} seats
                        </p>
                    ) : null}
                </div>
            </div>

            {waiter || total || note ? (
                <div className="mt-3 space-y-2.5 border-t border-hairline pt-3">
                    {waiter ? (
                        <div className="flex items-center gap-1.5 text-[13px]">
                            <User className="size-3.5 shrink-0 text-primary" />
                            <span className="truncate font-medium">
                                Waiter: {waiter}
                            </span>
                        </div>
                    ) : note ? (
                        <p className="text-[13px] text-slate-gray">{note}</p>
                    ) : null}
                    {total ? (
                        <div
                            className={cn(
                                "flex items-center justify-between",
                                waiter && "border-t border-hairline pt-2.5",
                            )}
                        >
                            <span className="text-[12px] text-slate-gray">
                                Running tab
                            </span>
                            <span className="text-[14px] font-semibold">
                                {total}
                            </span>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {extraStatus ? (
                <p className="mt-2 text-[12px] font-medium text-primary">
                    {extraStatus}
                </p>
            ) : null}

            <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2.5 text-[12px]">
                <span className="text-slate-gray">{footerLeft}</span>
                <span className="font-medium text-primary group-hover:underline">
                    {footerAction}
                </span>
            </div>
        </button>
    );
}
