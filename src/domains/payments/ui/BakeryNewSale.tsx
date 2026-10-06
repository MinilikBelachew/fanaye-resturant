"use client";

import { useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
    Minus,
    Plus,
    Search,
    Croissant,
    CakeSlice,
    Clock3,
    FileDown,
    Loader2,
    Printer,
} from "lucide-react";
import { useWaiterMenuQuery } from "@/context/services/ordersApi";
import type { Bill } from "@/domains/billing/domain/billingApi";
import { API_BASE_URL } from "@/context/env";
import {
    filePublicUrl,
    IMAGE_KEY_TO_URL,
    imageForDish,
} from "@/domains/catalog/application/menuImages";
import type { WaiterMenuItem } from "@/domains/ordering/domain/waiterMenu";
import { formatEtb } from "@/lib/money";
import { exportElementToPdf } from "@/lib/pdfExport";
import { useAppSelector } from "@/context/hooks";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

function itemImage(item: WaiterMenuItem): string | undefined {
    return (
        filePublicUrl(item.imageUrl) ||
        (item.imageKey ? IMAGE_KEY_TO_URL[item.imageKey] : undefined) ||
        imageForDish(item.name)
    );
}

function ItemPhoto({ item }: { item: WaiterMenuItem }) {
    const src = itemImage(item);
    const sweet = /cake|pastry|cookie|dessert/i.test(item.name);
    if (src) {
        return <img src={src} alt="" className="size-full object-cover" />;
    }
    return (
        <div
            className={cn(
                "flex size-full items-center justify-center",
                sweet
                    ? "bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
            )}
        >
            {sweet ? (
                <CakeSlice className="size-8" />
            ) : (
                <Croissant className="size-8" />
            )}
        </div>
    );
}

export default function BakeryNewSale() {
    const session = useAppSelector(state => state.identity.session);
    const shiftSessionId = session?.shiftSessionId;
    const accessToken = useAppSelector(state => state.identity.accessToken);
    const branchName = session?.branchName || "Bakery";
    const cashierName = session?.displayName || "Cashier";
    const { data: menu, isLoading } = useWaiterMenuQuery({});
    const [creating, setCreating] = useState(false);
    const [paying, setPaying] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);
    const [qty, setQty] = useState<Record<string, number>>({});
    const [bill, setBill] = useState<Bill | null>(null);
    const [tendered, setTendered] = useState("");
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("ALL");

    const items = menu?.items ?? [];
    const EXCLUDED_STATION_CATEGORIES = useMemo(
        () =>
            new Set([
                "kitchen",
                "barista",
                "cakes",
                "soft drinks",
                "soft_drinks",
                "counter",
            ]),
        [],
    );
    const categories = useMemo(
        () =>
            (menu?.categories ?? [])
                .filter(
                    c =>
                        !EXCLUDED_STATION_CATEGORIES.has(
                            c.name.trim().toLowerCase(),
                        ),
                )
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder),
        [menu, EXCLUDED_STATION_CATEGORIES],
    );

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter(item => {
            if (categoryId !== "ALL" && item.categoryId !== categoryId) {
                return false;
            }
            if (!q) return true;
            return item.name.toLowerCase().includes(q);
        });
    }, [items, search, categoryId]);

    const cart = useMemo(
        () =>
            items
                .filter(item => (qty[item.id] ?? 0) > 0)
                .map(item => ({
                    menuItemId: item.id,
                    name: item.name,
                    quantity: qty[item.id] ?? 0,
                    unit: Number(item.price),
                })),
        [items, qty],
    );
    const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
    const cartTotal = cart.reduce(
        (sum, line) => sum + line.unit * line.quantity,
        0,
    );

    function bump(id: string, delta: number) {
        setQty(prev => {
            const next = Math.max(0, (prev[id] ?? 0) + delta);
            if (next === 0) {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            }
            return { ...prev, [id]: next };
        });
    }

    async function generate() {
        if (!shiftSessionId) {
            toast.error("Clock in before you sell.");
            return;
        }
        if (cart.length === 0) {
            toast.error("Tap items first.");
            return;
        }
        setCreating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/bills/counter-sale`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Idempotency-Key": crypto.randomUUID(),
                    ...(accessToken
                        ? { Authorization: `Bearer ${accessToken}` }
                        : {}),
                },
                body: JSON.stringify({
                    items: cart.map(line => ({
                        menuItemId: line.menuItemId,
                        quantity: line.quantity,
                    })),
                }),
            });
            if (!res.ok) {
                throw new Error("bill");
            }
            const created = (await res.json()) as Bill;
            setBill(created);
            setTendered(created.total);
        } catch {
            toast.error("Could not generate the bill.");
        } finally {
            setCreating(false);
        }
    }

    async function collect() {
        if (!bill) return;
        const due = Number(bill.total);
        const cash = Number(tendered);
        if (!Number.isFinite(cash) || cash < due) {
            toast.error("Tendered cash must cover the bill.");
            return;
        }
        setPaying(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/bills/${bill.billId}/payments/cash`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "Idempotency-Key": crypto.randomUUID(),
                        ...(accessToken
                            ? { Authorization: `Bearer ${accessToken}` }
                            : {}),
                    },
                    body: JSON.stringify({
                        amount: Number(bill.total).toFixed(2),
                        cashTendered: cash.toFixed(2),
                        expectedBillVersion: bill.version,
                    }),
                },
            );
            if (!res.ok) throw new Error("pay");
            toast.success("Paid. Give this bill to the counter.");
            setBill({
                ...bill,
                status: "PAID",
                paidAt: new Date().toISOString(),
            });
        } catch {
            toast.error("Payment failed.");
        } finally {
            setPaying(false);
        }
    }

    if (!shiftSessionId) {
        return (
            <div className="flex max-w-md items-start gap-3 rounded-2xl border border-hairline bg-card p-4">
                <Clock3 className="mt-0.5 size-5 text-slate-gray" />
                <div>
                    <p className="text-[14px] font-medium">Clock in first</p>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        New sale needs an open shift.
                    </p>
                    <Link
                        href="/cashier/shift"
                        className="mt-3 inline-flex h-9 items-center rounded-full bg-foreground px-4 text-[12px] font-medium text-background"
                    >
                        Go to Shift
                    </Link>
                </div>
            </div>
        );
    }

    if (bill) {
        const due = Number(bill.total);
        const cash = Number(tendered);
        const change = Number.isFinite(cash) && cash >= due ? cash - due : 0;
        const when = new Date(bill.generatedAt || Date.now());
        const whenLabel = when.toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        const itemCount = bill.lines.reduce(
            (sum, line) => sum + line.quantity,
            0,
        );

        async function handleExportPdf() {
            if (!receiptRef.current || !bill) return;
            setExportingPdf(true);
            try {
                await exportElementToPdf(receiptRef.current, {
                    filename: `bill-${bill.billNumber || "bakery"}.pdf`,
                    scale: 3,
                    orientation: "portrait",
                    isReceipt: true,
                });
            } finally {
                setExportingPdf(false);
            }
        }

        return (
            <div className="mx-auto w-full max-w-[22rem] space-y-3">
                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }
                        #bakery-bill-slip,
                        #bakery-bill-slip * {
                            visibility: visible !important;
                        }
                        #bakery-bill-slip {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 80mm !important;
                            margin: 0 !important;
                            border: none !important;
                            box-shadow: none !important;
                            border-radius: 0 !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>

                <div
                    id="bakery-bill-slip"
                    ref={receiptRef}
                    className="rounded-2xl border border-hairline bg-card px-5 py-5 font-mono text-[12px] text-foreground shadow-subtle"
                >
                    <div className="border-b border-dashed border-hairline pb-3 text-center">
                        <p className="font-sans text-[15px] font-semibold tracking-tight">
                            {branchName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-gray">
                            Counter sale
                        </p>
                    </div>

                    <div className="space-y-1 border-b border-dashed border-hairline py-3 text-[11px]">
                        <div className="flex justify-between gap-3">
                            <span className="text-slate-gray">Bill</span>
                            <span className="font-semibold">
                                {bill.billNumber}
                            </span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-slate-gray">Date</span>
                            <span>{whenLabel}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-slate-gray">Cashier</span>
                            <span className="truncate">{cashierName}</span>
                        </div>
                    </div>

                    <div className="border-b border-dashed border-hairline py-3">
                        <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-gray">
                            <span>Item</span>
                            <span>Amount</span>
                        </div>
                        <ul className="space-y-2">
                            {bill.lines.map(line => (
                                <li key={line.billLineId}>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="min-w-0 truncate font-medium">
                                            {line.quantity} × {line.itemName}
                                        </span>
                                        <span className="shrink-0 tabular-nums">
                                            {formatEtb(Number(line.lineTotal))}
                                        </span>
                                    </div>
                                    <p className="pl-3 text-[10px] text-slate-gray">
                                        @ {formatEtb(Number(line.unitPrice))}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-1.5 pt-3">
                        <div className="flex justify-between text-[11px] text-slate-gray">
                            <span>Items</span>
                            <span>{itemCount}</span>
                        </div>
                        <div className="flex justify-between text-[15px] font-semibold">
                            <span>TOTAL</span>
                            <span className="tabular-nums">
                                {formatEtb(due)}
                            </span>
                        </div>
                        {bill.status === "PAID" ? (
                            <>
                                <div className="flex justify-between text-[12px]">
                                    <span>Cash</span>
                                    <span className="tabular-nums">
                                        {formatEtb(
                                            Number.isFinite(cash) ? cash : due,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[12px]">
                                    <span>Change</span>
                                    <span className="tabular-nums">
                                        {formatEtb(change)}
                                    </span>
                                </div>
                                <p className="pt-2 text-center text-[11px] text-emerald-700 dark:text-emerald-300">
                                    PAID · show at counter
                                </p>
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="no-print grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        disabled={exportingPdf}
                        onClick={() => void handleExportPdf()}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-hairline bg-card text-[12px] font-medium disabled:opacity-50"
                    >
                        {exportingPdf ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <FileDown className="size-3.5" />
                        )}
                        {exportingPdf ? "PDF…" : "Export PDF"}
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-hairline bg-card text-[12px] font-medium"
                    >
                        <Printer className="size-3.5" />
                        Print
                    </button>
                </div>

                {bill.status === "PAID" ? null : (
                    <div className="no-print space-y-2 rounded-2xl border border-hairline bg-card p-4">
                        <label className="block text-[12px] text-slate-gray">
                            Cash tendered
                            <input
                                value={tendered}
                                onChange={e => setTendered(e.target.value)}
                                inputMode="decimal"
                                className="mt-1 h-11 w-full rounded-xl border border-hairline bg-background px-3 font-mono text-[16px]"
                            />
                        </label>
                        {change > 0 ? (
                            <p className="text-[13px] text-slate-gray">
                                Change{" "}
                                <span className="font-semibold text-foreground">
                                    {formatEtb(change)}
                                </span>
                            </p>
                        ) : null}
                        <button
                            type="button"
                            disabled={paying}
                            onClick={() => void collect()}
                            className="h-11 w-full rounded-full bg-foreground text-[14px] font-semibold text-background disabled:opacity-50"
                        >
                            {paying ? "Taking payment…" : "Collect cash"}
                        </button>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => {
                        setBill(null);
                        setQty({});
                        setSearch("");
                    }}
                    className="no-print h-10 w-full rounded-full border border-hairline text-[13px]"
                >
                    New sale
                </button>
            </div>
        );
    }

    return (
        <div className="pb-28">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-gray" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search bread, cake…"
                        className="h-10 w-full rounded-full border border-hairline bg-card pr-3 pl-9 text-[13px] outline-none focus-visible:border-foreground/30"
                    />
                </div>
                {categories.length > 1 ? (
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                        <button
                            type="button"
                            onClick={() => setCategoryId("ALL")}
                            className={cn(
                                "h-8 shrink-0 rounded-full border px-3 text-[12px] font-medium",
                                categoryId === "ALL"
                                    ? "border-transparent bg-foreground text-background"
                                    : "border-hairline bg-card text-slate-gray",
                            )}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategoryId(cat.id)}
                                className={cn(
                                    "h-8 shrink-0 rounded-full border px-3 text-[12px] font-medium",
                                    categoryId === cat.id
                                        ? "border-transparent bg-foreground text-background"
                                        : "border-hairline bg-card text-slate-gray",
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

            {isLoading ? (
                <p className="text-[13px] text-slate-gray">Loading menu…</p>
            ) : visible.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-hairline bg-card p-6 text-[13px] text-slate-gray">
                    No items match. Add bread and cakes on the menu first.
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {visible.map(item => {
                        const n = qty[item.id] ?? 0;
                        return (
                            <article
                                key={item.id}
                                className={cn(
                                    "overflow-hidden rounded-2xl border bg-card",
                                    n > 0
                                        ? "border-foreground"
                                        : "border-hairline",
                                    item.soldOut && "opacity-45",
                                )}
                            >
                                <button
                                    type="button"
                                    disabled={item.soldOut}
                                    onClick={() => bump(item.id, 1)}
                                    className="relative block aspect-[4/3] w-full overflow-hidden"
                                >
                                    <ItemPhoto item={item} />
                                    {n > 0 ? (
                                        <span className="absolute top-2 right-2 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-bold text-background">
                                            {n}
                                        </span>
                                    ) : null}
                                </button>
                                <div className="space-y-2 p-2.5">
                                    <div>
                                        <p className="truncate text-[13px] font-semibold">
                                            {item.name}
                                        </p>
                                        <p className="text-[12px] text-slate-gray">
                                            {formatEtb(Number(item.price))}
                                        </p>
                                    </div>
                                    {item.soldOut ? (
                                        <p className="text-[11px] font-medium text-destructive">
                                            Sold out
                                        </p>
                                    ) : n === 0 ? (
                                        <div className="grid grid-cols-2 gap-1">
                                            <button
                                                type="button"
                                                onClick={() => bump(item.id, 1)}
                                                className="flex h-9 items-center justify-center gap-1 rounded-full bg-foreground text-[12px] font-semibold text-background"
                                            >
                                                <Plus className="size-3.5" />
                                                Add
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => bump(item.id, 5)}
                                                className="h-9 rounded-full border border-hairline text-[12px] font-medium"
                                            >
                                                +5
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    bump(item.id, -1)
                                                }
                                                className="flex size-9 items-center justify-center rounded-full border border-hairline"
                                                aria-label={`Less ${item.name}`}
                                            >
                                                <Minus className="size-4" />
                                            </button>
                                            <span className="min-w-8 flex-1 text-center text-[15px] font-semibold tabular-nums">
                                                {n}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => bump(item.id, 1)}
                                                className="flex size-9 items-center justify-center rounded-full bg-foreground text-background"
                                                aria-label={`More ${item.name}`}
                                            >
                                                <Plus className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => bump(item.id, 5)}
                                                className="h-9 rounded-full border border-hairline px-2 text-[11px] font-medium"
                                            >
                                                +5
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {cart.length > 0 ? (
                <div className="sticky bottom-3 z-20 mt-4 rounded-2xl border border-hairline bg-card/95 p-3 shadow-xl backdrop-blur">
                    <div className="mb-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                        {cart.map(line => (
                            <button
                                key={line.menuItemId}
                                type="button"
                                onClick={() => bump(line.menuItemId, -1)}
                                className="rounded-full border border-hairline bg-background px-2.5 py-1 text-[11px]"
                            >
                                {line.name} × {line.quantity}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] text-slate-gray">
                                {cartCount} item{cartCount === 1 ? "" : "s"}
                            </p>
                            <p className="text-[18px] font-semibold tabular-nums">
                                {formatEtb(cartTotal)}
                            </p>
                        </div>
                        <button
                            type="button"
                            disabled={creating}
                            onClick={() => void generate()}
                            className="h-11 min-w-[9.5rem] rounded-full bg-foreground px-5 text-[13px] font-semibold text-background disabled:opacity-50"
                        >
                            {creating ? "Billing…" : "Generate bill"}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
