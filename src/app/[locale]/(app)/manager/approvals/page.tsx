"use client";

import { useMemo, useState } from "react";
import {
    Check,
    ChevronRight,
    ClipboardList,
    Loader2,
    RefreshCw,
    Replace,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import DataTable, {
    type DataTableColumn,
    type DataTablePagination,
} from "@/components/custom/organisms/DataTable";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    useApprovalHistoryQuery,
    useApproveCancellationRequestMutation,
    useApproveChangeRequestMutation,
    useOrderMutationApprovalsQuery,
    useRejectCancellationRequestMutation,
    useRejectChangeRequestMutation,
    type ApprovalPeriod,
    type ApprovalQueueItem,
    type ApprovalRequestType,
} from "@/context/services/ordersApi";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const POLL_MS = 5000;

function formatChangeValue(value: unknown): string {
    if (value == null || value === "") return "";
    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value
            .map(entry => formatChangeValue(entry))
            .filter(Boolean)
            .join(", ");
    }
    if (typeof value === "object") {
        return JSON.stringify(value);
    }
    return String(value);
}

function itemStateLabel(
    state: string,
    t: ReturnType<typeof useTranslations<"managerApprovals">>,
) {
    const key = `itemStates.${state}` as const;
    if (t.has(key)) return t(key);
    return state.replaceAll("_", " ");
}

function statusTone(
    status: string,
): "warning" | "success" | "danger" | "secondary" {
    switch (status) {
        case "PENDING":
            return "warning";
        case "APPROVED":
        case "APPLIED":
            return "success";
        case "REJECTED":
            return "danger";
        default:
            return "secondary";
    }
}

function detailHref(row: ApprovalQueueItem) {
    const kind = row.type === "CANCELLATION" ? "cancellation" : "change";
    return `/manager/approvals/${kind}/${row.requestId}`;
}

export default function ManagerApprovalsPage() {
    const t = useTranslations("managerApprovals");
    const tCommon = useTranslations("common");
    const [tab, setTab] = useState<"pending" | "history">("pending");
    const [period, setPeriod] = useState<ApprovalPeriod>("day");
    const [typeFilter, setTypeFilter] = useState<ApprovalRequestType | "ALL">(
        "ALL",
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [busyId, setBusyId] = useState<string | null>(null);
    const limit = 20;

    const { data, isLoading, isError, isFetching, refetch } =
        useOrderMutationApprovalsQuery(undefined, {
            pollingInterval: tab === "pending" ? POLL_MS : 0,
        });

    const {
        data: history,
        isLoading: historyLoading,
        isError: historyError,
        refetch: refetchHistory,
    } = useApprovalHistoryQuery(
        {
            period,
            type: typeFilter,
            q: searchQuery.trim() || undefined,
            page,
            limit,
        },
        { skip: tab !== "history", pollingInterval: 0 },
    );

    const [approveCancel] = useApproveCancellationRequestMutation();
    const [rejectCancel] = useRejectCancellationRequestMutation();
    const [approveChange] = useApproveChangeRequestMutation();
    const [rejectChange] = useRejectChangeRequestMutation();

    const rows = data?.data ?? [];
    const summary = data?.summary ?? {
        pendingCount: rows.length,
        cancellationCount: rows.filter(r => r.type === "CANCELLATION").length,
        changeCount: rows.filter(r => r.type === "CHANGE").length,
    };

    const pendingFiltered = useMemo(() => {
        if (typeFilter === "ALL") return rows;
        return rows.filter(r => r.type === typeFilter);
    }, [rows, typeFilter]);

    const periods: Array<{ id: ApprovalPeriod; label: string }> = [
        { id: "day", label: t("periodDay") },
        { id: "week", label: t("periodWeek") },
        { id: "month", label: t("periodMonth") },
    ];

    async function decide(
        row: ApprovalQueueItem,
        decision: "approve" | "reject",
    ) {
        setBusyId(`${row.type}-${row.requestId}-${decision}`);
        try {
            if (row.type === "CANCELLATION") {
                if (decision === "approve") {
                    await approveCancel({
                        requestId: row.requestId,
                        expectedOrderItemVersion: row.itemVersion,
                    }).unwrap();
                } else {
                    await rejectCancel({
                        requestId: row.requestId,
                        expectedOrderItemVersion: row.itemVersion,
                        decisionReason: "Rejected",
                    }).unwrap();
                }
            } else if (decision === "approve") {
                await approveChange({
                    requestId: row.requestId,
                    expectedOrderItemVersion: row.itemVersion,
                }).unwrap();
            } else {
                await rejectChange({
                    requestId: row.requestId,
                    expectedOrderItemVersion: row.itemVersion,
                    decisionReason: "Rejected",
                }).unwrap();
            }
            toast.success(
                decision === "approve"
                    ? t("toastApproved")
                    : t("toastRejected"),
                row.itemName,
            );
        } catch (err) {
            toast.fromUnknown(
                err,
                decision === "approve"
                    ? t("toastApproveError")
                    : t("toastRejectError"),
            );
        } finally {
            setBusyId(null);
        }
    }

    const historyColumns: DataTableColumn<ApprovalQueueItem>[] = useMemo(
        () => [
            {
                id: "when",
                header: t("colWhen"),
                cell: row => (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-medium">
                            {new Date(row.requestedAt).toLocaleString(
                                undefined,
                                {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                },
                            )}
                        </span>
                        <span className="text-[11px] text-slate-gray">
                            {row.requestedByName}
                        </span>
                    </div>
                ),
            },
            {
                id: "type",
                header: t("colType"),
                cell: row => (
                    <Badge
                        variant={
                            row.type === "CANCELLATION" ? "danger" : "warning"
                        }
                        className="rounded-full"
                    >
                        {row.type === "CANCELLATION"
                            ? t("typeCancellation")
                            : t("typeChange")}
                    </Badge>
                ),
            },
            {
                id: "item",
                header: t("colItem"),
                cell: row => (
                    <div>
                        <p className="font-medium text-foreground">
                            {row.itemName}
                        </p>
                        <p className="text-[12px] text-slate-gray">
                            {row.tableDisplayNumber
                                ? `#${row.tableDisplayNumber}`
                                : row.tableDisplayName}{" "}
                            · {row.stationName}
                        </p>
                    </div>
                ),
            },
            {
                id: "status",
                header: t("colStatus"),
                cell: row => (
                    <Badge
                        variant={statusTone(row.status)}
                        className="rounded-full"
                    >
                        {t.has(`status.${row.status}` as "status.PENDING")
                            ? t(`status.${row.status}` as "status.PENDING")
                            : row.status}
                    </Badge>
                ),
            },
            {
                id: "actions",
                header: "",
                cell: row => (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full text-[12px]"
                        asChild
                    >
                        <Link href={detailHref(row)}>
                            {t("viewDetail")}
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </Button>
                ),
            },
        ],
        [t],
    );

    const historyPagination: DataTablePagination | undefined = history
        ? {
              page: history.pagination.page,
              totalPages: Math.max(history.pagination.totalPages, 1),
              total: history.pagination.total,
              limit: history.pagination.limit,
              onPageChange: setPage,
          }
        : undefined;

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow={t("eyebrow")}
                    title={t("title")}
                    description={t("description")}
                />
                <div className="flex flex-wrap items-center gap-2 self-start">
                    <div className="flex rounded-[12px] border border-hairline bg-card p-1">
                        {(
                            [
                                { id: "pending", label: t("tabPending") },
                                { id: "history", label: t("tabHistory") },
                            ] as const
                        ).map(entry => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() => {
                                    setTab(entry.id);
                                    setPage(1);
                                }}
                                className={cn(
                                    "rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                                    tab === entry.id
                                        ? "bg-brand text-white"
                                        : "text-slate-gray hover:text-foreground",
                                )}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isFetching}
                        onClick={() => {
                            void refetch();
                            if (tab === "history") void refetchHistory();
                        }}
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                isFetching && "animate-spin",
                            )}
                        />
                        {tCommon("refresh")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline">
                {[
                    {
                        label: t("cardPending"),
                        value: summary.pendingCount,
                        icon: ClipboardList,
                    },
                    {
                        label: t("cardCancellations"),
                        value: summary.cancellationCount,
                        icon: X,
                    },
                    {
                        label: t("cardChanges"),
                        value: summary.changeCount,
                        icon: Replace,
                    },
                ].map(card => (
                    <div
                        key={card.label}
                        className="flex items-center gap-3 bg-card px-4 py-3.5"
                    >
                        <span className="flex size-9 items-center justify-center rounded-xl bg-secondary/60 text-slate-gray">
                            <card.icon className="size-4" />
                        </span>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.06em] text-slate-gray">
                                {card.label}
                            </p>
                            <p className="text-[20px] font-semibold tabular-nums text-foreground">
                                {card.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {(
                    [
                        { id: "ALL", label: t("filterAll") },
                        {
                            id: "CANCELLATION",
                            label: t("typeCancellation"),
                        },
                        { id: "CHANGE", label: t("typeChange") },
                    ] as const
                ).map(entry => (
                    <button
                        key={entry.id}
                        type="button"
                        onClick={() => {
                            setTypeFilter(entry.id);
                            setPage(1);
                        }}
                        className={cn(
                            "rounded-full border px-3 py-1 text-[12px] transition-colors",
                            typeFilter === entry.id
                                ? "border-brand bg-brand/10 text-brand"
                                : "border-hairline text-slate-gray hover:text-foreground",
                        )}
                    >
                        {entry.label}
                    </button>
                ))}
            </div>

            {tab === "pending" ? (
                <>
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-slate-gray">
                            <Loader2 className="size-4 animate-spin" />
                            {t("loading")}
                        </div>
                    ) : null}
                    {isError ? (
                        <p className="text-sm text-destructive">
                            {t("loadError")}
                        </p>
                    ) : null}
                    {!isLoading && !isError && pendingFiltered.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-hairline bg-card/60 px-6 py-16 text-center">
                            <ClipboardList className="mx-auto size-8 text-slate-gray/50" />
                            <p className="mt-3 text-[15px] font-medium text-foreground">
                                {t("emptyTitle")}
                            </p>
                            <p className="mt-1 text-[13px] text-slate-gray">
                                {t("empty")}
                            </p>
                        </div>
                    ) : null}

                    <div className="space-y-3">
                        {pendingFiltered.map(row => {
                            const changeSummary = row.requestedChange
                                ? Object.entries(row.requestedChange)
                                      .filter(
                                          ([, value]) =>
                                              value != null && value !== "",
                                      )
                                      .map(
                                          ([key, value]) =>
                                              `${key}: ${formatChangeValue(value)}`,
                                      )
                                      .join(" · ")
                                : null;
                            const approveBusy =
                                busyId ===
                                `${row.type}-${row.requestId}-approve`;
                            const rejectBusy =
                                busyId ===
                                `${row.type}-${row.requestId}-reject`;

                            return (
                                <article
                                    key={`${row.type}-${row.requestId}`}
                                    className="rounded-2xl border border-hairline bg-card p-4 transition-colors hover:bg-secondary/20 sm:p-5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                    variant={
                                                        row.type ===
                                                        "CANCELLATION"
                                                            ? "danger"
                                                            : "warning"
                                                    }
                                                    className="rounded-full"
                                                >
                                                    {row.type === "CANCELLATION"
                                                        ? t("typeCancellation")
                                                        : t("typeChange")}
                                                </Badge>
                                                <span className="text-[12px] text-slate-gray">
                                                    {new Date(
                                                        row.requestedAt,
                                                    ).toLocaleString(
                                                        undefined,
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                            <h2 className="mt-2 text-[17px] font-semibold tracking-tight text-foreground">
                                                {row.type === "CANCELLATION"
                                                    ? t("prefixCancel")
                                                    : t("prefixChange")}{" "}
                                                {row.itemName}
                                            </h2>
                                            <p className="mt-1 text-[13px] text-slate-gray">
                                                {row.tableDisplayNumber
                                                    ? `#${row.tableDisplayNumber}`
                                                    : row.tableDisplayName}{" "}
                                                · {row.stationName} ·{" "}
                                                {itemStateLabel(
                                                    row.itemState,
                                                    t,
                                                )}
                                            </p>
                                            <p className="mt-0.5 text-[13px] text-slate-gray">
                                                {t("requestedBy", {
                                                    name: row.requestedByName,
                                                })}{" "}
                                                · {row.quantity}× ·{" "}
                                                {formatEtb(
                                                    Number(row.lineTotal),
                                                )}
                                            </p>
                                            {row.reason ? (
                                                <p className="mt-2 text-[13px] text-foreground">
                                                    {row.reason}
                                                </p>
                                            ) : null}
                                            {changeSummary ? (
                                                <p className="mt-1 text-[12px] text-slate-gray">
                                                    {changeSummary}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-8 gap-1.5 rounded-full"
                                            disabled={!!busyId}
                                            onClick={() =>
                                                void decide(row, "approve")
                                            }
                                        >
                                            {approveBusy ? (
                                                <Loader2 className="size-3.5 animate-spin" />
                                            ) : (
                                                <Check className="size-3.5" />
                                            )}
                                            {t("approve")}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-1.5 rounded-full"
                                            disabled={!!busyId}
                                            onClick={() =>
                                                void decide(row, "reject")
                                            }
                                        >
                                            {rejectBusy ? (
                                                <Loader2 className="size-3.5 animate-spin" />
                                            ) : (
                                                <X className="size-3.5" />
                                            )}
                                            {t("reject")}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 rounded-full text-[12px]"
                                            asChild
                                        >
                                            <Link href={detailHref(row)}>
                                                {t("viewDetail")}
                                                <ChevronRight className="size-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex rounded-[12px] border border-hairline bg-card p-1">
                            {periods.map(entry => (
                                <button
                                    key={entry.id}
                                    type="button"
                                    onClick={() => {
                                        setPeriod(entry.id);
                                        setPage(1);
                                    }}
                                    className={cn(
                                        "rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                                        period === entry.id
                                            ? "bg-brand text-white"
                                            : "text-slate-gray hover:text-foreground",
                                    )}
                                >
                                    {entry.label}
                                </button>
                            ))}
                        </div>
                        {history ? (
                            <p className="text-[12px] text-slate-gray">
                                {t("historyRange", {
                                    from: history.from,
                                    to: history.to,
                                })}
                            </p>
                        ) : null}
                    </div>

                    {historyError ? (
                        <p className="text-sm text-destructive">
                            {t("historyError")}
                        </p>
                    ) : (
                        <DataTable
                            columns={historyColumns}
                            data={history?.data ?? []}
                            rowKey={row => `${row.type}-${row.requestId}`}
                            empty={
                                historyLoading
                                    ? t("loadingHistory")
                                    : t("historyEmpty")
                            }
                            searchPlaceholder={t("historySearch")}
                            searchQuery={searchQuery}
                            onSearchChange={q => {
                                setSearchQuery(q);
                                setPage(1);
                            }}
                            serverSide
                            pagination={historyPagination}
                        />
                    )}
                </>
            )}
        </DashboardFrame>
    );
}
