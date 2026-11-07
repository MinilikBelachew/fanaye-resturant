"use client";

import { useMemo } from "react";
import {
    ArrowLeft,
    BellRing,
    CheckCircle2,
    ChefHat,
    Clock,
    CreditCard,
    MapPin,
    Receipt,
    User,
    Users,
} from "lucide-react";
import { useSessionBillQuery } from "@/context/services/billingApi";
import { useFloorTablesQuery } from "@/context/services/floorApi";
import { useTableSessionOrdersQuery } from "@/context/services/ordersApi";
import { tableNumber } from "@/domains/floor/application/groupFloor";
import { lineTotal } from "@/domains/ordering/application/mapWaiterMenu";
import type { SessionOrderItem } from "@/domains/ordering/domain/waiterMenu";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { TableDetailSkeleton } from "@/components/custom/molecules/Skeletons";

const COOKING = new Set([
    "QUEUED",
    "ACKNOWLEDGED",
    "IN_PREPARATION",
    "COOKING",
    "CONFIRMED",
]);
const READY = new Set(["READY"]);
const SERVED = new Set(["SERVED"]);

function itemBadge(state: string, t: (key: string) => string) {
    if (state === "READY")
        return {
            label: t("readyToServe"),
            className:
                "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
            icon: (
                <BellRing className="size-3 animate-bounce text-emerald-600" />
            ),
        };
    if (state === "IN_PREPARATION" || state === "COOKING")
        return {
            label: t("cooking"),
            className:
                "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
            icon: <ChefHat className="size-3 text-amber-600" />,
        };
    if (state === "QUEUED" || state === "ACKNOWLEDGED")
        return {
            label: t("queued"),
            className:
                "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400",
            icon: <Clock className="size-3 text-sky-600" />,
        };
    if (state === "CONFIRMED")
        return {
            label: t("needsSendToKitchen"),
            className:
                "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
            icon: <ChefHat className="size-3 animate-pulse text-amber-600" />,
        };
    if (state === "SERVED")
        return {
            label: t("served"),
            className: "bg-secondary text-slate-gray",
            icon: <CheckCircle2 className="size-3 text-slate-gray" />,
        };
    return {
        label: state.replaceAll("_", " "),
        className: "bg-secondary text-slate-gray",
        icon: <Clock className="size-3 text-slate-gray" />,
    };
}

function prettyStatus(s: string | null | undefined) {
    if (!s) return "—";
    return s.replaceAll("_", " ");
}

export default function LiveTableDetail({
    tableId,
    backHref,
}: {
    tableId: string;
    backHref: string;
}) {
    const tWaiter = useTranslations("waiter");
    const tCommon = useTranslations("common");
    const tLive = useTranslations("liveTable");

    const { data, isLoading, isError } = useFloorTablesQuery(undefined, {
        pollingInterval: 8000,
    });
    const table = data?.data.find(e => e.tableId === tableId);
    const sessionId = table?.tableSessionId ?? "";

    const { data: orders, isFetching: ordersFetching } =
        useTableSessionOrdersQuery(sessionId, {
            skip: !sessionId,
            pollingInterval: 5000,
        });
    const { data: billing } = useSessionBillQuery(sessionId, {
        skip: !sessionId,
        pollingInterval: 5000,
    });

    const items = useMemo(() => {
        const list: SessionOrderItem[] = [];
        for (const order of orders?.data ?? []) list.push(...order.items);
        return list;
    }, [orders?.data]);

    const cookingItems = items.filter(i => COOKING.has(i.state));
    const readyItems = items.filter(i => READY.has(i.state));
    const servedItems = items.filter(i => SERVED.has(i.state));
    const otherItems = items.filter(
        i =>
            !COOKING.has(i.state) &&
            !READY.has(i.state) &&
            !SERVED.has(i.state),
    );

    const bill = billing?.bill ?? null;
    const billRequest = billing?.billRequest ?? null;
    const payments = billing?.payments ?? [];

    const runningTotal = useMemo(() => {
        if (bill?.total) return Number(bill.total);
        return items.reduce((sum, item) => {
            if (item.state === "CANCELLED" || item.state === "VOIDED")
                return sum;
            return (
                sum + lineTotal(item.unitPrice, item.quantity, item.modifiers)
            );
        }, 0);
    }, [bill, items]);

    // ── Loading ──
    if (isLoading) return <TableDetailSkeleton />;

    // ── Error ──
    if (isError || !table) {
        return (
            <div className="space-y-4">
                <BackLink href={backHref} label={tLive("backToLive")} />
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-[13px] text-destructive">
                    {tLive("loadError")}
                </div>
            </div>
        );
    }

    // ── Free table ──
    if (!sessionId) {
        return (
            <div className="space-y-4">
                <BackLink href={backHref} label={tLive("backToLive")} />
                <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-card py-14 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                        <Receipt className="size-6 text-slate-gray" />
                    </div>
                    <p className="mt-4 text-[15px] font-semibold text-foreground">
                        {tLive("noActiveSession")}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        {tLive("tableFree", { table: tableNumber(table) })}
                    </p>
                </div>
            </div>
        );
    }

    const sessionStatus = billing?.tableSession.status ?? table.sessionStatus;

    return (
        <div className="space-y-5">
            {/* Back */}
            <BackLink href={backHref} label={tLive("backToLive")} />

            {/* Hero */}
            <div className="rounded-2xl border border-hairline bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand/8 text-brand">
                            <span className="text-[26px] font-bold leading-none">
                                {tableNumber(table)}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
                                    {tCommon("table")} {tableNumber(table)}
                                </h1>
                                <StatusPill status={sessionStatus ?? ""} />
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-gray">
                                <MapPin className="size-3.5" />
                                {table.locationName}
                            </p>
                        </div>
                    </div>
                    {ordersFetching && (
                        <span className="text-[11px] text-slate-gray">
                            {tLive("updating")}
                        </span>
                    )}
                </div>

                {/* Meta row */}
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-hairline pt-5 sm:grid-cols-4">
                    <MetaStat
                        icon={User}
                        label={tCommon("waiter")}
                        value={table.waiterName ?? "—"}
                    />
                    <MetaStat
                        icon={Users}
                        label={tLive("guests")}
                        value={
                            table.guestCount != null
                                ? String(table.guestCount)
                                : "—"
                        }
                    />
                    <MetaStat
                        icon={ChefHat}
                        label={tLive("inKitchen")}
                        value={`${cookingItems.length} cooking · ${readyItems.length} ready`}
                    />
                    <MetaStat
                        icon={Clock}
                        label={tLive("opened")}
                        value={
                            table.visitStartedAt
                                ? new Date(
                                      table.visitStartedAt,
                                  ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })
                                : "—"
                        }
                    />
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-5">
                {/* ── Orders ── */}
                <section className="lg:col-span-3 rounded-2xl border border-hairline bg-card">
                    <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                        <h2 className="text-[14px] font-semibold">
                            {tLive("ordersTitle")}
                        </h2>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-slate-gray">
                            {items.length} {tLive("items")}
                        </span>
                    </div>

                    {items.length === 0 ? (
                        <div className="py-12 text-center text-[13px] text-slate-gray">
                            {tLive("noOrdersYet")}
                        </div>
                    ) : (
                        <div className="divide-y divide-hairline">
                            <ItemGroup
                                title={tLive("readyGroup")}
                                items={readyItems}
                                tWaiter={tWaiter}
                                accent="emerald"
                            />
                            <ItemGroup
                                title={tLive("cookingGroup")}
                                items={cookingItems}
                                tWaiter={tWaiter}
                                accent="amber"
                            />
                            <ItemGroup
                                title={tLive("servedGroup")}
                                items={servedItems}
                                tWaiter={tWaiter}
                                accent="neutral"
                            />
                            <ItemGroup
                                title={tLive("otherGroup")}
                                items={otherItems}
                                tWaiter={tWaiter}
                                accent="neutral"
                            />
                        </div>
                    )}
                </section>

                {/* ── Bill ── */}
                <section className="lg:col-span-2 rounded-2xl border border-hairline bg-card">
                    <div className="flex items-center gap-2 border-b border-hairline px-5 py-4">
                        <Receipt className="size-4 text-brand" />
                        <h2 className="text-[14px] font-semibold">
                            {tLive("billTitle")}
                        </h2>
                    </div>

                    <div className="p-5">
                        {/* Running total */}
                        <div className="rounded-2xl bg-secondary/60 px-4 py-3">
                            <p className="text-[11px] text-slate-gray">
                                {tLive("runningTotal")}
                            </p>
                            <p className="mt-1 text-[26px] font-semibold tabular-nums text-foreground">
                                {formatEtb(runningTotal)}
                            </p>
                        </div>

                        {/* Bill status */}
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-slate-gray">
                                    {tLive("billStatus")}
                                </span>
                                <span className="font-medium text-foreground">
                                    {bill
                                        ? prettyStatus(bill.status)
                                        : billRequest?.status === "PENDING"
                                          ? tLive("billRequested")
                                          : tLive("noBillYet")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-slate-gray">
                                    {tLive("amountPaid")}
                                </span>
                                <span className="font-medium tabular-nums text-foreground">
                                    {bill
                                        ? formatEtb(Number(bill.amountPaid))
                                        : formatEtb(0)}
                                </span>
                            </div>
                        </div>

                        {/* Bill lines */}
                        {bill && (
                            <div className="mt-4">
                                <p className="mb-2 text-[11px] text-slate-gray">
                                    {tLive("billNumber", {
                                        number: bill.billNumber,
                                    })}
                                </p>
                                <ul className="divide-y divide-hairline rounded-xl border border-hairline">
                                    {bill.lines.map(line => (
                                        <li
                                            key={line.billLineId}
                                            className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px]"
                                        >
                                            <span className="font-medium">
                                                {line.quantity}× {line.itemName}
                                            </span>
                                            <span className="tabular-nums text-slate-gray">
                                                {formatEtb(
                                                    Number(line.lineTotal),
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Payments */}
                        {payments.length > 0 && (
                            <div className="mt-4">
                                <p className="mb-2 text-[12px] font-medium text-foreground">
                                    {tLive("payments")}
                                </p>
                                <ul className="space-y-2">
                                    {payments.map(p => (
                                        <li
                                            key={p.paymentId}
                                            className="flex items-center justify-between rounded-xl border border-hairline px-3 py-2.5 text-[13px]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="size-3.5 text-slate-gray" />
                                                <span>
                                                    {p.method}
                                                    {p.transferChannel
                                                        ? ` · ${p.transferChannel}`
                                                        : ""}
                                                </span>
                                                <span className="text-[11px] text-slate-gray">
                                                    {prettyStatus(p.status)}
                                                </span>
                                            </div>
                                            <span className="tabular-nums font-semibold">
                                                {formatEtb(Number(p.amount))}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BackLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-[13px] text-slate-gray hover:text-foreground"
        >
            <ArrowLeft className="size-4" />
            {label}
        </Link>
    );
}

function StatusPill({ status }: { status: string }) {
    const s = status.toUpperCase();
    const cls =
        s === "OPEN" || s === "ACTIVE"
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : s === "CLOSED"
              ? "bg-secondary text-slate-gray"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
    return (
        <span
            className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                cls,
            )}
        >
            {prettyStatus(status)}
        </span>
    );
}

function MetaStat({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="flex items-center gap-1 text-[11px] text-slate-gray">
                <Icon className="size-3.5" />
                {label}
            </p>
            <p className="mt-0.5 text-[14px] font-semibold text-foreground">
                {value}
            </p>
        </div>
    );
}

function ItemGroup({
    title,
    items,
    tWaiter,
    accent,
}: {
    title: string;
    items: SessionOrderItem[];
    tWaiter: (key: string) => string;
    accent: "emerald" | "amber" | "neutral";
}) {
    if (items.length === 0) return null;

    const dotCls =
        accent === "emerald"
            ? "bg-emerald-500"
            : accent === "amber"
              ? "bg-amber-500"
              : "bg-slate-gray/40";

    return (
        <div className="px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
                <span className={cn("size-1.5 rounded-full", dotCls)} />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-gray">
                    {title}
                </h3>
                <span className="ml-auto text-[12px] text-slate-gray">
                    {items.length}
                </span>
            </div>
            <ul className="space-y-2">
                {items.map(item => {
                    const badge = itemBadge(item.state, tWaiter);
                    return (
                        <li
                            key={item.orderItemId}
                            className="flex items-start justify-between gap-3 rounded-xl border border-hairline bg-card px-3.5 py-3"
                        >
                            <div className="min-w-0">
                                <p className="text-[14px] font-medium text-foreground">
                                    {item.quantity}× {item.itemName}
                                </p>
                                <p className="mt-0.5 text-[12px] text-slate-gray">
                                    {item.stationName}
                                    {item.specialInstruction
                                        ? ` · ${item.specialInstruction}`
                                        : ""}
                                </p>
                                {item.modifiers.length > 0 && (
                                    <p className="mt-0.5 text-[11px] text-slate-gray">
                                        {item.modifiers
                                            .map(m => m.name)
                                            .join(", ")}
                                    </p>
                                )}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium",
                                        badge.className,
                                    )}
                                >
                                    {badge.icon}
                                    {badge.label}
                                </span>
                                <span className="tabular-nums text-[12px] text-slate-gray">
                                    {formatEtb(
                                        lineTotal(
                                            item.unitPrice,
                                            item.quantity,
                                            item.modifiers,
                                        ),
                                    )}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
