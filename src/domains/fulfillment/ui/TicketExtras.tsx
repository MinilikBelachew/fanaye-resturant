"use client";

import { classifyModifiers } from "@/domains/catalog/domain/modifiers";
import type { SelectedModifier } from "@/domains/catalog/domain/modifiers";
import { cn } from "@/lib/utils";

export default function TicketExtras({
    modifiers = [],
    instruction,
    compact = false,
    overlay = false,
}: {
    modifiers?: SelectedModifier[];
    instruction?: string;
    compact?: boolean;
    overlay?: boolean;
}) {
    const { held, extras } = classifyModifiers(modifiers);
    if (held.length === 0 && extras.length === 0 && !instruction?.trim()) {
        return null;
    }

    return (
        <div className={cn("space-y-2", compact ? "mt-3" : "mt-4")}>
            {held.length > 0 ? (
                <div>
                    <p
                        className={cn(
                            "mb-1 text-[11px] font-medium tracking-[0.08em] uppercase",
                            overlay ? "text-white/60" : "text-steel-gray",
                        )}
                    >
                        Hold / excluded
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {held.map(entry => (
                            <span
                                key={`${entry.groupId}:${entry.optionId}`}
                                className={cn(
                                    "rounded-full px-2.5 py-1 text-[12px] font-medium",
                                    overlay
                                        ? "bg-white/15 text-white backdrop-blur-sm"
                                        : "bg-destructive/10 text-destructive",
                                )}
                            >
                                {entry.name}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}
            {extras.length > 0 ? (
                <div>
                    <p
                        className={cn(
                            "mb-1 text-[11px] font-medium tracking-[0.08em] uppercase",
                            overlay ? "text-white/60" : "text-steel-gray",
                        )}
                    >
                        Extra
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {extras.map(entry => (
                            <span
                                key={`${entry.groupId}:${entry.optionId}`}
                                className={cn(
                                    "rounded-full px-2.5 py-1 text-[12px] font-medium",
                                    overlay
                                        ? "bg-white/15 text-white backdrop-blur-sm"
                                        : "bg-accent text-accent-foreground",
                                )}
                            >
                                {entry.name}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}
            {instruction?.trim() ? (
                <div
                    className={cn(
                        "rounded-lg px-2.5 py-2",
                        overlay
                            ? "bg-amber-400/25 ring-1 ring-amber-200/40"
                            : "bg-amber-50 ring-1 ring-amber-200/70 dark:bg-amber-950/40 dark:ring-amber-700/50",
                    )}
                >
                    <p
                        className={cn(
                            "text-[11px] font-semibold tracking-[0.06em] uppercase",
                            overlay
                                ? "text-amber-100/80"
                                : "text-amber-800/80 dark:text-amber-200/80",
                        )}
                    >
                        Note
                    </p>
                    <p
                        className={cn(
                            "mt-0.5 text-[13px] font-medium leading-snug",
                            overlay
                                ? "text-amber-50"
                                : "text-amber-950 dark:text-amber-100",
                        )}
                    >
                        {instruction.trim()}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
