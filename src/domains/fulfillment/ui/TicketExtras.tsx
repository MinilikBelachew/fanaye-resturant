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
                <p
                    className={cn(
                        "text-[13px]",
                        overlay ? "text-white/85" : "text-ink-charcoal",
                    )}
                >
                    Note: {instruction.trim()}
                </p>
            ) : null}
        </div>
    );
}
