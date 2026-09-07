"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import { useAppSelector } from "@/context/hooks";
import {
    matchesQueueFilter,
    parseQueueFilter,
    parseQueueView,
    QUEUE_FILTER_LABELS,
    stationQueueHref,
    type QueueFilter,
} from "@/domains/fulfillment/application/queueFilter";
import StationStatusSelect from "@/domains/fulfillment/ui/StationStatusSelect";
import StationTicketActions from "@/domains/fulfillment/ui/StationTicketActions";
import TicketExtras from "@/domains/fulfillment/ui/TicketExtras";
import type { StationRole } from "@/domains/identity/domain/role";
import { stationIdForRole } from "@/domains/identity/domain/role";
import {
    homePathForRole,
    stationOrderPath,
} from "@/domains/identity/application/homePath";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";
import {
    displayStatus,
    formatTicketExtras,
    isItemDelayed,
    selectStationItems,
    selectStationQueueCounts,
} from "@/domains/ordering/application/selectors";
import { STATION_STATUS_LABELS } from "@/domains/ordering/domain/order";
import type { OrderItem } from "@/domains/ordering/domain/order";
import { formatEtb } from "@/lib/money";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Suspense, useMemo } from "react";

const STATUS_RANK: Record<string, number> = {
    queued: 0,
    acknowledged: 1,
    in_preparation: 2,
    ready: 3,
    rejected_by_station: 4,
};

type TicketRow = {
    item: OrderItem;
    tableNumber: string;
    waiterName: string;
    extras: string;
    delayed: boolean;
    receivedAt: number;
    receivedLabel: string;
    waitMinutes: number;
    overdueMinutes: number;
};

function pad(value: number) {
    return String(value).padStart(2, "0");
}

function formatReceived(iso: string | null) {
    if (!iso) return { stamp: 0, label: "—" };
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return { stamp: 0, label: "—" };
    return {
        stamp: date.getTime(),
        label: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`,
    };
}

function TicketCard({
    role,
    item,
    tableNumber,
    delayed,
}: {
    role: StationRole;
    item: OrderItem;
    tableNumber: string;
    delayed: boolean;
}) {
    const menuItem = useAppSelector(state =>
        state.menu.items.find(entry => entry.id === item.menuItemId),
    );
    const customized =
        (item.modifiers?.length ?? 0) > 0 || Boolean(item.instruction?.trim());

    return (
        <article
            className={cn(
                "group relative min-h-[340px] overflow-hidden rounded-[20px] border",
                delayed ? "border-destructive/40" : "border-hairline",
            )}
        >
            {menuItem?.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={menuItem.image}
                    alt={item.name}
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 bg-secondary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

            <div className="relative flex min-h-[340px] flex-col justify-between p-4">
                <div className="flex items-start justify-between gap-2">
                    <p className="rounded-full bg-black/25 px-2.5 py-1 text-[12px] font-medium text-white/90 backdrop-blur-sm">
                        Table {tableNumber}
                    </p>
                    <StatusPill item={item} delayed={delayed} overlay />
                </div>

                <div className="text-white">
                    <h2 className="text-[22px] leading-tight font-semibold">
                        {item.quantity}× {item.name}
                    </h2>
                    {menuItem?.description ? (
                        <p className="mt-1.5 line-clamp-2 text-[13px] text-white/75">
                            {menuItem.description}
                        </p>
                    ) : null}
                    {customized ? (
                        <TicketExtras
                            compact
                            overlay
                            modifiers={item.modifiers}
                            instruction={item.instruction}
                        />
                    ) : (
                        <p className="mt-3 text-[13px] text-white/60">
                            As listed
                        </p>
                    )}
                    {item.rejectReason ? (
                        <p className="mt-2 text-[13px] text-red-200">
                            {item.rejectReason}
                        </p>
                    ) : null}
                    <p className="mt-2 text-[12px] text-white/55">
                        {displayStatus(item)} · ~
                        {item.expectedPreparationMinutes} min
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <StationTicketActions item={item} />
                        <Link
                            href={stationOrderPath(role, item.id)}
                            className="text-[13px] font-medium text-white/90 underline-offset-4 hover:underline"
                        >
                            Order detail
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}

function StatusPill({
    item,
    delayed,
    overlay = false,
}: {
    item: OrderItem;
    delayed: boolean;
    overlay?: boolean;
}) {
    return (
        <span
            className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium",
                overlay && "backdrop-blur-md",
                item.status === "ready"
                    ? overlay
                        ? "bg-white/90 text-accent-foreground"
                        : "bg-accent text-accent-foreground"
                    : delayed
                      ? overlay
                          ? "bg-red-500/90 text-white"
                          : "bg-destructive/10 text-destructive"
                      : overlay
                        ? "bg-white/20 text-white"
                        : "bg-secondary text-slate-gray",
            )}
        >
            {delayed && item.status !== "ready"
                ? "Delayed"
                : STATION_STATUS_LABELS[item.status]}
        </span>
    );
}

function StationQueueBoardInner({ role }: { role: StationRole }) {
    const stationId = stationIdForRole(role);
    const home = homePathForRole(role);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const status = parseQueueFilter(searchParams.get("status"));
    const view = parseQueueView(searchParams.get("view"));
    const query = searchParams.get("q") ?? "";
    const items = useAppSelector(state =>
        selectStationItems(state, stationId),
    );
    const counts = useAppSelector(state =>
        selectStationQueueCounts(state, stationId),
    );
    const tables = useAppSelector(state => state.ops.tables);
    const sessions = useAppSelector(state => state.ops.sessions);

    const rows: TicketRow[] = items
        .filter(item => matchesQueueFilter(item, status))
        .map(item => {
            const session = sessions.find(entry => entry.id === item.sessionId);
            const table = tables.find(entry => entry.id === session?.tableId);
            const waiter = DEMO_STAFF.find(
                person => person.id === session?.waiterId,
            );
            const tableNumber = table?.number ?? "—";
            const received = formatReceived(item.queuedAt ?? item.createdAt);
            const waitMinutes = received.stamp
                ? Math.max(0, Math.floor((Date.now() - received.stamp) / 60000))
                : 0;
            const overdueMinutes = Math.max(
                0,
                waitMinutes - item.expectedPreparationMinutes,
            );
            return {
                item,
                tableNumber,
                waiterName: waiter?.name ?? "—",
                extras: formatTicketExtras(item),
                delayed: isItemDelayed(item),
                receivedAt: received.stamp,
                receivedLabel: received.label,
                waitMinutes,
                overdueMinutes,
            };
        })
        .filter(row => {
            if (!query.trim()) return true;
            const haystack = [
                row.item.name,
                row.item.quantity,
                row.tableNumber,
                row.extras,
                row.waiterName,
                row.item.instruction ?? "",
                STATION_STATUS_LABELS[row.item.status],
            ]
                .join(" ")
                .toLowerCase();
            return haystack.includes(query.trim().toLowerCase());
        });

    function setView(next: "cards" | "table") {
        if (pathname !== home) return;
        router.replace(
            stationQueueHref(home, { status, q: query, view: next }),
        );
    }

    const columns: DataTableColumn<TicketRow>[] = useMemo(
        () => [
            {
                id: "item",
                header: "Item",
                sortValue: row => row.item.name,
                cell: row => (
                    <Link
                        href={stationOrderPath(role, row.item.id)}
                        className="font-semibold text-foreground hover:text-brand"
                    >
                        {row.item.name}
                    </Link>
                ),
            },
            {
                id: "table",
                header: "Table",
                sortValue: row => Number.parseInt(row.tableNumber, 10) || 0,
                cell: row => row.tableNumber,
            },
            {
                id: "qty",
                header: "Qty",
                sortValue: row => row.item.quantity,
                cell: row => row.item.quantity,
            },
            {
                id: "extras",
                header: "Extras",
                sortValue: row => row.extras,
                cell: row =>
                    row.extras ? (
                        row.extras
                    ) : (
                        <span className="text-slate-gray">As listed</span>
                    ),
            },
            {
                id: "status",
                header: "Status",
                sortValue: row => STATUS_RANK[row.item.status] ?? 99,
                hideable: false,
                cell: row => (
                    <StationStatusSelect
                        item={row.item}
                        delayed={row.delayed}
                    />
                ),
            },
            {
                id: "waiter",
                header: "Waiter",
                sortValue: row => row.waiterName,
                cell: row => row.waiterName,
            },
            {
                id: "received",
                header: "Received",
                sortValue: row => row.receivedAt,
                cell: row => (
                    <span className="text-slate-gray">{row.receivedLabel}</span>
                ),
            },
            {
                id: "prep",
                header: "Prep (min)",
                sortValue: row => row.item.expectedPreparationMinutes,
                defaultHidden: true,
                cell: row => row.item.expectedPreparationMinutes,
            },
            {
                id: "overdue",
                header: "Overdue",
                sortValue: row => row.overdueMinutes,
                cell: row =>
                    row.overdueMinutes > 0 ? (
                        <span className="font-semibold text-destructive">
                            {row.overdueMinutes}
                        </span>
                    ) : (
                        <span className="text-slate-gray">—</span>
                    ),
            },
            {
                id: "amount",
                header: "Amount",
                sortValue: row => row.item.unitPrice * row.item.quantity,
                defaultHidden: true,
                cell: row => formatEtb(row.item.unitPrice * row.item.quantity),
            },
        ],
        [role],
    );

    const emptyLabel =
        status === "all"
            ? "No tickets in the queue."
            : `No tickets in ${QUEUE_FILTER_LABELS[status as QueueFilter].toLowerCase()}.`;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[12px] tracking-[0.08em] text-steel-gray uppercase">
                        Queue
                    </p>
                    <h1 className="text-[22px] font-semibold">
                        {QUEUE_FILTER_LABELS[status]}
                    </h1>
                </div>
                <div className="flex rounded-[12px] border border-hairline bg-card p-1">
                    <button
                        type="button"
                        className={cn(
                            "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-medium",
                            view === "cards"
                                ? "bg-secondary text-foreground"
                                : "text-slate-gray hover:bg-secondary/70",
                        )}
                        onClick={() => setView("cards")}
                    >
                        <LayoutGrid className="size-4" />
                        Cards
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-medium",
                            view === "table"
                                ? "bg-secondary text-foreground"
                                : "text-slate-gray hover:bg-secondary/70",
                        )}
                        onClick={() => setView("table")}
                    >
                        <Table2 className="size-4" />
                        Table
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">New</p>
                    <p className="text-[24px] font-semibold">{counts.new}</p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">In progress</p>
                    <p className="text-[24px] font-semibold">
                        {counts.preparing}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">Ready</p>
                    <p className="text-[24px] font-semibold text-brand">
                        {counts.ready}
                    </p>
                </div>
            </div>

            {view === "table" ? (
                <DataTable
                    columns={columns}
                    data={rows}
                    rowKey={row => row.item.id}
                    empty={emptyLabel}
                    searchPlaceholder="Search tickets..."
                    searchText={row =>
                        [
                            row.item.name,
                            row.tableNumber,
                            row.waiterName,
                            row.extras,
                            STATION_STATUS_LABELS[row.item.status],
                        ].join(" ")
                    }
                />
            ) : rows.length === 0 ? (
                <div className="rounded-[16px] border border-hairline bg-card p-10 text-center text-slate-gray">
                    {emptyLabel}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rows.map(row => (
                        <TicketCard
                            key={row.item.id}
                            role={role}
                            item={row.item}
                            tableNumber={row.tableNumber}
                            delayed={row.delayed}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function StationQueueBoard({ role }: { role: StationRole }) {
    return (
        <Suspense
            fallback={
                <div className="rounded-[16px] border border-hairline bg-card p-10 text-slate-gray">
                    Loading queue…
                </div>
            }
        >
            <StationQueueBoardInner role={role} />
        </Suspense>
    );
}
