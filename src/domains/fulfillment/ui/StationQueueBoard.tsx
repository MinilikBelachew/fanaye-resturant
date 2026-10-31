"use client";

import {
    AlertTriangle,
    CheckCircle2,
    Flame,
    Inbox,
    LayoutGrid,
    Table2,
    Boxes,
} from "lucide-react";
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
import TableOrderCard, { TableGroupData } from "@/domains/fulfillment/ui/TableOrderCard";
import GroupedStationTable from "@/domains/fulfillment/ui/GroupedStationTable";
import { parseServingGroup } from "@/domains/fulfillment/application/servingGroup";
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
import { Suspense, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { StationQueueSkeleton } from "@/components/custom/molecules/Skeletons";
import IssueMaterialsModal from "@/domains/outside-orders/ui/IssueMaterialsModal";
import KitchenMaterialsAuditModal from "@/domains/outside-orders/ui/KitchenMaterialsAuditModal";
import { useListActiveMaterialIssuesQuery } from "@/context/services/outsideOrdersApi";
import { Button } from "@/components/ui/button";

const STATUS_RANK: Record<string, number> = {
    QUEUED: 0,
    ACKNOWLEDGED: 1,
    IN_PREPARATION: 2,
    READY: 3,
    CANNOT_PREPARE: 4,
};

function MaterialsButton({
    ticket,
    compact = false,
}: {
    ticket: StationTicket;
    compact?: boolean;
}) {
    const [showMaterialsModal, setShowMaterialsModal] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setShowMaterialsModal(true)}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors",
                    compact
                        ? "h-7 px-2.5 text-[11px] border-amber-400/40 bg-amber-500/20 text-amber-100 backdrop-blur-md hover:bg-amber-500/30"
                        : "h-8 px-3 text-xs border-amber-400/60 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-950",
                )}
            >
                <Boxes className="size-3.5" />
                Materials
            </button>

            {showMaterialsModal && (
                <IssueMaterialsModal
                    outsideOrderId={ticket.outsideOrderId}
                    destinationName={ticket.tableDisplayName}
                    onClose={() => setShowMaterialsModal(false)}
                    onSuccess={() => {
                        // Modal will close itself after success
                    }}
                />
            )}
        </>
    );
}

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

function formatOverdueMinutes(minutes: number): string {
    if (minutes <= 0) return "—";
    if (minutes < 60) return `+${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    if (hours < 24) {
        return remMinutes > 0 ? `+${hours}h ${remMinutes}m` : `+${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `+${days}d ${remHours}h` : `+${days}d`;
}

function isFreshTicket(ticket: StationTicket) {
    return ticket.state === "QUEUED";
}

function TicketCard({
    role,
    ticket,
    workflowMode,
}: {
    role: StationRole;
    ticket: StationTicket;
    workflowMode?: string | null;
}) {
    const tStations = useTranslations("stations");
    const tCommon = useTranslations("common");
    const image = imageForDish(ticket.itemName);
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
                        {ticket.tableDisplayName
                            .toLowerCase()
                            .startsWith("call")
                            ? ticket.tableDisplayName
                            : `${tCommon("table")} ${ticket.tableDisplayName}`}
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
                    {ticket.modifiers.length > 0 ? (
                        <p className="mt-1 line-clamp-2 text-[11px] text-white/70">
                            {ticket.modifiers
                                .map(entry => entry.name)
                                .join(" · ")}
                        </p>
                    ) : (
                        <p className="mt-1 text-[11px] text-white/45">
                            {tStations("asListed")}
                        </p>
                    )}
                    {ticket.specialInstruction?.trim() ? (
                        <p className="mt-1.5 line-clamp-3 rounded-md bg-amber-400/25 px-2 py-1 text-[12px] font-semibold leading-snug text-amber-100 ring-1 ring-amber-200/40">
                            {tStations("notePrefix")}:{" "}
                            {ticket.specialInstruction.trim()}
                        </p>
                    ) : null}
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
                        <StationTicketActions
                            ticket={ticket}
                            compact
                            overlay
                            workflowMode={workflowMode}
                        />
                        {ticket.outsideOrderId && (
                            <MaterialsButton ticket={ticket} compact />
                        )}
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
    const workflowMode = data?.workflowMode ?? "FULL_PREP";
    const [showMaterialsAuditModal, setShowMaterialsAuditModal] = useState(
        () => searchParams.get("view_materials") === "true",
    );
    const { data: activeMaterialsRes } = useListActiveMaterialIssuesQuery(
        undefined,
        {
            pollingInterval: 10000,
        },
    );
    const pendingAuditCount = useMemo(() => {
        return (activeMaterialsRes?.data ?? []).filter(
            i => i.status === "RETURNED",
        ).length;
    }, [activeMaterialsRes?.data]);

    useEffect(() => {
        if (searchParams.get("view_materials") === "true") {
            setShowMaterialsAuditModal(true);
        }
    }, [searchParams]);

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
            // Stable by arrival — status changes must not reshuffle cards/rows.
            // Ready tickets sink to the bottom while keeping relative order.
            const aReady = a.ticket.state === "READY" ? 1 : 0;
            const bReady = b.ticket.state === "READY" ? 1 : 0;
            if (aReady !== bReady) return aReady - bReady;
            return b.receivedAt - a.receivedAt;
        });

    function setView(next: "cards" | "table") {
        if (pathname !== home) return;
        router.replace(
            stationQueueHref(home, { status, q: query, view: next }),
        );
    }

    function setFilter(next: QueueFilter) {
        if (pathname !== home) return;
        router.replace(
            stationQueueHref(home, { status: next, q: query, view }),
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
                cell: row => {
                    const modifiers = row.ticket.modifiers
                        .map(entry => entry.name)
                        .join(" · ");
                    const { trayLabel, isSharedTray, cleanInstruction } = parseServingGroup(row.ticket.specialInstruction);
                    if (!modifiers && !cleanInstruction && !isSharedTray) {
                        return (
                            <span className="text-slate-gray">
                                {tStations("asListed")}
                            </span>
                        );
                    }
                    return (
                        <div className="space-y-1">
                            {isSharedTray ? (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/40 px-1.5 py-0.2 text-[10.5px] font-bold uppercase tracking-wider">
                                    🍱 {trayLabel}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-secondary text-slate-gray border border-hairline px-1.5 py-0.2 text-[10px] font-medium uppercase tracking-wider">
                                    🍽️ Separate
                                </span>
                            )}
                            {modifiers ? (
                                <p className="text-[13px] text-foreground">
                                    {modifiers}
                                </p>
                            ) : null}
                            {cleanInstruction ? (
                                <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-300">
                                    {tStations("notePrefix")}: {cleanInstruction}
                                </p>
                            ) : null}
                        </div>
                    );
                },
            },
            {
                id: "status",
                header: tCommon("status"),
                sortValue: row => STATUS_RANK[row.ticket.state] ?? 99,
                hideable: false,
                cell: row => (
                    <StationStatusSelect
                        ticket={row.ticket}
                        workflowMode={workflowMode}
                    />
                ),
            },
            {
                id: "waiter",
                header: tCommon("staff"),
                sortValue: row => row.ticket.waiter.displayName,
                cell: row => {
                    const isCall = row.ticket.tableDisplayName
                        .toLowerCase()
                        .startsWith("call");
                    return (
                        <span className="inline-flex flex-col leading-tight">
                            <span>{row.ticket.waiter.displayName}</span>
                            {isCall ? (
                                <span className="text-[11px] font-medium text-slate-gray">
                                    Dispatcher
                                </span>
                            ) : null}
                        </span>
                    );
                },
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
                cell: row => `${row.ticket.expectedPrepMinutes}m`,
            },
            {
                id: "overdue",
                header: tStations("overdue"),
                sortValue: row => row.overdueMinutes,
                cell: row =>
                    row.overdueMinutes > 0 ? (
                        <span className="font-normal text-destructive">
                            {formatOverdueMinutes(row.overdueMinutes)}
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
            {
                id: "materials",
                header: "Materials",
                sortValue: () => 0,
                hideable: true,
                cell: row => {
                    if (!row.ticket.outsideOrderId) {
                        return (
                            <span className="text-slate-gray text-xs">—</span>
                        );
                    }
                    return <MaterialsButton ticket={row.ticket} />;
                },
            },
        ],
        [role, tStations, tCommon, workflowMode],
    );

    // Group tickets into Table Order Cards (Option A) - Must be before early returns for React Hook rules
    const tableGroups = useMemo(() => {
        const map = new Map<string, TableGroupData>();
        for (const row of rows) {
            const t = row.ticket;
            const key =
                t.tableSessionId ||
                t.outsideOrderId ||
                t.tableDisplayName;
            let group = map.get(key);
            if (!group) {
                group = {
                    key,
                    tableDisplayName: t.tableDisplayName,
                    waiterName: t.waiter?.displayName || "Server",
                    tableSessionId: t.tableSessionId,
                    outsideOrderId: t.outsideOrderId,
                    maxElapsedSeconds: 0,
                    isDelayed: false,
                    hasFresh: false,
                    tray1Items: [],
                    tray2Items: [],
                    tray3Items: [],
                    separateItems: [],
                    allTickets: [],
                };
                map.set(key, group);
            }
            group.allTickets.push(t);
            if (t.elapsedSeconds > group.maxElapsedSeconds) {
                group.maxElapsedSeconds = t.elapsedSeconds;
            }
            if (t.delayed) group.isDelayed = true;
            if (isFreshTicket(t)) group.hasFresh = true;

            const parsed = parseServingGroup(t.specialInstruction);
            if (parsed.rawTray?.toLowerCase().includes("1") || parsed.rawTray?.toLowerCase().includes("shared")) {
                group.tray1Items.push(t);
            } else if (parsed.rawTray?.toLowerCase().includes("2")) {
                group.tray2Items.push(t);
            } else if (parsed.rawTray?.toLowerCase().includes("3")) {
                group.tray3Items.push(t);
            } else {
                group.separateItems.push(t);
            }
        }
        return Array.from(map.values()).sort(
            (a, b) => b.maxElapsedSeconds - a.maxElapsedSeconds,
        );
    }, [rows]);

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

    const filterTabs: Array<{
        key: QueueFilter;
        label: string;
        count: number;
        icon: typeof LayoutGrid;
        badgeClass?: string;
    }> = [
        {
            key: "all",
            label: tStations.has("allTickets")
                ? tStations("allTickets")
                : "All tickets",
            count: tickets.length,
            icon: LayoutGrid,
        },
        {
            key: "new",
            label: tStations.has("new") ? tStations("new") : "New",
            count: counts.new,
            icon: Inbox,
            badgeClass:
                counts.new > 0 ? "bg-brand text-brand-foreground" : undefined,
        },
        {
            key: "preparing",
            label: tStations.has("preparing")
                ? tStations("preparing")
                : "In progress",
            count: counts.preparing,
            icon: Flame,
            badgeClass:
                counts.preparing > 0
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : undefined,
        },
        {
            key: "ready",
            label: tStations.has("ready") ? tStations("ready") : "Ready",
            count: counts.ready,
            icon: CheckCircle2,
            badgeClass:
                counts.ready > 0
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : undefined,
        },
        {
            key: "exceptions",
            label: tStations.has("exceptions")
                ? tStations("exceptions")
                : "Exceptions",
            count: counts.exceptions,
            icon: AlertTriangle,
            badgeClass:
                counts.exceptions > 0
                    ? "bg-destructive/15 text-destructive"
                    : undefined,
        },
    ];

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] tracking-[0.08em] text-steel-gray uppercase sm:text-[12px]">
                        {stationName ?? "Queue"}
                    </p>
                    <h1 className="truncate text-[18px] font-normal sm:text-[22px]">
                        {status === "all"
                            ? "All tickets"
                            : tStations.has(status)
                              ? tStations(status)
                              : QUEUE_FILTER_LABELS[status]}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/${role}/materials`)}
                        className={cn(
                            "h-8 sm:h-9 px-2.5 sm:px-3 text-[12px] sm:text-[13px] font-medium border-hairline cursor-pointer",
                            pendingAuditCount > 0
                                ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
                                : "text-foreground hover:bg-secondary",
                        )}
                    >
                        <Boxes className="size-3.5 sm:size-4 mr-1 text-amber-600 dark:text-amber-400" />
                        <span>Tableware Audit</span>
                        {pendingAuditCount > 0 && (
                            <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white animate-pulse">
                                {pendingAuditCount}
                            </span>
                        )}
                    </Button>
                    <div className="flex rounded-[10px] border border-hairline bg-card p-0.5 sm:rounded-[12px] sm:p-1">
                        <button
                            type="button"
                            className={cn(
                                "flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[12px] font-normal sm:gap-1.5 sm:rounded-[10px] sm:px-3 sm:text-[13px] cursor-pointer",
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
                                "flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[12px] font-normal sm:gap-1.5 sm:rounded-[10px] sm:px-3 sm:text-[13px] cursor-pointer",
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
            </div>

            {/* Tableware Audit Alert Banner if returns are waiting */}
            {pendingAuditCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-950 dark:text-amber-200 animate-in fade-in-50">
                    <div className="flex items-center gap-2">
                        <span className="flex size-2 rounded-full bg-amber-500 animate-ping" />
                        <Boxes className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                            <strong>
                                {pendingAuditCount} returnable tableware
                                issue(s)
                            </strong>{" "}
                            brought back by waiters awaiting your audit.
                        </span>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => router.push(`/${role}/materials`)}
                        className="h-7 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                    >
                        Verify & Approve Audit
                    </Button>
                </div>
            )}

            {showMaterialsAuditModal && (
                <KitchenMaterialsAuditModal
                    onClose={() => setShowMaterialsAuditModal(false)}
                />
            )}

            {/* Interactive Top Status Filter */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-2.5">
                {filterTabs.map(tab => {
                    const isActive = status === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setFilter(tab.key)}
                            className={cn(
                                "flex items-center justify-between rounded-[14px] border p-2.5 sm:p-3 text-left transition-all cursor-pointer",
                                isActive
                                    ? "border-brand/70 bg-brand/5 text-foreground ring-1 ring-brand/30"
                                    : "border-hairline bg-card hover:bg-secondary/40 text-foreground",
                            )}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <tab.icon
                                    className={cn(
                                        "size-4 shrink-0",
                                        isActive
                                            ? "text-brand"
                                            : "text-slate-gray",
                                    )}
                                />
                                <span className="truncate text-[12px] sm:text-[13px] font-normal text-foreground">
                                    {tab.label}
                                </span>
                            </div>
                            <span
                                className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-normal",
                                    tab.badgeClass ??
                                        (isActive
                                            ? "bg-brand/15 text-brand"
                                            : "bg-secondary text-slate-gray"),
                                )}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {view === "table" ? (
                <GroupedStationTable
                    tableGroups={tableGroups}
                    role={role}
                    workflowMode={workflowMode}
                    emptyLabel={emptyLabel}
                />
            ) : rows.length === 0 ? (
                <div className="rounded-[16px] border border-hairline bg-card p-10 text-center text-slate-gray">
                    {emptyLabel}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {tableGroups.map(group => (
                        <TableOrderCard
                            key={group.key}
                            group={group}
                            role={role}
                            workflowMode={workflowMode}
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
