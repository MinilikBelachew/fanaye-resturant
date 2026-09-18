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
} from "@/domains/fulfillment/application/queueFilter";
import StationStatusSelect from "@/domains/fulfillment/ui/StationStatusSelect";
import StationTicketActions from "@/domains/fulfillment/ui/StationTicketActions";
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
import {
    imageForDish,
    lineTotal,
} from "@/domains/ordering/application/mapWaiterMenu";
import { formatEtb } from "@/lib/money";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Suspense, useMemo } from "react";
import { useTranslations } from "next-intl";
import { StationQueueSkeleton } from "@/components/custom/molecules/Skeletons";

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

function isFreshTicket(ticket: StationTicket) {
    return ticket.state === "QUEUED";
}

function TicketCard({
    role,
    ticket,
}: {
    role: StationRole;
    ticket: StationTicket;
}) {
    const tStations = useTranslations("stations");
    const tCommon = useTranslations("common");
    const image = imageForDish(ticket.itemName);
    const customized =
        ticket.modifiers.length > 0 ||
        Boolean(ticket.specialInstruction?.trim());
    const fresh = isFreshTicket(ticket);

    return (
        <article
            className={cn(
                "group relative min-h-[200px] overflow-hidden rounded-[14px] border",
                fresh
                    ? "border-brand shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand)_40%,transparent)]"
                    : ticket.delayed
                      ? "border-destructive/40"
                      : "border-hairline",
            )}
        >
            {image ? (
                <img
                    src={image}
                    alt={ticket.itemName}
                    className="absolute inset-0 size-full object-cover transition-transform duration-400 group-hover:scale-[1.03]"
                />
            ) : (
                <div className="absolute inset-0 bg-secondary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
            {fresh ? (
                <div className="pointer-events-none absolute inset-0 bg-brand/12" />
            ) : null}

            <div className="relative flex min-h-[200px] flex-col justify-between gap-2 p-3">
                <div className="flex items-start justify-between gap-1.5">
                    <p className="rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                        {tCommon("table")} {ticket.tableDisplayName}
                    </p>
                    <StatusPill ticket={ticket} overlay compact />
                </div>

                <div className="text-white">
                    <h2 className="line-clamp-2 text-[15px] leading-snug font-semibold">
                        <span className="text-white/70">
                            {ticket.quantity}×
                        </span>{" "}
                        {ticket.itemName}
                    </h2>
                    <p className="mt-1 line-clamp-1 text-[11px] text-white/55">
                        {customized
                            ? stationTicketExtras(ticket)
                            : tStations("asListed")}
                    </p>
                    {ticket.exceptionReason ? (
                        <p className="mt-1 line-clamp-1 text-[11px] text-red-200">
                            {ticket.exceptionReason}
                        </p>
                    ) : null}
                    <p
                        className={cn(
                            "mt-1.5 text-[10px] tracking-wide",
                            fresh
                                ? "font-semibold text-orange-200"
                                : "text-white/50",
                        )}
                    >
                        {ticket.delayed
                            ? `${tStations("delayed")} · ${stationStateLabel(ticket.state)}`
                            : stationStateLabel(ticket.state)}{" "}
                        · ~{ticket.expectedPrepMinutes} min
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 [&_button]:h-7 [&_button]:px-2.5 [&_button]:text-[11px]">
                        <StationTicketActions ticket={ticket} compact overlay />
                        <Link
                            href={stationOrderPath(role, ticket.orderItemId)}
                            className="inline-flex h-7 items-center rounded-md border border-white/25 bg-white/10 px-2.5 text-[11px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
                        >
                            {tStations("orderDetail")}
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
    compact = false,
}: {
    ticket: StationTicket;
    overlay?: boolean;
    compact?: boolean;
}) {
    const tStations = useTranslations("stations");
    const fresh = isFreshTicket(ticket);
    return (
        <span
            className={cn(
                "rounded-full font-semibold tracking-wide uppercase",
                compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[12px]",
                overlay && "backdrop-blur-md",
                fresh
                    ? overlay
                        ? "animate-pulse bg-brand text-white shadow-md shadow-brand/30"
                        : "animate-pulse bg-brand text-white"
                    : ticket.state === "READY"
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
            {fresh
                ? tStations("newOrder")
                : ticket.delayed && ticket.state !== "READY"
                  ? tStations("delayed")
                  : stationStateLabel(ticket.state)}
        </span>
    );
}

function StationQueueBoardInner({ role }: { role: StationRole }) {
    const tStations = useTranslations("stations");
    const tCommon = useTranslations("common");
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
    const { stationId, tickets, counts, isLoading, isError, data, refetch } =
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
        })
        .sort((a, b) => {
            const rank = (state: string) => {
                if (state === "QUEUED") return 0;
                if (state === "ACKNOWLEDGED") return 1;
                return (STATUS_RANK[state] ?? 50) + 2;
            };
            const diff = rank(a.ticket.state) - rank(b.ticket.state);
            if (diff !== 0) return diff;
            // Newest new tickets first.
            return b.receivedAt - a.receivedAt;
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
                header: tStations("item"),
                sortValue: row => row.ticket.itemName,
                cell: row => (
                    <div className="flex items-center gap-2">
                        {isFreshTicket(row.ticket) ? (
                            <span className="inline-flex shrink-0 animate-pulse rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                                {tStations("newOrder")}
                            </span>
                        ) : null}
                        <Link
                            href={stationOrderPath(
                                role,
                                row.ticket.orderItemId,
                            )}
                            className="font-semibold text-foreground hover:text-brand"
                        >
                            {row.ticket.itemName}
                        </Link>
                    </div>
                ),
            },
            {
                id: "table",
                header: tCommon("table"),
                sortValue: row =>
                    Number.parseInt(row.ticket.tableDisplayName, 10) || 0,
                cell: row => row.ticket.tableDisplayName,
            },
            {
                id: "qty",
                header: tCommon("qty"),
                sortValue: row => row.ticket.quantity,
                cell: row => row.ticket.quantity,
            },
            {
                id: "extras",
                header: tStations("extras"),
                sortValue: row => row.extras,
                cell: row =>
                    row.extras ? (
                        row.extras
                    ) : (
                        <span className="text-slate-gray">
                            {tStations("asListed")}
                        </span>
                    ),
            },
            {
                id: "status",
                header: tCommon("status"),
                sortValue: row => STATUS_RANK[row.ticket.state] ?? 99,
                hideable: false,
                cell: row => <StationStatusSelect ticket={row.ticket} />,
            },
            {
                id: "waiter",
                header: tCommon("waiter"),
                sortValue: row => row.ticket.waiter.displayName,
                cell: row => row.ticket.waiter.displayName,
            },
            {
                id: "received",
                header: tStations("received"),
                sortValue: row => row.receivedAt,
                cell: row => (
                    <span className="text-slate-gray">{row.receivedLabel}</span>
                ),
            },
            {
                id: "prep",
                header: tStations("prep"),
                sortValue: row => row.ticket.expectedPrepMinutes,
                defaultHidden: true,
                cell: row => row.ticket.expectedPrepMinutes,
            },
            {
                id: "overdue",
                header: tStations("overdue"),
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
                header: tStations("amount"),
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
        [role, tStations, tCommon],
    );

    const emptyLabel = tStations("noTickets");

    if (!stationId) {
        return (
            <div className="rounded-[16px] border border-dashed border-hairline bg-card p-8 text-center">
                <p className="text-[15px] font-semibold text-foreground">
                    No station assigned
                </p>
                <p className="mt-1 text-[13px] text-slate-gray">
                    Ask a manager to assign this account to an active prep
                    station.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return <StationQueueSkeleton />;
    }

    if (isError) {
        return (
            <div className="rounded-[14px] border border-amber-500/30 bg-amber-500/5 p-6 text-center">
                <p className="text-[14px] font-medium text-foreground">
                    Station unreachable
                </p>
                <p className="mt-1 text-[12px] text-slate-gray">
                    Could not load the queue. Retrying every 5 seconds.
                </p>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="mt-3 rounded-full border border-hairline bg-card px-3 py-1.5 text-[12px] font-normal text-foreground hover:bg-secondary"
                >
                    Retry now
                </button>
            </div>
        );
    }

    if (data?.stationOffline) {
        return (
            <div className="rounded-[14px] border border-amber-500/30 bg-amber-500/5 p-6 text-center">
                <p className="text-[14px] font-medium text-foreground">
                    Station offline
                </p>
                <p className="mt-1 text-[12px] text-slate-gray">
                    A manager turned this station off. Queue will refresh
                    automatically when it comes back online.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] tracking-[0.08em] text-steel-gray uppercase sm:text-[12px]">
                        {stationName ?? "Queue"}
                    </p>
                    <h1 className="truncate text-[18px] font-semibold sm:text-[22px]">
                        {tStations.has(status)
                            ? tStations(status)
                            : QUEUE_FILTER_LABELS[status]}
                    </h1>
                </div>
                <div className="flex rounded-[10px] border border-hairline bg-card p-0.5 sm:rounded-[12px] sm:p-1">
                    <button
                        type="button"
                        className={cn(
                            "flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium sm:gap-1.5 sm:rounded-[10px] sm:px-3 sm:text-[13px]",
                            view === "cards"
                                ? "bg-secondary text-foreground"
                                : "text-slate-gray hover:bg-secondary/70",
                        )}
                        onClick={() => setView("cards")}
                    >
                        <LayoutGrid className="size-3.5 sm:size-4" />
                        {tStations("cards")}
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium sm:gap-1.5 sm:rounded-[10px] sm:px-3 sm:text-[13px]",
                            view === "table"
                                ? "bg-secondary text-foreground"
                                : "text-slate-gray hover:bg-secondary/70",
                        )}
                        onClick={() => setView("table")}
                    >
                        <Table2 className="size-3.5 sm:size-4" />
                        {tStations("table")}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div
                    className={cn(
                        "rounded-[12px] border bg-card p-2.5 sm:rounded-[16px] sm:p-4",
                        counts.new > 0
                            ? "border-brand/50 bg-brand/5"
                            : "border-hairline",
                    )}
                >
                    <p className="truncate text-[11px] text-slate-gray sm:text-[12px]">
                        {tStations("new")}
                    </p>
                    <p
                        className={cn(
                            "text-[18px] font-semibold sm:text-[24px]",
                            counts.new > 0 && "text-brand",
                        )}
                    >
                        {counts.new}
                    </p>
                </div>
                <div className="rounded-[12px] border border-hairline bg-card p-2.5 sm:rounded-[16px] sm:p-4">
                    <p className="truncate text-[11px] text-slate-gray sm:text-[12px]">
                        {tStations("preparing")}
                    </p>
                    <p className="text-[18px] font-semibold sm:text-[24px]">
                        {counts.preparing}
                    </p>
                </div>
                <div className="rounded-[12px] border border-hairline bg-card p-2.5 sm:rounded-[16px] sm:p-4">
                    <p className="truncate text-[11px] text-slate-gray sm:text-[12px]">
                        {tStations("ready")}
                    </p>
                    <p className="text-[18px] font-semibold text-brand sm:text-[24px]">
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
                    rowClassName={row =>
                        isFreshTicket(row.ticket)
                            ? "border-l-4 border-l-brand bg-brand/5 hover:bg-brand/10"
                            : undefined
                    }
                />
            ) : rows.length === 0 ? (
                <div className="rounded-[16px] border border-hairline bg-card p-10 text-center text-slate-gray">
                    {emptyLabel}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
