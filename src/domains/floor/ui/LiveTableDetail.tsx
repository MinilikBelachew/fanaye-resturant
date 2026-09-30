"use client";

import { useMemo } from "react";
import {
    ArrowLeft,
    BellRing,
    CheckCircle2,
    ChefHat,
    Clock,
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
import { Badge } from "@/components/ui/badge";

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
    if (state === "READY") {
        return {
            label: t("readyToServe"),
            className:
                "border-emerald-500/30 bg-emerald-500/15 text-emerald-700",
            icon: (
                <BellRing className="size-3 animate-bounce text-emerald-500" />
            ),
        };
    }
    if (state === "IN_PREPARATION" || state === "COOKING") {
        return {
            label: t("cooking"),
            className: "border-amber-500/30 bg-amber-500/15 text-amber-700",
            icon: <ChefHat className="size-3 text-amber-500" />,
        };
    }
    if (state === "QUEUED" || state === "ACKNOWLEDGED") {
        return {
            label: t("queued"),
            className: "border-sky-500/30 bg-sky-500/15 text-sky-700",
            icon: <Clock className="size-3 text-sky-500" />,
        };
    }
    if (state === "CONFIRMED") {
        return {
            label: t("needsSendToKitchen"),
            className: "border-amber-500/40 bg-amber-500/15 text-amber-800",
            icon: <ChefHat className="size-3 animate-pulse text-amber-500" />,
        };
    }
    if (state === "SERVED") {
        return {
            label: t("served"),
            className: "border-hairline bg-secondary text-slate-gray",
            icon: <CheckCircle2 className="size-3 text-slate-gray" />,
        };
    }
    return {
        label: state.replaceAll("_", " "),
        className: "border-hairline bg-secondary text-slate-gray",
        icon: <Clock className="size-3 text-slate-gray" />,
    };
}

function prettyStatus(status: string | null | undefined) {
    if (!status) return "—";
    return status.replaceAll("_", " ");
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
    const table = data?.data.find(entry => entry.tableId === tableId);
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
        for (const order of orders?.data ?? []) {
            list.push(...order.items);
        }
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
        return items.reduce(
            (sum, item) =>
                sum + lineTotal(item.unitPrice, item.quantity, item.modifiers),
            0,
        );
    }, [bill, items]);

    if (isLoading) {
        return <TableDetailSkeleton />;
    }

    if (isError || !table) {
        return (
            <div className="space-y-4">
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-1.5 text-[13px] text-slate-gray hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    {tLive("backToLive")}
                </Link>
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
                    {tLive("loadError")}
                </div>
            </div>
        );
    }

    if (!sessionId) {
        return (
            <div className="space-y-4">
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-1.5 text-[13px] text-slate-gray hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    {tLive("backToLive")}
                </Link>
                <div className="rounded-[16px] border border-hairline bg-card p-6 text-center text-slate-gray">
                    <p className="text-[14px] font-medium text-foreground">
                        {tLive("noActiveSession")}
                    </p>
                    <p className="mt-1 text-[12px]">
                        {tLive("tableFree", { table: tableNumber(table) })}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Link
                        href={backHref}
                        className="mb-2 inline-flex items-center gap-1.5 text-[13px] text-slate-gray hover:text-foreground"
                    >
                        <ArrowLeft className="size-3.5" />
                        {tLive("backToLive")}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-[22px] font-semibold tracking-tight">
                            {tCommon("table")} {tableNumber(table)}
                        </h1>
                        <Badge variant="warning">
                            {prettyStatus(
                                billing?.tableSession.status ??
                                    table.sessionStatus,
                            )}
                        </Badge>
                        {ordersFetching ? (
                            <span className="text-[11px] text-slate-gray">
                                {tLive("updating")}
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-gray">
                        <MapPin className="size-3.5" />
                        {table.locationName}
                    </p>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetaCard
                    icon={User}
                    label={tCommon("waiter")}
                    value={table.waiterName ?? "—"}
                />
                <MetaCard
                    icon={Users}
                    label={tLive("guests")}
                    value={
                        table.guestCount != null
                            ? String(table.guestCount)
                            : "—"
                    }
                />
                <MetaCard
                    icon={ChefHat}
                    label={tLive("inKitchen")}
                    value={`${cookingItems.length} · ${readyItems.length} ${tWaiter("readyCount")}`}
                />
                <MetaCard
                    icon={Clock}
                    label={tLive("opened")}
                    value={
                        table.visitStartedAt
                            ? new Date(table.visitStartedAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                              )
                            : "—"
                    }
                />
            </div>

            <section className="rounded-[16px] border border-hairline bg-card p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-[15px] font-semibold">
                        {tLive("ordersTitle")}
                    </h2>
                    <p className="text-[12px] text-slate-gray">
                        {items.length} {tLive("items")}
                    </p>
                </div>
                {items.length === 0 ? (
                    <p className="py-8 text-center text-[13px] text-slate-gray">
                        {tLive("noOrdersYet")}
                    </p>
                ) : (
                    <div className="space-y-5">
                        <ItemGroup
                            title={tLive("cookingGroup")}
                            items={cookingItems}
                            tWaiter={tWaiter}
                        />
                        <ItemGroup
                            title={tLive("readyGroup")}
                            items={readyItems}
                            tWaiter={tWaiter}
                        />
                        <ItemGroup
                            title={tLive("servedGroup")}
                            items={servedItems}
                            tWaiter={tWaiter}
                        />
                        <ItemGroup
                            title={tLive("otherGroup")}
                            items={otherItems}
                            tWaiter={tWaiter}
                        />
                    </div>
                )}
            </section>

            <section className="rounded-[16px] border border-hairline bg-card p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                    <Receipt className="size-4 text-primary" />
                    <h2 className="text-[15px] font-semibold">
                        {tLive("billTitle")}
                    </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <MetaCard
                        icon={Receipt}
                        label={tLive("runningTotal")}
                        value={formatEtb(runningTotal)}
                    />
                    <MetaCard
                        icon={Receipt}
                        label={tLive("billStatus")}
                        value={
                            bill
                                ? prettyStatus(bill.status)
                                : billRequest?.status === "PENDING"
                                  ? tLive("billRequested")
                                  : tLive("noBillYet")
                        }
                    />
                    <MetaCard
                        icon={Receipt}
                        label={tLive("amountPaid")}
                        value={
                            bill
                                ? formatEtb(Number(bill.amountPaid))
                                : formatEtb(0)
                        }
                    />
                </div>

                {bill ? (
                    <div className="mt-4 space-y-2">
                        <p className="text-[12px] text-slate-gray">
                            {tLive("billNumber", { number: bill.billNumber })}
                        </p>
                        <ul className="divide-y divide-hairline rounded-[12px] border border-hairline">
                            {bill.lines.map(line => (
                                <li
                                    key={line.billLineId}
                                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px]"
                                >
                                    <span>
                                        <span className="font-medium">
                                            {line.quantity}× {line.itemName}
                                        </span>
                                    </span>
                                    <span className="tabular-nums text-slate-gray">
                                        {formatEtb(Number(line.lineTotal))}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                {payments.length > 0 ? (
                    <div className="mt-4">
                        <h3 className="mb-2 text-[13px] font-medium">
                            {tLive("payments")}
                        </h3>
                        <ul className="space-y-2">
                            {payments.map(p => (
                                <li
                                    key={p.paymentId}
                                    className="flex items-center justify-between rounded-[12px] border border-hairline px-3 py-2 text-[13px]"
                                >
                                    <span>
                                        {p.method}
                                        {p.transferChannel
                                            ? ` · ${p.transferChannel}`
                                            : ""}
                                        <span className="ml-2 text-[11px] text-slate-gray">
                                            {prettyStatus(p.status)}
                                        </span>
                                    </span>
                                    <span className="tabular-nums font-medium">
                                        {formatEtb(Number(p.amount))}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </section>
        </div>
    );
}

function MetaCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof User;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[14px] border border-hairline bg-card p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] text-slate-gray">
                <Icon className="size-3.5" />
                {label}
            </p>
            <p className="mt-1 text-[14px] font-medium leading-snug">{value}</p>
        </div>
    );
}

function ItemGroup({
    title,
    items,
    tWaiter,
}: {
    title: string;
    items: SessionOrderItem[];
    tWaiter: (key: string) => string;
}) {
    if (items.length === 0) return null;
    return (
        <div>
            <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-gray">
                {title} · {items.length}
            </h3>
            <ul className="space-y-2">
                {items.map(item => {
                    const badge = itemBadge(item.state, tWaiter);
                    return (
                        <li
                            key={item.orderItemId}
                            className="flex items-start justify-between gap-3 rounded-[12px] border border-hairline px-3 py-2.5"
                        >
                            <div className="min-w-0">
                                <p className="text-[14px] font-medium">
                                    {item.quantity}× {item.itemName}
                                </p>
                                <p className="mt-0.5 text-[12px] text-slate-gray">
                                    {item.stationName}
                                    {item.specialInstruction
                                        ? ` · ${item.specialInstruction}`
                                        : ""}
                                </p>
                                {item.modifiers.length > 0 ? (
                                    <p className="mt-0.5 text-[11px] text-slate-gray">
                                        {item.modifiers
                                            .map(m => m.name)
                                            .join(", ")}
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
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
