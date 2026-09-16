"use client";

import {
    BellRing,
    ChefHat,
    Receipt,
    Sparkles,
    User,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type FloorCardTone =
    | "free"
    | "mine"
    | "other"
    | "occupied"
    | "available";

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
    const tCommon = useTranslations("common");
    const tWaiter = useTranslations("waiter");
    const isMine = badge.tone === "mine" || badge.tone === "occupied";
    const isFree = badge.tone === "free" || badge.tone === "available";

    // Determine status badge tone
    const isReady = footerLeft.toLowerCase().includes("ready");
    const isCooking = footerLeft.toLowerCase().includes("cooking");
    const isBillReq = footerLeft.toLowerCase().includes("bill");

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group relative flex w-full flex-col justify-between overflow-hidden rounded-[20px] border p-4.5 text-left transition-all duration-200 hover:scale-[1.015] hover:shadow-md",
                isMine
                    ? "border-brand/40 bg-brand/[0.025] ring-1 ring-brand/15 hover:border-brand shadow-xs"
                    : isFree
                      ? "border-hairline bg-card hover:border-emerald-500/40 hover:shadow-subtle"
                      : "border-hairline bg-card/70 opacity-80 hover:opacity-100 hover:border-border",
            )}
        >
            {/* TOP ROW: TABLE NUMBER & BADGE */}
            <div>
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <span className="text-[11px] font-medium tracking-wider text-slate-gray uppercase">
                            {tCommon("table")}
                        </span>
                        <h3 className="text-[20px] font-semibold leading-none text-foreground transition-colors group-hover:text-brand">
                            {tableNumber}
                        </h3>
                        {location ? (
                            <p className="mt-1 text-[12px] font-medium text-slate-gray">
                                {location}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight",
                                isMine
                                    ? "border-brand/30 bg-brand/10 text-brand"
                                    : isFree
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : "border-hairline bg-secondary text-slate-gray",
                            )}
                        >
                            <span
                                className={cn(
                                    "size-1.5 rounded-full",
                                    isMine
                                        ? "bg-brand animate-pulse"
                                        : isFree
                                          ? "bg-emerald-500"
                                          : "bg-slate-gray",
                                )}
                            />
                            {badge.label}
                        </span>

                        {seats != null ? (
                            <div className="flex items-center gap-1 text-[11.5px] font-medium text-slate-gray">
                                <Users className="size-3" />
                                <span>
                                    {seats} {tWaiter("guests")}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* MIDDLE ROW: STATUS & KITCHEN PROGRESS */}
                <div className="mt-3.5 space-y-2 border-t border-hairline/60 pt-3">
                    {/* Server Info */}
                    {waiter ? (
                        <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
                            <div className="flex size-5 items-center justify-center rounded-full bg-brand/10 text-brand">
                                <User className="size-3" />
                            </div>
                            <span className="truncate">
                                {tWaiter("server")}:{" "}
                                <strong className="font-semibold">
                                    {waiter}
                                </strong>
                            </span>
                        </div>
                    ) : null}

                    {note ? (
                        <p className="text-[12px] text-slate-gray">{note}</p>
                    ) : null}

                    {/* Running tab */}
                    {total ? (
                        <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-2.5 py-1 text-[13px]">
                            <span className="text-[11.5px] font-medium text-slate-gray">
                                {tWaiter("runningTab")}
                            </span>
                            <span className="font-semibold text-foreground">
                                {total}
                            </span>
                        </div>
                    ) : null}

                    {extraStatus ? (
                        <p className="text-[12px] font-semibold text-brand">
                            {extraStatus}
                        </p>
                    ) : null}
                </div>
            </div>

            {/* BOTTOM ROW: KITCHEN STATUS & ACTION CTA */}
            <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-[12px]">
                <div className="flex items-center gap-1.5 font-medium">
                    {isReady ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <BellRing className="size-3 animate-bounce" />
                            <span>{footerLeft}</span>
                        </span>
                    ) : isCooking ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <ChefHat className="size-3" />
                            <span>{footerLeft}</span>
                        </span>
                    ) : isBillReq ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                            <Receipt className="size-3" />
                            <span>{footerLeft}</span>
                        </span>
                    ) : isFree ? (
                        <span className="inline-flex items-center gap-1 text-slate-gray">
                            <Sparkles className="size-3 text-emerald-500/70" />
                            <span>{tWaiter("available")}</span>
                        </span>
                    ) : (
                        <span className="text-slate-gray">{footerLeft}</span>
                    )}
                </div>

                <span
                    className={cn(
                        "inline-flex items-center gap-1 font-medium transition-all group-hover:translate-x-0.5",
                        isMine
                            ? "text-brand"
                            : isFree
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground",
                    )}
                >
                    <span>{footerAction}</span>
                </span>
            </div>
        </button>
    );
}
