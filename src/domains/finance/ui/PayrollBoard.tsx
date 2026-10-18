"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MoreHorizontal, Plus } from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useApprovePayrollRunMutation,
    useCreatePayrollRunMutation,
    useGetPayrollRunQuery,
    useListPayrollRunsQuery,
    useMarkPayrollPaidMutation,
    useUpdatePayrollLineMutation,
    type PayrollLine,
    type PayrollRunSummary,
} from "@/context/services/payrollApi";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function formatEtb(n: number) {
    return `${n.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })} ETB`;
}

function toMonthKey(isoDate: string) {
    return isoDate.slice(0, 7);
}

function monthKeyNow() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthBoundsFromKey(monthKey: string) {
    const [ys, ms] = monthKey.split("-");
    const y = Number(ys);
    const m = Number(ms) - 1;
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0));
    const iso = (x: Date) => x.toISOString().slice(0, 10);
    const label = start.toLocaleString(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
    return { periodStart: iso(start), periodEnd: iso(end), label };
}

function statusClass(status: string) {
    switch (status) {
        case "PAID":
            return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
        case "APPROVED":
            return "bg-amber-500/10 text-amber-800 dark:text-amber-300";
        default:
            return "bg-secondary text-muted-foreground";
    }
}

export default function PayrollBoard() {
    const { data, isLoading, isError } = useListPayrollRunsQuery();
    const runs = data?.data ?? [];
    const [monthKey, setMonthKey] = useState(monthKeyNow);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [createRun, creating] = useCreatePayrollRunMutation();

    const monthRuns = useMemo(
        () => runs.filter(run => toMonthKey(run.periodStart) === monthKey),
        [runs, monthKey],
    );

    const activeRunId = useMemo(() => {
        if (selectedRunId && monthRuns.some(r => r.id === selectedRunId)) {
            return selectedRunId;
        }
        return monthRuns[0]?.id ?? null;
    }, [monthRuns, selectedRunId]);

    useEffect(() => {
        if (selectedRunId && !monthRuns.some(r => r.id === selectedRunId)) {
            setSelectedRunId(monthRuns[0]?.id ?? null);
        }
    }, [monthRuns, selectedRunId]);

    async function handleCreate() {
        const bounds = monthBoundsFromKey(monthKey);
        try {
            const res = await createRun({
                periodStart: bounds.periodStart,
                periodEnd: bounds.periodEnd,
                label: bounds.label,
            }).unwrap();
            setSelectedRunId(res.data.id);
            toast.success("Pay run created", bounds.label);
        } catch (err) {
            toast.fromUnknown(err, "Could not create pay run");
        }
    }

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Finance"
                    title="Payroll"
                    description="Monthly runs from HR rates. Pay each person or the whole run."
                />
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        type="month"
                        value={monthKey}
                        onChange={e => {
                            setMonthKey(e.target.value);
                            setSelectedRunId(null);
                        }}
                        className="h-9 w-[11.5rem]"
                        aria-label="Payroll period"
                    />
                    <Button
                        type="button"
                        onClick={() => void handleCreate()}
                        disabled={creating.isLoading}
                        className="gap-2"
                    >
                        {creating.isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Plus className="size-4" />
                        )}
                        New run
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <p className="text-[13px] text-muted-foreground">Loading…</p>
            ) : isError ? (
                <p className="text-[13px] text-destructive">
                    Could not load pay runs.
                </p>
            ) : (
                <div className="space-y-4">
                    <RunPicker
                        runs={monthRuns}
                        activeRunId={activeRunId}
                        onSelect={setSelectedRunId}
                        emptyMonth={monthKey}
                    />

                    {activeRunId ? (
                        <PayrollRunDetail runId={activeRunId} />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-hairline bg-card px-6 py-16 text-center text-[13px] text-muted-foreground">
                            No pay run for this month.
                        </div>
                    )}
                </div>
            )}
        </DashboardFrame>
    );
}

function RunPicker({
    runs,
    activeRunId,
    onSelect,
    emptyMonth,
}: {
    runs: PayrollRunSummary[];
    activeRunId: string | null;
    onSelect: (id: string) => void;
    emptyMonth: string;
}) {
    if (runs.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-hairline px-4 py-5 text-center text-[12px] text-muted-foreground">
                No runs in {emptyMonth}.
            </div>
        );
    }

    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {runs.map(run => {
                const active = activeRunId === run.id;
                return (
                    <button
                        key={run.id}
                        type="button"
                        onClick={() => onSelect(run.id)}
                        className={cn(
                            "min-w-[10rem] shrink-0 rounded-xl border px-3 py-2 text-left transition-colors",
                            active
                                ? "border-brand/40 bg-brand/5"
                                : "border-hairline bg-card hover:bg-secondary/40",
                        )}
                    >
                        <span className="block text-[13px] font-medium text-foreground">
                            {run.label || run.periodStart}
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                            <span
                                className={cn(
                                    "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                                    statusClass(run.status),
                                )}
                            >
                                {run.status}
                            </span>
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                                {formatEtb(run.totalNet)}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function PayrollRunDetail({ runId }: { runId: string }) {
    const { data, isLoading } = useGetPayrollRunQuery(runId);
    const [approve, approving] = useApprovePayrollRunMutation();
    const [markPaid, paying] = useMarkPayrollPaidMutation();
    const [editing, setEditing] = useState<PayrollLine | null>(null);
    const [tipping, setTipping] = useState<PayrollLine | null>(null);
    const [payMethod, setPayMethod] = useState<"CASH" | "BANK">("CASH");
    const [page, setPage] = useState(1);
    const [menuLineId, setMenuLineId] = useState<string | null>(null);

    const run = data?.data;
    const unpaidCount = useMemo(
        () => run?.lines.filter(l => !l.paidAt).length ?? 0,
        [run],
    );

    useEffect(() => {
        setPage(1);
        setMenuLineId(null);
    }, [runId, run?.lines.length]);

    async function payLine(line: PayrollLine) {
        try {
            await markPaid({
                runId,
                lineIds: [line.id],
                payMethod,
            }).unwrap();
            toast.success("Marked paid", line.staffName);
            setMenuLineId(null);
        } catch (err) {
            toast.fromUnknown(err, "Mark paid failed");
        }
    }

    const columns: DataTableColumn<PayrollLine>[] = useMemo(
        () => [
            {
                id: "person",
                header: "Person",
                hideable: false,
                sortValue: row => row.staffName,
                cell: row => (
                    <div>
                        <p className="font-medium text-foreground">
                            {row.staffName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            {row.roleCode || "—"}
                        </p>
                    </div>
                ),
            },
            {
                id: "type",
                header: "Type",
                sortValue: row => row.payType || "",
                cell: row => (
                    <span className="text-muted-foreground">
                        {row.payType || "—"}
                        {row.payType === "HOURLY" && row.regularHours != null
                            ? ` · ${row.regularHours}h`
                            : ""}
                    </span>
                ),
            },
            {
                id: "base",
                header: "Base",
                headerClassName: "text-right",
                className: "text-right tabular-nums",
                sortValue: row => row.baseGross,
                cell: row => formatEtb(row.baseGross),
            },
            {
                id: "ot",
                header: "OT",
                headerClassName: "text-right",
                className: "text-right tabular-nums",
                sortValue: row => row.otAmount,
                cell: row =>
                    row.otAmount > 0 ? (
                        <span>
                            {formatEtb(row.otAmount)}
                            {row.otHours > 0 ? (
                                <span className="block text-[10px] text-muted-foreground">
                                    {row.otHours}h
                                </span>
                            ) : null}
                        </span>
                    ) : (
                        "—"
                    ),
            },
            {
                id: "tip",
                header: "Tip",
                headerClassName: "text-right",
                className: "text-right tabular-nums",
                sortValue: row => row.tipAmount ?? 0,
                cell: row =>
                    (row.tipAmount ?? 0) > 0 ? formatEtb(row.tipAmount) : "—",
            },
            {
                id: "deduct",
                header: "Deduct",
                headerClassName: "text-right",
                className: "text-right tabular-nums text-muted-foreground",
                sortValue: row => row.deductions,
                cell: row =>
                    row.deductions > 0 ? formatEtb(row.deductions) : "—",
            },
            {
                id: "net",
                header: "Net",
                headerClassName: "text-right",
                className: "text-right font-medium tabular-nums",
                sortValue: row => row.net,
                cell: row => formatEtb(row.net),
            },
            {
                id: "paid",
                header: "Paid",
                sortValue: row => (row.paidAt ? 1 : 0),
                cell: row =>
                    row.paidAt ? (
                        <span className="text-emerald-700 dark:text-emerald-300">
                            {row.payMethod || "Paid"}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">Unpaid</span>
                    ),
            },
            {
                id: "actions",
                header: "",
                hideable: false,
                className: "w-[1%] whitespace-nowrap",
                cell: row => {
                    if (run?.status === "PAID") return null;
                    const canEdit = !row.paidAt;
                    const canPay = !row.paidAt;
                    if (!canEdit && !canPay) return null;
                    return (
                        <LineActionsMenu
                            open={menuLineId === row.id}
                            onOpenChange={open =>
                                setMenuLineId(open ? row.id : null)
                            }
                            canEdit={canEdit}
                            canPay={canPay}
                            paying={paying.isLoading}
                            onEdit={() => {
                                setMenuLineId(null);
                                setEditing(row);
                            }}
                            onAddTip={() => {
                                setMenuLineId(null);
                                setTipping(row);
                            }}
                            onMarkPaid={() => void payLine(row)}
                        />
                    );
                },
            },
        ],
        // payLine closes over markPaid/payMethod; include deps used inside menu
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [menuLineId, payMethod, paying.isLoading, run?.status, runId],
    );

    const totalPages = Math.max(
        1,
        Math.ceil((run?.lines.length ?? 0) / PAGE_SIZE),
    );
    const pageSafe = Math.min(page, totalPages);

    if (isLoading || !run) {
        return (
            <div className="rounded-2xl border border-hairline bg-card p-8 text-[13px] text-muted-foreground">
                Loading run…
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-2xl border border-hairline bg-card p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[15px] font-semibold text-foreground">
                            {run.label ||
                                `${run.periodStart} – ${run.periodEnd}`}
                        </h2>
                        <span
                            className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-medium",
                                statusClass(run.status),
                            )}
                        >
                            {run.status}
                        </span>
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                        {run.lineCount} people · Net {formatEtb(run.totalNet)}
                        {(run.totalTips ?? 0) > 0
                            ? ` · Tips ${formatEtb(run.totalTips)}`
                            : ""}
                        {run.totalOt > 0
                            ? ` · OT ${formatEtb(run.totalOt)}`
                            : ""}
                        {unpaidCount > 0 ? ` · ${unpaidCount} unpaid` : ""}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {unpaidCount > 0 ? (
                        <div className="flex rounded-lg border border-hairline p-0.5">
                            {(["CASH", "BANK"] as const).map(method => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setPayMethod(method)}
                                    className={cn(
                                        "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                                        payMethod === method
                                            ? "bg-secondary text-foreground"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    ) : null}

                    {run.status === "DRAFT" && run.lineCount > 0 ? (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={approving.isLoading}
                            onClick={async () => {
                                try {
                                    await approve(runId).unwrap();
                                    toast.success("Run approved");
                                } catch (err) {
                                    toast.fromUnknown(err, "Approve failed");
                                }
                            }}
                        >
                            {approving.isLoading ? "…" : "Approve"}
                        </Button>
                    ) : null}

                    {unpaidCount > 0 ? (
                        <Button
                            type="button"
                            size="sm"
                            disabled={paying.isLoading}
                            onClick={async () => {
                                try {
                                    await markPaid({
                                        runId,
                                        payMethod,
                                    }).unwrap();
                                    toast.success("All marked paid", payMethod);
                                } catch (err) {
                                    toast.fromUnknown(err, "Mark paid failed");
                                }
                            }}
                        >
                            {paying.isLoading
                                ? "Paying…"
                                : `Pay all (${payMethod})`}
                        </Button>
                    ) : null}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={run.lines}
                rowKey={row => row.id}
                searchPlaceholder="Search people…"
                searchText={row =>
                    `${row.staffName} ${row.roleCode || ""} ${row.payType || ""}`
                }
                empty="No people on this run."
                pagination={{
                    page: pageSafe,
                    totalPages,
                    total: run.lines.length,
                    limit: PAGE_SIZE,
                    onPageChange: setPage,
                }}
            />

            {editing ? (
                <LineEditSheet
                    runId={runId}
                    line={editing}
                    onClose={() => setEditing(null)}
                />
            ) : null}

            {tipping ? (
                <AddTipSheet
                    runId={runId}
                    line={tipping}
                    onClose={() => setTipping(null)}
                />
            ) : null}
        </div>
    );
}

function LineActionsMenu({
    open,
    onOpenChange,
    canEdit,
    canPay,
    paying,
    onEdit,
    onAddTip,
    onMarkPaid,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    canEdit: boolean;
    canPay: boolean;
    paying: boolean;
    onEdit: () => void;
    onAddTip: () => void;
    onMarkPaid: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onPointerDown(event: MouseEvent) {
            if (!ref.current?.contains(event.target as Node)) {
                onOpenChange(false);
            }
        }
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open, onOpenChange]);

    return (
        <div className="relative flex justify-end" ref={ref}>
            <Button
                type="button"
                size="sm"
                variant="ghost"
                className="size-8 p-0"
                aria-label="More actions"
                onClick={e => {
                    e.stopPropagation();
                    onOpenChange(!open);
                }}
            >
                <MoreHorizontal className="size-4" />
            </Button>
            {open ? (
                <div className="absolute top-[calc(100%+4px)] right-0 z-40 min-w-[10.5rem] overflow-hidden rounded-xl border border-hairline bg-card py-1 shadow-subtle">
                    {canEdit ? (
                        <>
                            <button
                                type="button"
                                className="flex w-full px-3 py-2 text-left text-[12px] text-foreground hover:bg-secondary"
                                onClick={e => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                            >
                                Edit OT / deduct
                            </button>
                            <div className="my-1 border-t border-hairline" />
                            <p className="px-3 py-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                Tip
                            </p>
                            <button
                                type="button"
                                className="flex w-full px-3 py-2 text-left text-[12px] text-foreground hover:bg-secondary"
                                onClick={e => {
                                    e.stopPropagation();
                                    onAddTip();
                                }}
                            >
                                Add tip
                            </button>
                        </>
                    ) : null}
                    {canPay ? (
                        <>
                            {canEdit ? (
                                <div className="my-1 border-t border-hairline" />
                            ) : null}
                            <button
                                type="button"
                                disabled={paying}
                                className="flex w-full px-3 py-2 text-left text-[12px] font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                                onClick={e => {
                                    e.stopPropagation();
                                    onMarkPaid();
                                }}
                            >
                                Mark paid
                            </button>
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

function AddTipSheet({
    runId,
    line,
    onClose,
}: {
    runId: string;
    line: PayrollLine;
    onClose: () => void;
}) {
    const [updateLine, updating] = useUpdatePayrollLineMutation();
    const [tipAmount, setTipAmount] = useState(
        line.tipAmount ? String(line.tipAmount) : "",
    );

    async function save() {
        const value = tipAmount === "" ? 0 : Number(tipAmount);
        if (Number.isNaN(value) || value < 0) {
            toast.error("Enter a valid tip amount");
            return;
        }
        try {
            await updateLine({
                runId,
                lineId: line.id,
                body: { tipAmount: value },
            }).unwrap();
            toast.success(
                value > 0 ? "Tip saved" : "Tip cleared",
                line.staffName,
            );
            onClose();
        } catch (err) {
            toast.fromUnknown(err, "Could not save tip");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <div className="w-full max-w-sm rounded-2xl border border-hairline bg-card p-5 shadow-lg">
                <h3 className="text-[15px] font-semibold text-foreground">
                    Add tip
                </h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {line.staffName} · added to net pay
                </p>
                <label className="mt-4 block space-y-1 text-[12px]">
                    <span className="text-muted-foreground">Tip (ETB)</span>
                    <Input
                        type="number"
                        min={0}
                        step="1"
                        autoFocus
                        value={tipAmount}
                        onChange={e => setTipAmount(e.target.value)}
                        className="h-9"
                        placeholder="0"
                    />
                </label>
                <div className="mt-5 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={updating.isLoading}
                        onClick={() => void save()}
                    >
                        {updating.isLoading ? "Saving…" : "Create tip"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function LineEditSheet({
    runId,
    line,
    onClose,
}: {
    runId: string;
    line: PayrollLine;
    onClose: () => void;
}) {
    const [updateLine, updating] = useUpdatePayrollLineMutation();
    const [otHours, setOtHours] = useState(String(line.otHours || ""));
    const [otRate, setOtRate] = useState(
        line.otRate != null ? String(line.otRate) : "",
    );
    const [otAmount, setOtAmount] = useState(
        line.otAmount ? String(line.otAmount) : "",
    );
    const [deductions, setDeductions] = useState(
        line.deductions ? String(line.deductions) : "",
    );
    const [regularHours, setRegularHours] = useState(
        line.regularHours != null ? String(line.regularHours) : "",
    );

    async function save() {
        try {
            await updateLine({
                runId,
                lineId: line.id,
                body: {
                    ...(line.payType === "HOURLY" && regularHours !== ""
                        ? { regularHours: Number(regularHours) }
                        : {}),
                    otHours: otHours === "" ? 0 : Number(otHours),
                    ...(otRate !== "" ? { otRate: Number(otRate) } : {}),
                    ...(otAmount !== "" ? { otAmount: Number(otAmount) } : {}),
                    deductions: deductions === "" ? 0 : Number(deductions),
                },
            }).unwrap();
            toast.success("Line updated", line.staffName);
            onClose();
        } catch (err) {
            toast.fromUnknown(err, "Could not update line");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <div className="w-full max-w-md rounded-2xl border border-hairline bg-card p-5 shadow-lg">
                <h3 className="text-[15px] font-semibold text-foreground">
                    {line.staffName}
                </h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Base {formatEtb(line.baseGross)} · OT and deductions
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {line.payType === "HOURLY" ? (
                        <label className="space-y-1 text-[12px]">
                            <span className="text-muted-foreground">
                                Regular hours
                            </span>
                            <Input
                                type="number"
                                min={0}
                                step="0.25"
                                value={regularHours}
                                onChange={e => setRegularHours(e.target.value)}
                                className="h-9"
                            />
                        </label>
                    ) : null}
                    <label className="space-y-1 text-[12px]">
                        <span className="text-muted-foreground">OT hours</span>
                        <Input
                            type="number"
                            min={0}
                            step="0.25"
                            value={otHours}
                            onChange={e => setOtHours(e.target.value)}
                            className="h-9"
                        />
                    </label>
                    <label className="space-y-1 text-[12px]">
                        <span className="text-muted-foreground">
                            OT rate (ETB/h)
                        </span>
                        <Input
                            type="number"
                            min={0}
                            step="1"
                            value={otRate}
                            onChange={e => setOtRate(e.target.value)}
                            className="h-9"
                            placeholder="1.5× hourly"
                        />
                    </label>
                    <label className="space-y-1 text-[12px]">
                        <span className="text-muted-foreground">
                            OT amount override
                        </span>
                        <Input
                            type="number"
                            min={0}
                            step="1"
                            value={otAmount}
                            onChange={e => setOtAmount(e.target.value)}
                            className="h-9"
                            placeholder="Optional fixed ETB"
                        />
                    </label>
                    <label className="space-y-1 text-[12px] sm:col-span-2">
                        <span className="text-muted-foreground">
                            Deductions
                        </span>
                        <Input
                            type="number"
                            min={0}
                            step="1"
                            value={deductions}
                            onChange={e => setDeductions(e.target.value)}
                            className="h-9"
                        />
                    </label>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={updating.isLoading}
                        onClick={() => void save()}
                    >
                        {updating.isLoading ? "Saving…" : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
