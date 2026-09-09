"use client";

import { useMemo, useState } from "react";
import {
    ArrowLeft,
    ChefHat,
    Coffee,
    Minus,
    Plus,
    Receipt,
    Search,
    SlidersHorizontal,
    Trash2,
    UtensilsCrossed,
    X,
} from "lucide-react";
import {
    useConfirmOrderMutation,
    useWaiterMenuQuery,
} from "@/context/services/ordersApi";
import CustomizeItemSheet from "@/domains/floor/ui/CustomizeItemSheet";
import { unitPriceFor, type MenuItem } from "@/domains/catalog/domain/menu";
import {
    formatModifiers,
    modifiersComplete,
    type SelectedModifier,
} from "@/domains/catalog/domain/modifiers";
import { toCatalogMenuItem } from "@/domains/ordering/application/mapWaiterMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function needsOptions(item: MenuItem) {
    return item.modifierGroups.some(
        group => group.min > 0 || group.kind === "choice",
    );
}

export default function AddOrderMenu({
    tableSessionId,
    expectedVersion,
    tableLabel = "Table",
    onClose,
}: {
    tableSessionId: string;
    expectedVersion: number;
    tableLabel?: string;
    onClose: () => void;
}) {
    const { data, isLoading, isError } = useWaiterMenuQuery({
        tableSessionId,
    });
    const [confirmOrder, { isLoading: sending }] = useConfirmOrderMutation();
    const menuItems = useMemo(
        () => (data?.items ?? []).map(toCatalogMenuItem),
        [data],
    );

    const [lines, setLines] = useState<BasketLine[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<BasketLine | null>(null);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [mobileTicketOpen, setMobileTicketOpen] = useState(false);

    const editing = draft;
    const editingItem = editing
        ? menuItems.find(item => item.id === editing.menuItemId)
        : undefined;

    // Map counts of items in basket
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

    // Categories list
    const categories = useMemo(() => {
        const cats = data?.categories ?? [];
        return cats.slice().sort((a, b) => a.sortOrder - b.sortOrder);
    }, [data]);

    // Filtered items based on active category and search
    const filteredItems = useMemo(() => {
        let result = menuItems;

        if (selectedCategory !== "ALL") {
            result = result.filter(
                item =>
                    item.category.toLowerCase() ===
                    selectedCategory.toLowerCase(),
            );
        }

        const query = searchQuery.trim().toLowerCase();
        if (query) {
            result = result.filter(
                item =>
                    item.name.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.category.toLowerCase().includes(query),
            );
        }

        return result;
    }, [menuItems, selectedCategory, searchQuery]);

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
        if (customize || needsOptions(item)) {
            setDraft(line);
            setEditingId(line.id);
        }
    }

    function selectItem(item: MenuItem) {
        if (!item.available) return;
        const existing = lastLine(item.id);
        if (!existing) {
            addLine(item, needsOptions(item));
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
                line.id === existing.id ? { ...line, quantity: nextQty } : line,
            ),
        );
    }

    function changeLineQty(lineId: string, delta: number) {
        setLines(current => {
            const line = current.find(l => l.id === lineId);
            if (!line) return current;
            const nextQty = line.quantity + delta;
            if (nextQty <= 0) {
                return current.filter(l => l.id !== lineId);
            }
            return current.map(l =>
                l.id === lineId ? { ...l, quantity: nextQty } : l,
            );
        });
    }

    function removeLine(lineId: string) {
        setLines(current => current.filter(l => l.id !== lineId));
    }

    function saveDraft() {
        if (!draft || !editingId) return;
        setLines(current =>
            current.map(line => (line.id === editingId ? draft : line)),
        );
        setDraft(null);
        setEditingId(null);
    }

    async function commit() {
        setError("");
        const incomplete = lines.some(line => {
            const item = menuItems.find(entry => entry.id === line.menuItemId);
            return (
                !item || !modifiersComplete(item.modifierGroups, line.modifiers)
            );
        });
        if (incomplete) {
            setError("Finish options on each dish before sending.");
            return;
        }
        try {
            await confirmOrder({
                tableSessionId,
                expectedTableSessionVersion: expectedVersion,
                items: lines.map(line => ({
                    menuItemId: line.menuItemId,
                    quantity: line.quantity,
                    modifierOptionIds: line.modifiers.map(
                        entry => entry.optionId,
                    ),
                    specialInstruction: line.instruction.trim() || undefined,
                })),
            }).unwrap();
            onClose();
        } catch (err) {
            setError(orderError(err));
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground animate-in fade-in duration-150">
            {/* 1. TOP NAVIGATION & HEADER (International POS Standard) */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-hairline bg-card/95 px-4 backdrop-blur-md sm:px-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-9 gap-1.5 rounded-full px-3 text-[13px] font-semibold text-slate-gray hover:bg-secondary hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span className="hidden sm:inline">Back to Table</span>
                    </Button>
                    <div className="h-5 w-px bg-hairline" />
                    <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold tracking-tight text-foreground">
                            {tableLabel}
                        </span>
                        <span className="hidden items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold text-brand uppercase sm:inline-flex">
                            Take Order
                        </span>
                        {data?.activePeriod ? (
                            <span className="hidden rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-slate-gray md:inline-flex">
                                {data.activePeriod.name}
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* Instant Search Bar */}
                <div className="relative mx-2 w-full max-w-xs sm:max-w-sm md:max-w-md">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-gray" />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search dishes, drinks, codes…"
                        className="h-9 w-full rounded-full border-transparent bg-secondary/70 pr-8 pl-9 text-[13px] placeholder:text-slate-gray/70 focus:border-brand/40 focus:bg-card"
                    />
                    {searchQuery ? (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-slate-gray hover:text-foreground"
                        >
                            <X className="size-3.5" />
                        </button>
                    ) : null}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                    {/* Mobile ticket toggle button */}
                    <button
                        type="button"
                        onClick={() => setMobileTicketOpen(true)}
                        className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-deep md:hidden"
                    >
                        <Receipt className="size-3.5" />
                        <span>{pieceCount}</span>
                    </button>

                    <button
                        type="button"
                        aria-label="Close"
                        className="flex size-9 items-center justify-center rounded-full border border-hairline bg-card text-slate-gray transition-colors hover:bg-accent hover:text-foreground"
                        onClick={onClose}
                    >
                        <X className="size-5" />
                    </button>
                </div>
            </header>

            {/* 2. CATEGORY FILTER TABS */}
            <nav className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-hairline bg-card/60 px-4 py-2.5 backdrop-blur-sm sm:px-6 sidebar-scroll">
                <button
                    type="button"
                    onClick={() => setSelectedCategory("ALL")}
                    className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all duration-150",
                        selectedCategory === "ALL"
                            ? "bg-brand text-white shadow-sm"
                            : "border border-hairline bg-card text-slate-gray hover:bg-secondary hover:text-foreground",
                    )}
                >
                    <span>All Items</span>
                    <span
                        className={cn(
                            "rounded-full px-1.5 py-0.2 text-[11px] font-bold",
                            selectedCategory === "ALL"
                                ? "bg-white/25 text-white"
                                : "bg-secondary text-slate-gray",
                        )}
                    >
                        {menuItems.length}
                    </span>
                </button>

                {categories.map(cat => {
                    const count = menuItems.filter(
                        item =>
                            item.category.toLowerCase() ===
                            cat.name.toLowerCase(),
                    ).length;
                    const isActive =
                        selectedCategory.toLowerCase() ===
                        cat.name.toLowerCase();
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.name)}
                            className={cn(
                                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all duration-150",
                                isActive
                                    ? "bg-brand text-white shadow-sm"
                                    : "border border-hairline bg-card text-slate-gray hover:bg-secondary hover:text-foreground",
                            )}
                        >
                            <span>{cat.name}</span>
                            <span
                                className={cn(
                                    "rounded-full px-1.5 py-0.2 text-[11px] font-bold",
                                    isActive
                                        ? "bg-white/25 text-white"
                                        : "bg-secondary text-slate-gray",
                                )}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* 3. SPLIT WORKSPACE: CATALOG (LEFT) & LIVE ORDER TICKET (RIGHT) */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* LEFT: PRODUCT CATALOG GRID */}
                <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-6 md:pb-6 sidebar-scroll">
                    {isLoading ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-gray">
                            <ChefHat className="size-8 animate-bounce text-brand" />
                            <p className="text-[14px] font-medium">
                                Loading restaurant catalog…
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-3 text-destructive">
                            <p className="font-semibold">
                                Could not load the menu for this table.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </Button>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-slate-gray">
                            <UtensilsCrossed className="size-8 opacity-40" />
                            <p className="text-[15px] font-medium text-foreground">
                                No dishes found
                            </p>
                            <p className="text-[13px]">
                                Try clearing your search or switching
                                categories.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {filteredItems.map(item => {
                                const count = counts.get(item.id) ?? 0;
                                const hasCustom =
                                    item.modifierGroups.length > 0;
                                const inTicket = count > 0;

                                return (
                                    <article
                                        key={item.id}
                                        className={cn(
                                            "group relative flex flex-col justify-between overflow-hidden rounded-[20px] border bg-card transition-all duration-200",
                                            !item.available
                                                ? "border-hairline opacity-60 grayscale select-none"
                                                : inTicket
                                                  ? "border-brand/60 shadow-md ring-2 ring-brand/20 bg-brand/[0.015]"
                                                  : "border-hairline hover:border-brand/40 hover:shadow-subtle",
                                        )}
                                    >
                                        {/* DISH IMAGE HEADER (16:10 Aspect Ratio) */}
                                        <div
                                            className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-muted/40"
                                            onClick={() => selectItem(item)}
                                        >
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={e => {
                                                        // Hide broken image link and let fallback show
                                                        (
                                                            e.currentTarget as HTMLElement
                                                        ).style.display =
                                                            "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-secondary/60 to-accent/40 text-slate-gray">
                                                    {item.category
                                                        .toLowerCase()
                                                        .includes("barista") ||
                                                    item.category
                                                        .toLowerCase()
                                                        .includes("drink") ? (
                                                        <Coffee className="size-8 opacity-60" />
                                                    ) : (
                                                        <UtensilsCrossed className="size-8 opacity-60" />
                                                    )}
                                                    <span className="mt-1 text-[11px] font-medium tracking-wide uppercase opacity-70">
                                                        {item.category}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Station badge pill */}
                                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white/95 backdrop-blur-md">
                                                <span>{item.category}</span>
                                            </div>

                                            {/* In-order count badge on image */}
                                            {inTicket ? (
                                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                                                    <span>
                                                        {count} in order
                                                    </span>
                                                </div>
                                            ) : null}

                                            {/* 86'd Overlay */}
                                            {!item.available ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-bold text-destructive backdrop-blur-[2px]">
                                                    <span className="rounded-full bg-destructive/20 px-3 py-1 text-xs tracking-wider uppercase text-white">
                                                        Sold Out
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* DISH BODY */}
                                        <div className="flex flex-1 flex-col justify-between p-4">
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => selectItem(item)}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="text-[14.5px] font-semibold text-foreground transition-colors group-hover:text-brand">
                                                        {item.name}
                                                    </h3>
                                                </div>
                                                <p className="mt-1 line-clamp-2 min-h-[32px] text-[12px] leading-relaxed text-slate-gray">
                                                    {item.description || (
                                                        <span className="italic opacity-50">
                                                            Freshly prepared to
                                                            order
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* PRICE & ACTIONS ROW */}
                                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-hairline/60 pt-2.5">
                                                <div>
                                                    <span className="text-[14px] font-semibold text-foreground">
                                                        {formatEtb(item.price)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    {/* Options / Modifiers trigger */}
                                                    {hasCustom &&
                                                    item.available ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openCustomize(
                                                                    item,
                                                                )
                                                            }
                                                            className="flex size-8 items-center justify-center rounded-full border border-hairline bg-secondary/50 text-slate-gray transition-colors hover:bg-accent hover:text-foreground"
                                                            title="Dish Options & Customizations"
                                                        >
                                                            <SlidersHorizontal className="size-3.5" />
                                                        </button>
                                                    ) : null}

                                                    {/* Stepper if in basket, otherwise Add button */}
                                                    {inTicket &&
                                                    item.available ? (
                                                        <div className="flex items-center gap-1 rounded-full border border-brand/30 bg-card p-0.5 shadow-xs">
                                                            <button
                                                                type="button"
                                                                className="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
                                                                onClick={() =>
                                                                    changeQty(
                                                                        item.id,
                                                                        -1,
                                                                    )
                                                                }
                                                                aria-label="Decrease"
                                                            >
                                                                <Minus className="size-3.5" />
                                                            </button>
                                                            <span className="w-5 text-center text-[13px] font-bold text-foreground">
                                                                {count}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
                                                                onClick={() =>
                                                                    changeQty(
                                                                        item.id,
                                                                        1,
                                                                    )
                                                                }
                                                                aria-label="Increase"
                                                            >
                                                                <Plus className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : item.available ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                selectItem(item)
                                                            }
                                                            className="flex h-8 items-center gap-1 rounded-full bg-brand/10 px-3 text-[13px] font-semibold text-brand transition-all hover:bg-brand hover:text-white"
                                                        >
                                                            <Plus className="size-3.5" />
                                                            <span>Add</span>
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* RIGHT: DESKTOP LIVE ORDER TICKET (Toast / Square POS Style) */}
                <aside className="hidden h-full w-[380px] shrink-0 flex-col border-l border-hairline bg-card shadow-subtle lg:w-[410px] md:flex">
                    <OrderTicketContent
                        tableLabel={tableLabel}
                        lines={lines}
                        menuItems={menuItems}
                        pieceCount={pieceCount}
                        basketTotal={basketTotal}
                        sending={sending}
                        error={error}
                        onChangeQty={changeLineQty}
                        onRemoveLine={removeLine}
                        onClearAll={() => setLines([])}
                        onEditLine={line => {
                            setDraft({ ...line });
                            setEditingId(line.id);
                        }}
                        onSubmit={commit}
                    />
                </aside>
            </div>

            {/* 4. MOBILE SLIDE-UP TICKET DRAWER & FLOATING BAR */}
            {lines.length > 0 && !mobileTicketOpen ? (
                <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-hairline bg-card/95 p-3 backdrop-blur-md md:hidden">
                    <Button
                        className="h-12 w-full justify-between rounded-[16px] bg-brand px-4 text-[14px] font-bold text-white shadow-md hover:bg-brand-deep"
                        onClick={() => setMobileTicketOpen(true)}
                    >
                        <span className="flex items-center gap-2">
                            <Receipt className="size-4" />
                            <span>
                                {pieceCount}{" "}
                                {pieceCount === 1 ? "dish" : "dishes"}
                            </span>
                        </span>
                        <span>Review Order · {formatEtb(basketTotal)} →</span>
                    </Button>
                </div>
            ) : null}

            {mobileTicketOpen ? (
                <div
                    className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 md:hidden"
                    onClick={() => setMobileTicketOpen(false)}
                >
                    <div
                        className="flex max-h-[85svh] w-full flex-col overflow-hidden rounded-t-[24px] bg-card"
                        onClick={e => e.stopPropagation()}
                    >
                        <OrderTicketContent
                            tableLabel={tableLabel}
                            lines={lines}
                            menuItems={menuItems}
                            pieceCount={pieceCount}
                            basketTotal={basketTotal}
                            sending={sending}
                            error={error}
                            onChangeQty={changeLineQty}
                            onRemoveLine={removeLine}
                            onClearAll={() => {
                                setLines([]);
                                setMobileTicketOpen(false);
                            }}
                            onEditLine={line => {
                                setDraft({ ...line });
                                setEditingId(line.id);
                                setMobileTicketOpen(false);
                            }}
                            onCloseMobile={() => setMobileTicketOpen(false)}
                            onSubmit={commit}
                        />
                    </div>
                </div>
            ) : null}

            {/* 5. CUSTOMIZE MODIFIER SHEET (MODAL / OVERLAY) */}
            {editing && editingItem ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 animate-in fade-in duration-150">
                    <div className="relative mx-auto flex h-[min(90svh,700px)] w-full max-w-xl flex-col overflow-hidden rounded-[24px] bg-card shadow-2xl">
                        <CustomizeItemSheet
                            item={editingItem}
                            quantity={editing.quantity}
                            instruction={editing.instruction}
                            modifiers={editing.modifiers}
                            onQuantityChange={quantity =>
                                setDraft(current =>
                                    current
                                        ? { ...current, quantity }
                                        : current,
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
                                    current
                                        ? { ...current, modifiers }
                                        : current,
                                )
                            }
                            onDone={saveDraft}
                            onCancel={() => {
                                setDraft(null);
                                setEditingId(null);
                            }}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

/**
 * Reusable Ticket Content Component (shared by Desktop Sidebar and Mobile Drawer)
 */
function OrderTicketContent({
    tableLabel,
    lines,
    menuItems,
    pieceCount,
    basketTotal,
    sending,
    error,
    onChangeQty,
    onRemoveLine,
    onClearAll,
    onEditLine,
    onCloseMobile,
    onSubmit,
}: {
    tableLabel: string;
    lines: BasketLine[];
    menuItems: MenuItem[];
    pieceCount: number;
    basketTotal: number;
    sending: boolean;
    error: string;
    onChangeQty: (lineId: string, delta: number) => void;
    onRemoveLine: (lineId: string) => void;
    onClearAll: () => void;
    onEditLine: (line: BasketLine) => void;
    onCloseMobile?: () => void;
    onSubmit: () => void;
}) {
    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-secondary/30 px-5 py-3.5">
                <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-brand" />
                    <h3 className="text-[14px] font-semibold text-foreground">
                        {tableLabel} Ticket
                    </h3>
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                        {pieceCount} {pieceCount === 1 ? "dish" : "dishes"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {lines.length > 0 ? (
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="text-[12px] font-medium text-slate-gray hover:text-destructive"
                        >
                            Clear
                        </button>
                    ) : null}
                    {onCloseMobile ? (
                        <button
                            type="button"
                            onClick={onCloseMobile}
                            className="p-1 text-slate-gray hover:text-foreground md:hidden"
                        >
                            <X className="size-5" />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Ticket line items list */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3 sidebar-scroll">
                {lines.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center text-slate-gray">
                        <div className="flex size-14 items-center justify-center rounded-full bg-secondary/60">
                            <Receipt className="size-6 text-slate-gray/60" />
                        </div>
                        <p className="text-[15px] font-semibold text-foreground">
                            Ticket is empty
                        </p>
                        <p className="text-[13px] leading-relaxed text-slate-gray">
                            Tap dishes from the catalog to build this
                            table&apos;s order.
                        </p>
                    </div>
                ) : (
                    lines.map(line => {
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
                        const linePrice =
                            unitPriceFor(item, line.modifiers) * line.quantity;

                        return (
                            <div
                                key={line.id}
                                className="relative flex flex-col justify-between gap-2 rounded-[16px] border border-hairline bg-background p-3.5 shadow-xs transition-colors hover:border-brand/30"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-[13.5px] font-medium text-foreground">
                                            {item.name}
                                        </h4>
                                        {extras ? (
                                            <p className="mt-0.5 text-[11.5px] text-slate-gray">
                                                {extras}
                                            </p>
                                        ) : null}
                                    </div>
                                    <span className="text-[13.5px] font-semibold text-foreground shrink-0">
                                        {formatEtb(linePrice)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    {/* Stepper */}
                                    <div className="flex items-center gap-1 rounded-full border border-hairline bg-secondary/40 px-1 py-0.5">
                                        <button
                                            type="button"
                                            className="flex size-6 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
                                            onClick={() =>
                                                onChangeQty(line.id, -1)
                                            }
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus className="size-3" />
                                        </button>
                                        <span className="w-5 text-center text-[12px] font-medium text-foreground">
                                            {line.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            className="flex size-6 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
                                            onClick={() =>
                                                onChangeQty(line.id, 1)
                                            }
                                            aria-label="Increase quantity"
                                        >
                                            <Plus className="size-3" />
                                        </button>
                                    </div>

                                    {/* Options & Remove */}
                                    <div className="flex items-center gap-2">
                                        {item.modifierGroups.length > 0 ? (
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
                                                onClick={() => onEditLine(line)}
                                            >
                                                <SlidersHorizontal className="size-3" />
                                                <span>Options</span>
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onRemoveLine(line.id)
                                            }
                                            className="rounded-md p-1 text-slate-gray transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            aria-label="Remove item"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Summary & Send to Kitchen Button */}
            <div className="shrink-0 border-t border-hairline bg-secondary/20 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-[13px] text-slate-gray">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">
                        {formatEtb(basketTotal)}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[14.5px] font-semibold text-foreground">
                    <span>Total Due</span>
                    <span>{formatEtb(basketTotal)}</span>
                </div>

                {error ? (
                    <p className="rounded-lg bg-destructive/10 px-3 py-1.5 text-[12.5px] font-medium text-destructive">
                        {error}
                    </p>
                ) : null}

                <Button
                    className="h-11 w-full rounded-[14px] bg-brand text-[13.5px] font-medium text-white shadow-xs hover:bg-brand-deep disabled:opacity-50"
                    disabled={lines.length === 0 || sending}
                    onClick={onSubmit}
                >
                    {sending
                        ? "Sending to kitchen…"
                        : pieceCount === 0
                          ? "Send Order"
                          : `Send to Kitchen · ${pieceCount} · ${formatEtb(basketTotal)}`}
                </Button>
            </div>
        </div>
    );
}

function orderError(error: unknown) {
    if (error && typeof error === "object" && "data" in error) {
        const data = (
            error as {
                data?: {
                    code?: string;
                    errors?: { version?: string; session?: string };
                };
            }
        ).data;
        if (data?.errors?.version === "stale") {
            return "This table changed. Close the menu and try again.";
        }
        if (data?.code === "MENU_ITEM_SOLD_OUT") {
            return "One dish is sold out.";
        }
        if (data?.code === "REQUIRED_MODIFIER_MISSING") {
            return "Finish options on each dish before sending.";
        }
        if (data?.code === "MENU_ITEM_STATION_MISSING") {
            return "That dish has no station. Ask a manager.";
        }
        if (data?.code === "SESSION_NOT_ORDERABLE") {
            return "This visit is already on the bill.";
        }
        if (data?.code === "SHIFT_REQUIRED") {
            return "Clock in before sending an order.";
        }
    }
    return "Could not send that order.";
}
