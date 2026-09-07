"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus, SlidersHorizontal, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { addDraftItem, confirmOrder } from "@/context/slices/opsSlice";
import CustomizeItemSheet from "@/domains/floor/ui/CustomizeItemSheet";
import {
    unitPriceFor,
    type MenuItem,
} from "@/domains/catalog/domain/menu";
import {
    formatModifiers,
    type SelectedModifier,
} from "@/domains/catalog/domain/modifiers";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Button } from "@/components/ui/button";
import { createId } from "@/lib/ids";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

type BasketLine = {
    id: string;
    menuItemId: string;
    quantity: number;
    instruction: string;
    modifiers: SelectedModifier[];
};

function emptyLine(item: MenuItem): BasketLine {
    return {
        id: createId("line"),
        menuItemId: item.id,
        quantity: 1,
        instruction: "",
        modifiers: [],
    };
}

const CATEGORY_ORDER = [
    "Kitchen",
    "Barista",
    "Cakes",
    "Soft Drinks",
] as const;

export default function AddOrderMenu({
    sessionId,
    onClose,
    pendingDraftCount = 0,
}: {
    sessionId: string;
    onClose: () => void;
    pendingDraftCount?: number;
}) {
    const dispatch = useAppDispatch();
    const staff = useAppSelector(selectCurrentStaff);
    const menuItems = useAppSelector(state => state.menu.items);
    const [lines, setLines] = useState<BasketLine[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<BasketLine | null>(null);

    const editing = draft;
    const editingItem = editing
        ? menuItems.find(item => item.id === editing.menuItemId)
        : undefined;

    const counts = useMemo(() => {
        const map = new Map<string, number>();
        for (const line of lines) {
            map.set(
                line.menuItemId,
                (map.get(line.menuItemId) ?? 0) + line.quantity,
            );
        }
        return map;
    }, [lines]);

    const sections = useMemo(() => {
        const categories = Array.from(
            new Set([
                ...CATEGORY_ORDER,
                ...menuItems.map(i => i.category),
            ]),
        );
        return categories
            .map(title => ({
                title,
                items: menuItems.filter(item => item.category === title),
            }))
            .filter(section => section.items.length > 0);
    }, [menuItems]);

    const pieceCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const basketTotal = lines.reduce((sum, line) => {
        const item = menuItems.find(entry => entry.id === line.menuItemId);
        if (!item) return sum;
        return sum + unitPriceFor(item, line.modifiers) * line.quantity;
    }, 0);

    function lastLine(menuItemId: string) {
        return [...lines]
            .reverse()
            .find(line => line.menuItemId === menuItemId);
    }

    function addLine(item: MenuItem, customize = false) {
        const line = emptyLine(item);
        setLines(current => [...current, line]);
        if (customize && item.modifierGroups.length > 0) {
            setDraft(line);
            setEditingId(line.id);
        }
    }

    function selectItem(item: MenuItem) {
        if (!item.available) return;
        const existing = lastLine(item.id);
        if (!existing) {
            addLine(item);
            return;
        }
        if (item.modifierGroups.length > 0) {
            setDraft({ ...existing });
            setEditingId(existing.id);
            return;
        }
        setLines(current =>
            current.map(line =>
                line.id === existing.id
                    ? { ...line, quantity: line.quantity + 1 }
                    : line,
            ),
        );
    }

    function openCustomize(item: MenuItem) {
        if (!item.available) return;
        const existing = lastLine(item.id);
        if (!existing) {
            addLine(item, true);
            return;
        }
        setDraft({ ...existing });
        setEditingId(existing.id);
    }

    function changeQty(menuItemId: string, delta: number) {
        const existing = lastLine(menuItemId);
        if (!existing && delta > 0) {
            const item = menuItems.find(entry => entry.id === menuItemId);
            if (item) addLine(item);
            return;
        }
        if (!existing) return;
        const nextQty = existing.quantity + delta;
        if (nextQty <= 0) {
            setLines(current =>
                current.filter(line => line.id !== existing.id),
            );
            return;
        }
        setLines(current =>
            current.map(line =>
                line.id === existing.id
                    ? { ...line, quantity: nextQty }
                    : line,
            ),
        );
    }

    function saveDraft() {
        if (!draft || !editingId) return;
        setLines(current =>
            current.map(line => (line.id === editingId ? draft : line)),
        );
        setDraft(null);
        setEditingId(null);
    }

    function commit() {
        if (!staff) return;
        for (const line of lines) {
            const item = menuItems.find(entry => entry.id === line.menuItemId);
            dispatch(
                addDraftItem({
                    sessionId,
                    menuItemId: line.menuItemId,
                    quantity: line.quantity,
                    instruction: line.instruction,
                    modifiers: line.modifiers,
                    itemSnapshot: item,
                }),
            );
        }
        dispatch(
            confirmOrder({
                sessionId,
                waiterId: staff.id,
            }),
        );
        onClose();
    }

    const canSend = lines.length > 0 || pendingDraftCount > 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6"
            onClick={onClose}
        >
            <div
                className="relative mx-auto flex h-[min(92svh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-[20px] bg-card shadow-subtle"
                onClick={event => event.stopPropagation()}
            >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline px-5 py-4">
                    <div>
                        <h2 className="text-[20px] font-semibold">Menu</h2>
                        <p className="mt-0.5 text-[13px] text-slate-gray">
                            Tap dishes to select. Use Options to hold toppings.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        className="flex size-9 items-center justify-center rounded-full border border-hairline bg-card text-slate-gray hover:bg-accent hover:text-foreground"
                        onClick={onClose}
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto p-5">
                    <div className="space-y-6">
                        {sections.map(section => (
                            <section key={section.title}>
                                <p className="mb-3 text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                                    {section.title}
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {section.items.map(item => {
                                        const count = counts.get(item.id) ?? 0;
                                        const hasCustom =
                                            item.modifierGroups.length > 0;
                                        return (
                                            <article
                                                key={item.id}
                                                className={cn(
                                                    "relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-[16px] border p-4 transition-colors",
                                                    !item.available
                                                        ? "opacity-60 grayscale border-hairline bg-secondary/50"
                                                        : count > 0
                                                          ? "border-brand bg-accent/40"
                                                          : "border-hairline bg-card hover:bg-secondary/40",
                                                )}
                                            >
                                                {item.image ? (
                                                    <div className="absolute top-3 right-3 size-12 overflow-hidden rounded-[12px] border border-hairline">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="size-full object-cover"
                                                        />
                                                    </div>
                                                ) : null}
                                                <div
                                                    className="cursor-pointer pr-14"
                                                    onClick={() =>
                                                        selectItem(item)
                                                    }
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-foreground">
                                                            {item.name}
                                                        </h3>
                                                        {!item.available ? (
                                                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                                                                86'd
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-1 line-clamp-2 text-[13px] text-slate-gray">
                                                        {item.description}
                                                    </p>
                                                </div>

                                                {item.available ? (
                                                    <div className="mt-4 flex items-center justify-between gap-2">
                                                        <span className="text-[15px] font-semibold text-foreground">
                                                            {formatEtb(
                                                                item.price,
                                                            )}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            {hasCustom ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openCustomize(
                                                                            item,
                                                                        )
                                                                    }
                                                                    className="flex size-8 items-center justify-center rounded-full border border-hairline bg-card text-slate-gray hover:text-foreground"
                                                                    title="Options"
                                                                >
                                                                    <SlidersHorizontal className="size-3.5" />
                                                                </button>
                                                            ) : null}
                                                            {count > 0 ? (
                                                                <div className="flex items-center gap-1 rounded-full border border-hairline bg-card p-0.5">
                                                                    <button
                                                                        type="button"
                                                                        className="flex size-7 items-center justify-center rounded-full hover:bg-secondary"
                                                                        onClick={() =>
                                                                            changeQty(
                                                                                item.id,
                                                                                -1,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Minus className="size-3.5" />
                                                                    </button>
                                                                    <span className="w-5 text-center text-[13px] font-medium">
                                                                        {count}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        className="flex size-7 items-center justify-center rounded-full hover:bg-secondary"
                                                                        onClick={() =>
                                                                            changeQty(
                                                                                item.id,
                                                                                1,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Plus className="size-3.5" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        selectItem(
                                                                            item,
                                                                        )
                                                                    }
                                                                    className="flex size-8 items-center justify-center rounded-full border border-hairline bg-card text-foreground hover:bg-accent"
                                                                >
                                                                    <Plus className="size-4 text-brand" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <span className="text-[13px] text-slate-gray">
                                                            Unavailable
                                                        </span>
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>

                {lines.length > 0 ? (
                    <div className="max-h-36 shrink-0 space-y-2 overflow-y-auto border-t border-hairline bg-card px-5 py-3">
                        <p className="text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                            This order
                        </p>
                        {lines.map(line => {
                            const item = menuItems.find(
                                entry => entry.id === line.menuItemId,
                            );
                            if (!item) return null;
                            const extras = [
                                formatModifiers(line.modifiers),
                                line.instruction.trim(),
                            ]
                                .filter(Boolean)
                                .join(" · ");
                            return (
                                <div
                                    key={line.id}
                                    className="flex items-start justify-between gap-3 text-[14px]"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium">
                                            {line.quantity}× {item.name}
                                        </p>
                                        {extras ? (
                                            <p className="text-[13px] text-slate-gray">
                                                {extras}
                                            </p>
                                        ) : item.modifierGroups.length > 0 ? (
                                            <button
                                                type="button"
                                                className="text-[13px] font-medium text-brand"
                                                onClick={() => {
                                                    setDraft({ ...line });
                                                    setEditingId(line.id);
                                                }}
                                            >
                                                Hold toppings or add extras
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="font-semibold">
                                            {formatEtb(
                                                unitPriceFor(
                                                    item,
                                                    line.modifiers,
                                                ) * line.quantity,
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            className="text-[12px] text-destructive hover:underline"
                                            onClick={() =>
                                                setLines(current =>
                                                    current.filter(
                                                        entry =>
                                                            entry.id !==
                                                            line.id,
                                                    ),
                                                )
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : null}

                <div className="flex shrink-0 items-center gap-3 border-t border-hairline bg-card p-4 sm:px-5">
                    <Button
                        variant="outline"
                        className="h-11 flex-1"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="h-11 flex-[1.4] bg-brand text-white hover:bg-brand-deep"
                        disabled={!canSend || !staff}
                        onClick={commit}
                    >
                        {pieceCount === 0
                            ? "Send order"
                            : `Send order · ${pieceCount} · ${formatEtb(basketTotal)}`}
                    </Button>
                </div>

                {editing && editingItem ? (
                    <CustomizeItemSheet
                        item={editingItem}
                        quantity={editing.quantity}
                        instruction={editing.instruction}
                        modifiers={editing.modifiers}
                        onQuantityChange={quantity =>
                            setDraft(current =>
                                current ? { ...current, quantity } : current,
                            )
                        }
                        onInstructionChange={instruction =>
                            setDraft(current =>
                                current
                                    ? { ...current, instruction }
                                    : current,
                            )
                        }
                        onModifiersChange={modifiers =>
                            setDraft(current =>
                                current ? { ...current, modifiers } : current,
                            )
                        }
                        onDone={saveDraft}
                        onCancel={() => {
                            setDraft(null);
                            setEditingId(null);
                        }}
                    />
                ) : null}
            </div>
        </div>
    );
}
