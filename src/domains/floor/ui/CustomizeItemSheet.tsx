"use client";

import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MenuItem } from "@/domains/catalog/domain/menu";
import { unitPriceFor } from "@/domains/catalog/domain/menu";
import {
    modifiersComplete,
    optionChecked,
    toggleModifier,
    type SelectedModifier,
} from "@/domains/catalog/domain/modifiers";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

export default function CustomizeItemSheet({
    item,
    quantity,
    instruction,
    modifiers,
    onQuantityChange,
    onInstructionChange,
    onModifiersChange,
    onDone,
    onCancel,
}: {
    item: MenuItem;
    quantity: number;
    instruction: string;
    modifiers: SelectedModifier[];
    onQuantityChange: (quantity: number) => void;
    onInstructionChange: (instruction: string) => void;
    onModifiersChange: (modifiers: SelectedModifier[]) => void;
    onDone: () => void;
    onCancel: () => void;
}) {
    const complete = modifiersComplete(item.modifierGroups, modifiers);
    const price = unitPriceFor(item, modifiers) * quantity;

    return (
        <div className="absolute inset-0 z-10 flex flex-col bg-card">
            <div className="flex shrink-0 items-center justify-between border-b border-hairline px-5 py-4">
                <div>
                    <p className="text-[12px] tracking-[0.08em] text-steel-gray uppercase">
                        Options
                    </p>
                    <h2 className="text-[20px] font-semibold">{item.name}</h2>
                </div>
                <button
                    type="button"
                    className="text-[14px] font-medium text-slate-gray"
                    onClick={onCancel}
                >
                    Back
                </button>
            </div>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-muted/40 p-5">
                {item.modifierGroups.map(group => (
                    <section key={group.id}>
                        <p className="mb-2 text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                            {group.name}
                            {group.kind === "included"
                                ? " · uncheck to hold"
                                : null}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {group.options.map(option => {
                                const checked = optionChecked(
                                    group,
                                    option,
                                    modifiers,
                                );
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() =>
                                            onModifiersChange(
                                                toggleModifier(
                                                    group,
                                                    option,
                                                    modifiers,
                                                ),
                                            )
                                        }
                                        className={cn(
                                            "flex items-center gap-2 rounded-[48px] border px-3 py-2 text-[14px]",
                                            checked
                                                ? "border-transparent bg-accent text-accent-foreground"
                                                : "border-hairline bg-card",
                                        )}
                                    >
                                        {group.kind !== "choice" ? (
                                            <span
                                                className={cn(
                                                    "flex size-4 items-center justify-center rounded-[4px] border",
                                                    checked
                                                        ? "border-brand bg-brand text-white"
                                                        : "border-input bg-card",
                                                )}
                                            >
                                                {checked ? (
                                                    <Check className="size-3" />
                                                ) : null}
                                            </span>
                                        ) : null}
                                        <span>{option.name}</span>
                                        {option.priceDelta > 0 ? (
                                            <span className="text-[12px] opacity-80">
                                                +{formatEtb(option.priceDelta)}
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ))}
                <section>
                    <p className="mb-2 text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                        Special instruction
                    </p>
                    <Input
                        value={instruction}
                        placeholder="Well done, cut in 6…"
                        className="h-11 rounded-[16px] bg-card"
                        onChange={event =>
                            onInstructionChange(event.target.value)
                        }
                    />
                </section>
                <section className="flex items-center justify-between">
                    <p className="text-[14px] font-medium">Quantity</p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="flex size-9 items-center justify-center rounded-full border border-hairline"
                            onClick={() =>
                                onQuantityChange(Math.max(1, quantity - 1))
                            }
                            aria-label="Decrease quantity"
                        >
                            <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center text-[15px] font-medium">
                            {quantity}
                        </span>
                        <button
                            type="button"
                            className="flex size-9 items-center justify-center rounded-full border border-hairline"
                            onClick={() => onQuantityChange(quantity + 1)}
                            aria-label="Increase quantity"
                        >
                            <Plus className="size-4" />
                        </button>
                    </div>
                </section>
            </div>
            <div className="flex shrink-0 gap-3 border-t border-hairline bg-card p-4 sm:px-5">
                <Button
                    variant="outline"
                    className="h-11 flex-1"
                    onClick={onCancel}
                >
                    Back
                </Button>
                <Button
                    className="h-11 flex-[1.4]"
                    disabled={!complete}
                    onClick={onDone}
                >
                    Save · {formatEtb(price)}
                </Button>
            </div>
        </div>
    );
}
