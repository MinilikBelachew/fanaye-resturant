"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
    Boxes,
    CheckCircle2,
    AlertTriangle,
    ArrowLeft,
    LayoutGrid,
    Table2,
    Search,
    User,
    Clock,
    MapPin,
    AlertOctagon,
    ShieldCheck,
    RefreshCw,
    ExternalLink,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useListActiveMaterialIssuesQuery,
    useAuditMaterialIssueMutation,
    type OrderMaterialIssue,
} from "@/context/services/outsideOrdersApi";
import KitchenMaterialsAuditModal from "@/domains/outside-orders/ui/KitchenMaterialsAuditModal";
import { Link } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

function parseQty(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (typeof val === "string") return parseFloat(val) || 0;
    if (typeof val === "object" && "s" in val && "e" in val && "d" in val) {
        const sign = val.s < 0 ? -1 : 1;
        const digits = (val.d || []).join("");
        const exp = typeof val.e === "number" ? val.e : 0;
        if (!digits) return 0;
        if (exp >= digits.length - 1) {
            return (
                sign * parseFloat(digits + "0".repeat(exp - digits.length + 1))
            );
        }
        return (
            sign *
            parseFloat(digits.slice(0, exp + 1) + "." + digits.slice(exp + 1))
        );
    }
    return Number(val) || 0;
}

function formatTimeAgo(isoString?: string | null): string {
    if (!isoString) return "—";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(isoString).toLocaleDateString([], {
        month: "short",
        day: "numeric",
    });
}

type FilterTab = "pending" | "issued" | "disputed" | "all";
type ViewMode = "cards" | "table";

export default function StationMaterialsPage({
    role = "kitchen",
}: {
    role?: string;
}) {
    const {
        data: issuesRes,
        isLoading,
        isFetching,
        refetch,
    } = useListActiveMaterialIssuesQuery(undefined, {
        pollingInterval: 8000,
    });

    const [auditIssue, { isLoading: auditing }] =
        useAuditMaterialIssueMutation();

    const [view, setView] = useState<ViewMode>("cards");
    const [filterTab, setFilterTab] = useState<FilterTab>("pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIssue, setSelectedIssue] =
        useState<OrderMaterialIssue | null>(null);
    const [showAuditModal, setShowAuditModal] = useState(false);

    const issues: OrderMaterialIssue[] = useMemo(() => {
        return issuesRes?.data ?? [];
    }, [issuesRes?.data]);

    const counts = useMemo(() => {
        return {
            pending: issues.filter(i => i.status === "RETURNED").length,
            issued: issues.filter(i => i.status === "ISSUED").length,
            disputed: issues.filter(i => i.status === "DISPUTED").length,
            all: issues.length,
        };
    }, [issues]);

    // Sorted: Latest returns first (returnedAt DESC, then issuedAt DESC)
    const sortedIssues = useMemo(() => {
        let list = [...issues];

        // Filter tab
        if (filterTab === "pending") {
            list = list.filter(i => i.status === "RETURNED");
        } else if (filterTab === "issued") {
            list = list.filter(i => i.status === "ISSUED");
        } else if (filterTab === "disputed") {
            list = list.filter(i => i.status === "DISPUTED");
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(i => {
                const dest = (
                    i.order?.outsideOrder?.destinationName || ""
                ).toLowerCase();
                const waiter = (
                    i.waiter?.employeeDisplayName || ""
                ).toLowerCase();
                const cust = (
                    i.order?.outsideOrder?.customerName || ""
                ).toLowerCase();
                const hasItem = i.lines.some(l =>
                    l.materialNameSnapshot.toLowerCase().includes(q),
                );
                return (
                    dest.includes(q) ||
                    waiter.includes(q) ||
                    cust.includes(q) ||
                    hasItem
                );
            });
        }

        // Sort: Latest returned on top
        return list.sort((a, b) => {
            const aRet = a.returnedAt ? new Date(a.returnedAt).getTime() : 0;
            const bRet = b.returnedAt ? new Date(b.returnedAt).getTime() : 0;
            if (aRet !== bRet) return bRet - aRet;

            const aIss = new Date(a.issuedAt).getTime();
            const bIss = new Date(b.issuedAt).getTime();
            return bIss - aIss;
        });
    }, [issues, filterTab, searchQuery]);

    async function handleQuickApprove(e: React.MouseEvent, issueId: string) {
        e.stopPropagation();
        try {
            await auditIssue({
                issueId,
                payload: { action: "APPROVE" },
            }).unwrap();
            toast.success(
                "Tableware return approved! Inventory balances restored.",
            );
            void refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to approve audit.");
        }
    }

    const homeUrl = `/${role}`;

    return (
        <div className="space-y-4">
            {/* Top Navigation & Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
                <div className="space-y-1 min-w-0">
                    <Link
                        href={homeUrl}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-gray hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-3.5" />
                        Back to Queue
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                            <Boxes className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-normal text-foreground">
                                    Returnable Tableware & Materials
                                </h1>
                                {counts.pending > 0 && (
                                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white animate-pulse">
                                        {counts.pending} Awaiting Check
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-gray">
                                Monitor tableware checked out to delivery
                                waiters and verify returns to reconcile
                                inventory balances.
                            </p>
                        </div>
                    </div>
                </div>

                {/* View toggles & Refresh */}
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="h-8 px-2 text-slate-gray hover:text-foreground"
                        title="Refresh"
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                isFetching && "animate-spin",
                            )}
                        />
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
                            Cards
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
                            Table
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setFilterTab("pending")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                            filterTab === "pending"
                                ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-xs"
                                : "border-hairline bg-card text-slate-gray hover:bg-secondary/50",
                        )}
                    >
                        <AlertOctagon className="size-3.5 text-amber-600 dark:text-amber-400" />
                        Awaiting Audit ({counts.pending})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterTab("issued")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                            filterTab === "issued"
                                ? "bg-sky-500/15 border-sky-500/40 text-sky-900 dark:text-sky-200 shadow-xs"
                                : "border-hairline bg-card text-slate-gray hover:bg-secondary/50",
                        )}
                    >
                        <Boxes className="size-3.5 text-sky-600 dark:text-sky-400" />
                        With Waiters ({counts.issued})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterTab("disputed")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                            filterTab === "disputed"
                                ? "bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-200 shadow-xs"
                                : "border-hairline bg-card text-slate-gray hover:bg-secondary/50",
                        )}
                    >
                        <AlertTriangle className="size-3.5 text-rose-600 dark:text-rose-400" />
                        Disputed ({counts.disputed})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterTab("all")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                            filterTab === "all"
                                ? "bg-secondary border-border text-foreground shadow-xs"
                                : "border-hairline bg-card text-slate-gray hover:bg-secondary/50",
                        )}
                    >
                        All Issues ({counts.all})
                    </button>
                </div>

                <div className="relative min-w-[220px] flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search destination, waiter, item..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 text-xs bg-card border-hairline"
                    />
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="p-16 text-center text-xs text-muted-foreground">
                    <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading tableware issues...
                </div>
            ) : sortedIssues.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-hairline bg-card p-12 text-center text-slate-gray">
                    {filterTab === "pending" ? (
                        <>
                            <ShieldCheck className="size-12 text-emerald-500 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-foreground">
                                No tableware awaiting audit!
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                                All items returned by waiters have been verified
                                and reconciled. When delivery waiters mark items
                                returned, they will appear here.
                            </p>
                        </>
                    ) : (
                        <>
                            <Boxes className="size-12 text-muted-foreground/60 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-foreground">
                                No material issues found
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Try changing your filter or search query.
                            </p>
                        </>
                    )}
                </div>
            ) : view === "cards" ? (
                /* CARD VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {sortedIssues.map(issue => {
                        const isReturned = issue.status === "RETURNED";
                        const isDisputed = issue.status === "DISPUTED";
                        const destination =
                            issue.order?.outsideOrder?.destinationName ||
                            "Outside Order";
                        const customer =
                            issue.order?.outsideOrder?.customerName;
                        const waiterName =
                            issue.waiter?.employeeDisplayName ||
                            "Assigned Waiter";
                        const totalIssued = issue.lines.reduce(
                            (sum, l) => sum + parseQty(l.qtyIssued),
                            0,
                        );
                        const totalReturned = issue.lines.reduce(
                            (sum, l) => sum + parseQty(l.qtyReturned),
                            0,
                        );
                        const totalShortfall = issue.lines.reduce(
                            (sum, l) => sum + parseQty(l.qtyShortfall),
                            0,
                        );

                        return (
                            <div
                                key={issue.id}
                                onClick={() => {
                                    setSelectedIssue(issue);
                                    setShowAuditModal(true);
                                }}
                                className={cn(
                                    "rounded-2xl border p-4 space-y-3 cursor-pointer transition-all hover:shadow-md group",
                                    isReturned
                                        ? "border-amber-500/40 bg-card hover:border-amber-500/60 ring-1 ring-amber-500/20"
                                        : isDisputed
                                          ? "border-rose-500/40 bg-card hover:border-rose-500/60"
                                          : "border-hairline bg-card hover:border-border",
                                )}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2 border-b border-hairline pb-2.5">
                                    <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <MapPin className="size-3.5 text-primary shrink-0" />
                                            <span className="font-semibold text-foreground text-sm truncate">
                                                {destination}
                                            </span>
                                        </div>
                                        {customer && (
                                            <p className="text-[11px] text-slate-gray truncate">
                                                Recipient: {customer}
                                            </p>
                                        )}
                                    </div>

                                    <span
                                        className={cn(
                                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0",
                                            isReturned
                                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                                : issue.status === "APPROVED"
                                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                                  : isDisputed
                                                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                                                    : "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30",
                                        )}
                                    >
                                        {isReturned
                                            ? "Awaiting Audit"
                                            : issue.status}
                                    </span>
                                </div>

                                {/* Waiter & Timing Info */}
                                <div className="flex items-center justify-between text-xs text-slate-gray">
                                    <div className="flex items-center gap-1 font-medium text-foreground">
                                        <User className="size-3 text-muted-foreground" />
                                        <span>{waiterName}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px]">
                                        <Clock className="size-3" />
                                        <span>
                                            {isReturned
                                                ? `Returned ${formatTimeAgo(issue.returnedAt)}`
                                                : `Issued ${formatTimeAgo(issue.issuedAt)}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Items Overview Pills */}
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
                                        Tableware ({issue.lines.length} types ·{" "}
                                        {totalIssued} total pcs)
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {issue.lines.map(line => {
                                            const issued = parseQty(
                                                line.qtyIssued,
                                            );
                                            const ret = parseQty(
                                                line.qtyReturned,
                                            );
                                            const short = parseQty(
                                                line.qtyShortfall,
                                            );
                                            return (
                                                <span
                                                    key={line.id}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-hairline bg-muted/30 text-[11px]"
                                                >
                                                    <span className="font-semibold text-foreground">
                                                        {issued}×
                                                    </span>
                                                    <span className="text-muted-foreground truncate max-w-[120px]">
                                                        {
                                                            line.materialNameSnapshot
                                                        }
                                                    </span>
                                                    {isReturned && (
                                                        <span
                                                            className={cn(
                                                                "font-bold text-[10px]",
                                                                short > 0
                                                                    ? "text-rose-600 dark:text-rose-400"
                                                                    : "text-emerald-600 dark:text-emerald-400",
                                                            )}
                                                        >
                                                            ({ret}/{issued})
                                                        </span>
                                                    )}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Shortfall or Dispute notice */}
                                {totalShortfall > 0 && (
                                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-700 dark:text-rose-400 font-medium">
                                        Shortfall: {totalShortfall} item(s)
                                        missing or damaged
                                    </div>
                                )}
                                {issue.disputeReason && (
                                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-700 dark:text-rose-400">
                                        <strong>Dispute Note:</strong>{" "}
                                        {issue.disputeReason}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-hairline">
                                    <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">
                                        View Details{" "}
                                        <ExternalLink className="size-3" />
                                    </span>

                                    {(isReturned || isDisputed) && (
                                        <Button
                                            size="sm"
                                            onClick={e =>
                                                handleQuickApprove(e, issue.id)
                                            }
                                            disabled={auditing}
                                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
                                        >
                                            <Check className="size-3 mr-1" />
                                            Approve Audit
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* TABLE VIEW */
                <div className="overflow-x-auto rounded-2xl border border-hairline bg-card shadow-xs">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-hairline bg-muted/30 text-slate-gray">
                            <tr>
                                <th className="px-4 py-3 font-semibold">
                                    Destination
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Status
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Waiter
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Returned Time
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Tableware Items
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Shortfall
                                </th>
                                <th className="px-4 py-3 font-semibold text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                            {sortedIssues.map(issue => {
                                const isReturned = issue.status === "RETURNED";
                                const isDisputed = issue.status === "DISPUTED";
                                const destination =
                                    issue.order?.outsideOrder
                                        ?.destinationName || "Outside Order";
                                const waiterName =
                                    issue.waiter?.employeeDisplayName ||
                                    "Assigned Waiter";
                                const totalIssued = issue.lines.reduce(
                                    (sum, l) => sum + parseQty(l.qtyIssued),
                                    0,
                                );
                                const totalReturned = issue.lines.reduce(
                                    (sum, l) => sum + parseQty(l.qtyReturned),
                                    0,
                                );
                                const totalShortfall = issue.lines.reduce(
                                    (sum, l) => sum + parseQty(l.qtyShortfall),
                                    0,
                                );

                                return (
                                    <tr
                                        key={issue.id}
                                        onClick={() => {
                                            setSelectedIssue(issue);
                                            setShowAuditModal(true);
                                        }}
                                        className={cn(
                                            "hover:bg-muted/40 transition-colors cursor-pointer",
                                            isReturned && "bg-amber-500/[0.03]",
                                        )}
                                    >
                                        <td className="px-4 py-3 font-semibold text-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="size-3.5 text-primary" />
                                                <span>{destination}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                    isReturned
                                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                                        : issue.status ===
                                                            "APPROVED"
                                                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                                          : isDisputed
                                                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                                                            : "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30",
                                                )}
                                            >
                                                {isReturned
                                                    ? "Awaiting Audit"
                                                    : issue.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-gray font-medium">
                                            <div className="flex items-center gap-1">
                                                <User className="size-3" />
                                                <span className="text-foreground">
                                                    {waiterName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-gray">
                                            <div className="flex items-center gap-1">
                                                <Clock className="size-3" />
                                                <span>
                                                    {issue.returnedAt
                                                        ? formatTimeAgo(
                                                              issue.returnedAt,
                                                          )
                                                        : formatTimeAgo(
                                                              issue.issuedAt,
                                                          )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-foreground font-medium">
                                                {issue.lines.length} types (
                                                {totalIssued} pcs)
                                            </span>
                                            {isReturned && (
                                                <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    · {totalReturned} ret
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {totalShortfall > 0 ? (
                                                <span className="rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 font-bold">
                                                    {totalShortfall} short
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {(isReturned || isDisputed) && (
                                                    <Button
                                                        size="sm"
                                                        onClick={e =>
                                                            handleQuickApprove(
                                                                e,
                                                                issue.id,
                                                            )
                                                        }
                                                        disabled={auditing}
                                                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
                                                    >
                                                        Approve
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2 text-xs"
                                                >
                                                    Audit
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for detail / audit */}
            {showAuditModal && (
                <KitchenMaterialsAuditModal
                    onClose={() => {
                        setShowAuditModal(false);
                        setSelectedIssue(null);
                        void refetch();
                    }}
                />
            )}
        </div>
    );
}
