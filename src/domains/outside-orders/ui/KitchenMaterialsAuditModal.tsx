"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
    Boxes,
    CheckCircle2,
    AlertTriangle,
    X,
    Loader2,
    RefreshCw,
    Search,
    User,
    Clock,
    MapPin,
    AlertOctagon,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useListActiveMaterialIssuesQuery,
    useAuditMaterialIssueMutation,
    type OrderMaterialIssue,
} from "@/context/services/outsideOrdersApi";
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

type TabKey = "pending" | "issued" | "disputed" | "all";

export default function KitchenMaterialsAuditModal({
    onClose,
}: {
    onClose: () => void;
}) {
    const {
        data: issuesRes,
        isLoading,
        isFetching,
        refetch,
    } = useListActiveMaterialIssuesQuery(undefined, {
        pollingInterval: 10000,
    });

    const [auditIssue, { isLoading: auditing }] =
        useAuditMaterialIssueMutation();

    const [activeTab, setActiveTab] = useState<TabKey>("pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [disputeIssueId, setDisputeIssueId] = useState<string | null>(null);
    const [disputeReason, setDisputeReason] = useState("");

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

    const filteredIssues = useMemo(() => {
        let list = issues;
        if (activeTab === "pending") {
            list = list.filter(i => i.status === "RETURNED");
        } else if (activeTab === "issued") {
            list = list.filter(i => i.status === "ISSUED");
        } else if (activeTab === "disputed") {
            list = list.filter(i => i.status === "DISPUTED");
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(i => {
                const dest = (
                    i.order?.outsideOrder?.destinationName || ""
                ).toLowerCase();
                const waiter = (
                    i.waiter?.employeeDisplayName || ""
                ).toLowerCase();
                const items = i.lines.some(l =>
                    l.materialNameSnapshot.toLowerCase().includes(q),
                );
                return dest.includes(q) || waiter.includes(q) || items;
            });
        }

        return list;
    }, [issues, activeTab, searchQuery]);

    async function handleApprove(issueId: string) {
        try {
            await auditIssue({
                issueId,
                payload: { action: "APPROVE" },
            }).unwrap();
            toast.success(
                "Materials audit approved! Inventory balances restored.",
            );
            void refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to approve audit.");
        }
    }

    async function handleConfirmDispute(issueId: string) {
        if (!disputeReason.trim()) {
            toast.error("Please enter a dispute reason (e.g. missing plate).");
            return;
        }

        try {
            await auditIssue({
                issueId,
                payload: {
                    action: "DISPUTE",
                    disputeReason: disputeReason.trim(),
                },
            }).unwrap();
            toast.success("Dispute recorded.");
            setDisputeIssueId(null);
            setDisputeReason("");
            void refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to dispute.");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-4xl rounded-xl border border-border bg-background p-5 animate-in fade-in-50 zoom-in-95 max-h-[92vh] flex flex-col shadow-2xl text-foreground">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                            <Boxes className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-foreground">
                                    Returnable Tableware Verification & Audit
                                </h3>
                                {counts.pending > 0 && (
                                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white animate-pulse">
                                        {counts.pending} Awaiting Check
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Verify physical tableware brought back by
                                waiters and reconcile inventory balances.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void refetch()}
                            disabled={isFetching}
                            className="size-8 p-0 text-muted-foreground hover:text-foreground"
                            title="Refresh"
                        >
                            <RefreshCw
                                className={cn(
                                    "size-4",
                                    isFetching && "animate-spin",
                                )}
                            />
                        </Button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Tabs & Search Filter */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 border-b border-border/40">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setActiveTab("pending")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                activeTab === "pending"
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                        >
                            <AlertOctagon className="size-3.5" />
                            Awaiting Audit ({counts.pending})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("issued")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                activeTab === "issued"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                        >
                            <Boxes className="size-3.5" />
                            With Waiters ({counts.issued})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("disputed")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                activeTab === "disputed"
                                    ? "bg-rose-600 text-white shadow-sm"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                        >
                            <AlertTriangle className="size-3.5" />
                            Disputed ({counts.disputed})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("all")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                activeTab === "all"
                                    ? "bg-secondary text-foreground border border-border shadow-sm"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                        >
                            All Active ({counts.all})
                        </button>
                    </div>

                    <div className="relative min-w-[200px] flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search destination, waiter, item..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 text-xs bg-muted/30 border-border"
                        />
                    </div>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto space-y-3.5 my-3 pr-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-muted-foreground">
                            <Loader2 className="size-6 animate-spin mb-2 text-primary" />
                            Loading returnable tableware status...
                        </div>
                    ) : filteredIssues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border/70 bg-muted/10">
                            {activeTab === "pending" ? (
                                <>
                                    <ShieldCheck className="size-10 text-emerald-500 mb-2" />
                                    <p className="font-semibold text-foreground text-sm">
                                        All clear! No tableware awaiting audit
                                    </p>
                                    <p className="mt-1 max-w-sm">
                                        When waiters bring back tableware from
                                        outside orders, they will appear here
                                        for verification.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Boxes className="size-10 text-muted-foreground/60 mb-2" />
                                    <p className="font-semibold text-foreground text-sm">
                                        No material issues found
                                    </p>
                                    <p className="mt-1">
                                        No records match the current filter or
                                        search criteria.
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredIssues.map(issue => {
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

                            return (
                                <div
                                    key={issue.id}
                                    className={cn(
                                        "rounded-xl border p-4 space-y-3 transition-all",
                                        isReturned
                                            ? "border-amber-500/40 bg-amber-500/[0.03] shadow-xs"
                                            : isDisputed
                                              ? "border-rose-500/40 bg-rose-500/[0.03]"
                                              : "border-border bg-card",
                                    )}
                                >
                                    {/* Issue Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="size-4 text-primary" />
                                                <h4 className="text-sm font-bold text-foreground">
                                                    {destination}
                                                </h4>
                                                <span
                                                    className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                                        issue.status ===
                                                            "RETURNED"
                                                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                                            : issue.status ===
                                                                "APPROVED"
                                                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                                              : issue.status ===
                                                                  "DISPUTED"
                                                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                                                                : "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30",
                                                    )}
                                                >
                                                    {issue.status === "RETURNED"
                                                        ? "Awaiting Chef Verification"
                                                        : issue.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <User className="size-3" />
                                                    Waiter:{" "}
                                                    <strong className="text-foreground">
                                                        {waiterName}
                                                    </strong>
                                                </span>
                                                {customer && (
                                                    <span>
                                                        Customer:{" "}
                                                        <span className="text-foreground">
                                                            {customer}
                                                        </span>
                                                    </span>
                                                )}
                                                {issue.returnedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="size-3" />
                                                        Returned:{" "}
                                                        {new Date(
                                                            issue.returnedAt,
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            },
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions for Chef */}
                                        <div className="flex items-center gap-2">
                                            {(isReturned || isDisputed) && (
                                                <>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleApprove(
                                                                issue.id,
                                                            )
                                                        }
                                                        disabled={auditing}
                                                        className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-sm"
                                                    >
                                                        <CheckCircle2 className="size-3.5 mr-1" />
                                                        Approve Audit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setDisputeIssueId(
                                                                disputeIssueId ===
                                                                    issue.id
                                                                    ? null
                                                                    : issue.id,
                                                            );
                                                            setDisputeReason(
                                                                "",
                                                            );
                                                        }}
                                                        disabled={auditing}
                                                        className="h-8 px-3 text-xs border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 font-semibold cursor-pointer"
                                                    >
                                                        <AlertTriangle className="size-3.5 mr-1" />
                                                        Dispute
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dispute Reason Box if toggled */}
                                    {disputeIssueId === issue.id && (
                                        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 space-y-2 animate-in fade-in-50">
                                            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                                                Record Tableware Shortfall /
                                                Damage:
                                            </p>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Reason (e.g. 1 dinner plate broken / missing tableware)..."
                                                    value={disputeReason}
                                                    onChange={e =>
                                                        setDisputeReason(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8 text-xs bg-background border-rose-500/30"
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleConfirmDispute(
                                                            issue.id,
                                                        )
                                                    }
                                                    disabled={auditing}
                                                    className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
                                                >
                                                    Confirm
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setDisputeIssueId(null)
                                                    }
                                                    className="h-8 px-2 text-xs text-muted-foreground"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Existing Note or Dispute reason */}
                                    {issue.note && (
                                        <div className="rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
                                            <strong className="text-foreground">
                                                Note:
                                            </strong>{" "}
                                            {issue.note}
                                        </div>
                                    )}
                                    {issue.disputeReason && (
                                        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-700 dark:text-rose-400 font-medium">
                                            <strong>Dispute Reason:</strong>{" "}
                                            {issue.disputeReason}
                                        </div>
                                    )}

                                    {/* Line Items Table */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {issue.lines.map(line => {
                                            const issued = parseQty(
                                                line.qtyIssued,
                                            );
                                            const returned = parseQty(
                                                line.qtyReturned,
                                            );
                                            const shortfall = parseQty(
                                                line.qtyShortfall,
                                            );
                                            const hasShortfall =
                                                shortfall > 0 ||
                                                (issued > 0 &&
                                                    returned < issued &&
                                                    isReturned);

                                            return (
                                                <div
                                                    key={line.id}
                                                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {line.material
                                                            ?.imageUrl ? (
                                                            <div className="size-8 rounded border border-border/70 overflow-hidden relative shrink-0">
                                                                <Image
                                                                    src={
                                                                        line
                                                                            .material
                                                                            .imageUrl
                                                                    }
                                                                    alt={
                                                                        line.materialNameSnapshot
                                                                    }
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="size-8 rounded border border-border/70 bg-muted/40 flex items-center justify-center shrink-0">
                                                                <Boxes className="size-4 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                                                                {
                                                                    line.materialNameSnapshot
                                                                }
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                Issued:{" "}
                                                                <strong className="text-foreground">
                                                                    {issued}
                                                                </strong>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right text-[11px] shrink-0">
                                                        {returned > 0 ? (
                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                Ret: {returned}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                Ret: 0
                                                            </span>
                                                        )}
                                                        {hasShortfall && (
                                                            <div className="font-bold text-rose-600 dark:text-rose-400">
                                                                Short:{" "}
                                                                {shortfall > 0
                                                                    ? shortfall
                                                                    : issued -
                                                                      returned}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
                    <div>
                        Auto-refreshes every 10 seconds. Clicking{" "}
                        <strong>Approve Audit</strong> returns tableware into
                        system stock immediately.
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        className="h-8 px-4 text-xs font-medium"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
