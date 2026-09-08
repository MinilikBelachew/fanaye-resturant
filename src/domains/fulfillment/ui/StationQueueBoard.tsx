"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import { useAppSelector } from "@/context/hooks";
import { useCurrentStationQueue } from "@/domains/fulfillment/application/useCurrentStationQueue";
import {
    matchesStationFilter,
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
import {
    homePathForRole,
    stationOrderPath,
} from "@/domains/identity/application/homePath";
import {
    stationStateLabel,
    stationTicketExtras,
    type StationTicket,
} from "@/domains/fulfillment/domain/stationTicket";
import { imageForDish, lineTotal } from "@/domains/ordering/application/mapWaiterMenu";
import { formatEtb } from "@/lib/money";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Suspense, useMemo } from "react";

const STATUS_RANK: Record<string, number> = {
    QUEUED: 0,
    ACKNOWLEDGED: 1,
    IN_PREPARATION: 2,
    READY: 3,
    CANNOT_PREPARE: 4,
};

type TicketRow = {
    ticket: StationTicket;
    extras: string;
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

function ticketModifiers(ticket: StationTicket) {
    return ticket.modifiers.map((entry, index) => ({
        groupId: "mod",
        optionId: `${index}`,
        name: entry.name,
        priceDelta: Number(entry.priceDelta),
    }));
}

function TicketCard({
    role,
    ticket,
}: {
    role: StationRole;
    ticket: StationTicket;
}) {
    const image = imageForDish(ticket.itemName);
    const customized =
        ticket.modifiers.length > 0 ||
        Boolean(ticket.specialInstruction?.trim());

    return (
        <article
            className={cn(
                "group relative min-h-[340px] overflow-hidden rounded-[20px] border",
                ticket.delayed ? "border-destructive/40" : "border-hairline",
            )}
        >
            {image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={image}
                    alt={ticket.itemName}
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 bg-secondary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

            <div className="relative flex min-h-[340px] flex-col justify-between p-4">
                <div className="flex items-start justify-between gap-2">
                    <p className="rounded-full bg-black/25 px-2.5 py-1 text-[12px] font-medium text-white/90 backdrop-blur-sm">
                        Table {ticket.tableDisplayName}
                    </p>
                    <StatusPill ticket={ticket} overlay />
                </div>

                <div className="text-white">
                    <h2 className="text-[22px] leading-tight font-semibold">
                        {ticket.quantity}× {ticket.itemName}
                    </h2>
                    {customized ? (
                        <TicketExtras
                            compact
                            overlay
                            modifiers={ticketModifiers(ticket)}
                            instruction={ticket.specialInstruction ?? ""}
                        />
                    ) : (
                        <p className="mt-3 text-[13px] text-white/60">
                            As listed
                        </p>
                    )}
                    {ticket.exceptionReason ? (
                        <p className="mt-2 text-[13px] text-red-200">
                            {ticket.exceptionReason}
                        </p>
                    ) : null}
                    <p className="mt-2 text-[12px] text-white/55">
                        {ticket.delayed
                            ? `Delayed · ${stationStateLabel(ticket.state)}`
                            : stationStateLabel(ticket.state)}{" "}
                        · ~{ticket.expectedPrepMinutes} min
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <StationTicketActions ticket={ticket} />
                        <Link
                            href={stationOrderPath(role, ticket.orderItemId)}
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
    ticket,
    overlay = false,
}: {
    ticket: StationTicket;
    overlay?: boolean;
}) {
    return (
        <span
            className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium",
                overlay && "backdrop-blur-md",
                ticket.state === "READY"
                    ? overlay
                        ? "bg-white/90 text-accent-foreground"
                        : "bg-accent text-accent-foreground"
                    : ticket.delayed || ticket.state === "CANNOT_PREPARE"
                      ? overlay
                          ? "bg-red-500/90 text-white"
                          : "bg-destructive/10 text-destructive"
                      : overlay
                        ? "bg-white/20 text-white"
                        : "bg-secondary text-slate-gray",
            )}
        >
            {ticket.delayed && ticket.state !== "READY"
                ? "Delayed"
                : stationStateLabel(ticket.state)}
        </span>
    );
}

function StationQueueBoardInner({ role }: { role: StationRole }) {
    const stationName = useAppSelector(
        state => state.identity.session?.stationName,
    );
    const home = homePathForRole(role);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const status = parseQueueFilter(searchParams.get("status"));
    const view = parseQueueView(searchParams.get("view"));
    const query = searchParams.get("q") ?? "";
    const { stationId, tickets, counts, isLoading, isError } =
        useCurrentStationQueue();

    const rows: TicketRow[] = tickets
        .filter(ticket => matchesStationFilter(ticket, status))
        .map(ticket => {
            const received = formatReceived(ticket.queuedAt);
            const waitMinutes = Math.floor(ticket.elapsedSeconds / 60);
            const overdueMinutes = Math.max(
                0,
                waitMinutes - ticket.expectedPrepMinutes,
            );
            return {
                ticket,
                extras: stationTicketExtras(ticket),
                receivedAt: received.stamp,
                receivedLabel: received.label,
                waitMinutes,
                overdueMinutes,
            };
        })
        .filter(row => {
            if (!query.trim()) return true;
            const haystack = [
                row.ticket.itemName,
                row.ticket.quantity,
                row.ticket.tableDisplayName,
                row.extras,
                row.ticket.waiter.displayName,
                row.ticket.specialInstruction ?? "",
                stationStateLabel(row.ticket.state),
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
                sortValue: row => row.ticket.itemName,
                cell: row => (
                    <Link
                        href={stationOrderPath(role, row.ticket.orderItemId)}
                        className="font-semibold text-foreground hover:text-brand"
                    >
                        {row.ticket.itemName}
                    </Link>
                ),
            },
            {
                id: "table",
                header: "Table",
                sortValue: row =>
                    Number.parseInt(row.ticket.tableDisplayName, 10) || 0,
                cell: row => row.ticket.tableDisplayName,
            },
            {
                id: "qty",
                header: "Qty",
                sortValue: row => row.ticket.quantity,
                cell: row => row.ticket.quantity,
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
                sortValue: row => STATUS_RANK[row.ticket.state] ?? 99,
                hideable: false,
                cell: row => <StationStatusSelect ticket={row.ticket} />,
            },
            {
                id: "waiter",
                header: "Waiter",
                sortValue: row => row.ticket.waiter.displayName,
                cell: row => row.ticket.waiter.displayName,
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
                sortValue: row => row.ticket.expectedPrepMinutes,
                defaultHidden: true,
                cell: row => row.ticket.expectedPrepMinutes,
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
                sortValue: row =>
                    lineTotal(
                        row.ticket.unitPrice,
                        row.ticket.quantity,
                        row.ticket.modifiers,
                    ),
                defaultHidden: true,
                cell: row =>
                    formatEtb(
                        lineTotal(
                            row.ticket.unitPrice,
                            row.ticket.quantity,
                            row.ticket.modifiers,
                        ),
                    ),
            },
        ],
        [role],
    );

    const emptyLabel =
        status === "all"
            ? "No tickets in the queue."
            : `No tickets in ${QUEUE_FILTER_LABELS[status as QueueFilter].toLowerCase()}.`;

    if (!stationId) {
        return (
            <p className="text-slate-gray">
                This account has no station assignment.
            </p>
        );
    }

    if (isLoading) {
        return <p className="text-slate-gray">Loading queue…</p>;
    }

    if (isError) {
        return <p className="text-red-600">Could not load the station queue.</p>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[12px] tracking-[0.08em] text-steel-gray uppercase">
                        {stationName ?? "Queue"}
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
                    rowKey={row => row.ticket.orderItemId}
                    empty={emptyLabel}
                    searchPlaceholder="Search tickets..."
                    searchText={row =>
                        [
                            row.ticket.itemName,
                            row.ticket.tableDisplayName,
                            row.ticket.waiter.displayName,
                            row.extras,
                            stationStateLabel(row.ticket.state),
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
                            key={row.ticket.orderItemId}
                            role={role}
                            ticket={row.ticket}
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
