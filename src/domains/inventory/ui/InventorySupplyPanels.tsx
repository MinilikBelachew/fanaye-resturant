"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    useApproveSupplyRequestMutation,
    useCreateSupplyRequestMutation,
    useListInventoryIngredientsQuery,
    useListSupplyRequestsQuery,
    useRejectSupplyRequestMutation,
    useStartPreparingSupplyRequestMutation,
    type InventorySupplyRequest,
} from "@/context/services/inventoryApi";
import { useGetTenantSiteQuery } from "@/context/services/siteApi";
import { useAppSelector } from "@/context/hooks";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import {
    InventoryMultiSelect,
    PrimaryActionButton,
    QtyLineCard,
    parsePositiveQty,
} from "@/domains/inventory/ui/InventoryFormControls";
import { UnitPicker } from "@/domains/inventory/ui/UnitPicker";
import { formatQty } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
    Boxes,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    FileCheck,
    Loader2,
    Truck,
    X,
    XCircle,
} from "lucide-react";
import { ApproveSupplyModal } from "@/domains/inventory/ui/ApproveSupplyModal";

type SupplyLine = {
    ingredientId: string;
    name: string;
    unit: string;
    typedUnit: string;
    quantity: string;
};

export function RequestSupplyPanel() {
    const t = useTranslations("inventory");
    const { data: ingredientsRes } = useListInventoryIngredientsQuery({
        page: 1,
        limit: 100,
    });
    const catalog = ingredientsRes?.data ?? [];
    const [createRequest, creating] = useCreateSupplyRequestMutation();

    const [note, setNote] = useState("");
    const [lines, setLines] = useState<SupplyLine[]>([]);
    const [triedSubmit, setTriedSubmit] = useState(false);

    const selectedIds = useMemo(
        () => new Set(lines.map(l => l.ingredientId)),
        [lines],
    );

    const lineErrors = useMemo(() => {
        const map = new Map<string, string>();
        for (const line of lines) {
            if (
                line.quantity !== "" &&
                parsePositiveQty(line.quantity) == null
            ) {
                map.set(line.ingredientId, t("errQtyInvalid"));
            } else if (triedSubmit && parsePositiveQty(line.quantity) == null) {
                map.set(line.ingredientId, t("errQtyRequired"));
            }
        }
        return map;
    }, [lines, triedSubmit, t]);

    const validLines = useMemo(
        () =>
            lines
                .map(l => ({
                    ingredientId: l.ingredientId,
                    quantity: parsePositiveQty(l.quantity),
                    typedUnit: l.typedUnit,
                    unit: l.unit,
                }))
                .filter(
                    (
                        l,
                    ): l is {
                        ingredientId: string;
                        quantity: number;
                        typedUnit: string;
                        unit: string;
                    } => l.quantity != null,
                ),
        [lines],
    );

    const canSubmit =
        validLines.length > 0 && validLines.length === lines.length;

    function toggleLine(ingredientId: string) {
        const ing = catalog.find(i => i.id === ingredientId);
        if (!ing) return;
        setLines(prev => {
            if (prev.some(l => l.ingredientId === ingredientId)) {
                return prev.filter(l => l.ingredientId !== ingredientId);
            }
            return [
                ...prev,
                {
                    ingredientId: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    typedUnit: ing.unit,
                    quantity: "",
                },
            ];
        });
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setTriedSubmit(true);
        if (lines.length === 0) {
            toast.error(t("errSupplyIncomplete"));
            return;
        }
        if (!canSubmit) {
            toast.error(t("errFixLineQuantities"));
            return;
        }
        try {
            await createRequest({
                note: note.trim() || undefined,
                lines: validLines.map(l => ({
                    ingredientId: l.ingredientId,
                    quantity: l.quantity,
                    ...(l.typedUnit !== l.unit ? { unit: l.typedUnit } : {}),
                })),
            }).unwrap();
            toast.success(t("toastSupplyRequested"));
            setLines([]);
            setNote("");
            setTriedSubmit(false);
        } catch (err) {
            toast.fromUnknown(err, t("errSupplyRequest"));
        }
    }

    return (
        <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-hairline p-4"
        >
            <div>
                <h3 className="text-[14px] font-semibold">
                    {t("requestSupplyTitle")}
                </h3>
                <p className="mt-1 text-[12px] text-slate-gray">
                    {t("requestSupplyHint")}
                </p>
            </div>

            <div className="space-y-1 text-[12px]">
                <span className="font-medium text-slate-gray">
                    {t("fieldItemsToRequest")}
                </span>
                <InventoryMultiSelect
                    placeholder={t("selectInputsPlaceholder")}
                    searchPlaceholder={t("searchInputsPlaceholder")}
                    emptyLabel={t("emptyInputOptions")}
                    selectedCountLabel={count =>
                        t("inputsSelectedCount", { count })
                    }
                    options={catalog.map(ing => ({
                        value: ing.id,
                        label: ing.name,
                        hint: ing.unit,
                    }))}
                    selectedIds={selectedIds}
                    onToggle={toggleLine}
                    error={
                        triedSubmit && lines.length === 0
                            ? t("errSupplyIncomplete")
                            : undefined
                    }
                />
            </div>

            <ul className="space-y-2">
                {lines.map(line => (
                    <QtyLineCard
                        key={line.ingredientId}
                        title={line.name}
                        quantity={line.quantity}
                        unit={line.unit}
                        unitNode={
                            <UnitPicker
                                compact
                                baseUnit={line.unit}
                                value={line.typedUnit}
                                onChange={v =>
                                    setLines(prev =>
                                        prev.map(l =>
                                            l.ingredientId === line.ingredientId
                                                ? { ...l, typedUnit: v }
                                                : l,
                                        ),
                                    )
                                }
                            />
                        }
                        quantityPlaceholder={t("fieldQuantity")}
                        removeLabel={t("removeLine")}
                        error={lineErrors.get(line.ingredientId)}
                        onQuantityChange={v =>
                            setLines(prev =>
                                prev.map(l =>
                                    l.ingredientId === line.ingredientId
                                        ? { ...l, quantity: v }
                                        : l,
                                ),
                            )
                        }
                        onRemove={() => toggleLine(line.ingredientId)}
                    />
                ))}
                {lines.length === 0 ? (
                    <li className="text-[13px] text-slate-gray">
                        {t("emptySupplyLines")}
                    </li>
                ) : null}
            </ul>

            <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t("colNote")}
                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
            />
            <PrimaryActionButton
                loading={creating.isLoading}
                disabled={!canSubmit && triedSubmit}
            >
                {creating.isLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                {t("submitSupplyRequest")}
            </PrimaryActionButton>
        </form>
    );
}

export function PendingSupplyPanel() {
    const t = useTranslations("inventory");
    const { data: siteRes } = useGetTenantSiteQuery();
    const staff = useAppSelector(selectCurrentStaff);
    const isOwner = staff?.role === "OWNER_ADMIN";
    const requireOwnerApproval = !siteRes?.data?.autoApproveSupplyRequests;

    const [statusFilter, setStatusFilter] = useState<
        "ALL" | "SUBMITTED" | "APPROVED" | "PREPARING"
    >("ALL");

    const { data, isLoading } = useListSupplyRequestsQuery({
        page: 1,
        limit: 50,
        direction: "pending",
        status: statusFilter === "ALL" ? undefined : statusFilter,
    });

    const [approve, approving] = useApproveSupplyRequestMutation();
    const [startPreparing, preparing] =
        useStartPreparingSupplyRequestMutation();
    const [reject, rejecting] = useRejectSupplyRequestMutation();
    const [dispatchingReq, setDispatchingReq] =
        useState<InventorySupplyRequest | null>(null);

    const requests = data?.data ?? [];
    const busy =
        approving.isLoading || preparing.isLoading || rejecting.isLoading;

    async function onApprove(req: InventorySupplyRequest) {
        try {
            await approve({
                id: req.id,
                decisionNote: "Approved by Owner",
            }).unwrap();
            toast.success(
                "Supply request approved. Central warehouse can now prepare.",
            );
        } catch (err) {
            toast.fromUnknown(err, "Failed to approve request.");
        }
    }

    async function onStartPrepare(req: InventorySupplyRequest) {
        try {
            await startPreparing({ id: req.id }).unwrap();
            toast.success("Preparation started. Status updated to PREPARING.");
        } catch (err) {
            toast.fromUnknown(err, "Failed to start preparation.");
        }
    }

    async function onReject(req: InventorySupplyRequest) {
        try {
            await reject({
                id: req.id,
                decisionNote: t("rejectDefaultNote"),
            }).unwrap();
            toast.success(t("toastSupplyRejected"));
        } catch (err) {
            toast.fromUnknown(err, t("errSupplyReject"));
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-[13px] text-slate-gray py-8 justify-center">
                <Loader2 className="size-4 animate-spin text-brand" />
                {t("loadingSupply")}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-hairline">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-ivory/60 border border-hairline text-xs font-medium">
                    {(
                        ["ALL", "SUBMITTED", "APPROVED", "PREPARING"] as const
                    ).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setStatusFilter(tab)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg transition-all",
                                statusFilter === tab
                                    ? "bg-white text-foreground shadow-sm font-semibold dark:bg-card"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            {tab === "ALL" && "All Requests"}
                            {tab === "SUBMITTED" && "Awaiting Approval"}
                            {tab === "APPROVED" && "Ready to Prepare"}
                            {tab === "PREPARING" && "In Preparation"}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-slate-gray">
                    {requireOwnerApproval
                        ? "Owner approval setting: ON (Owner review required)"
                        : "Owner approval setting: OFF (Direct preparation)"}
                </p>
            </div>

            {requests.length === 0 ? (
                <div className="rounded-2xl border border-hairline px-4 py-12 text-center">
                    <p className="text-[13px] font-medium text-slate-gray">
                        {t("emptyPendingSupply")}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-gray/80">
                        {statusFilter === "ALL"
                            ? "All branch supply requests have been fulfilled or dispatched."
                            : `No supply requests in ${statusFilter} status.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(req => {
                        const canStorekeeperPrepare =
                            req.status === "APPROVED" ||
                            (!requireOwnerApproval &&
                                req.status === "SUBMITTED");

                        return (
                            <div
                                key={req.id}
                                className="rounded-2xl border border-hairline bg-surface-card p-4 transition-all shadow-subtle hover:border-brand/30"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-semibold text-foreground">
                                                {req.fromLocation.name}
                                            </p>
                                            <span className="text-slate-gray text-xs">
                                                →
                                            </span>
                                            <p className="text-[13px] text-slate-gray">
                                                {req.toLocation.name}
                                            </p>
                                        </div>

                                        {/* Status Pill Badge */}
                                        <div className="flex items-center gap-2">
                                            {req.status === "SUBMITTED" && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                    <Clock className="size-3" />
                                                    Awaiting Owner Approval
                                                </span>
                                            )}
                                            {req.status === "APPROVED" && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                    <FileCheck className="size-3" />
                                                    Approved by Owner · Ready to
                                                    Prepare
                                                </span>
                                            )}
                                            {req.status === "PREPARING" && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20 animate-pulse">
                                                    <Boxes className="size-3" />
                                                    Warehouse Storekeeper
                                                    Preparing
                                                </span>
                                            )}
                                            {req.status === "REJECTED" && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 border border-red-500/20">
                                                    <XCircle className="size-3" />
                                                    Rejected
                                                </span>
                                            )}
                                            {req.submittedAt && (
                                                <span className="text-[11px] text-slate-gray">
                                                    Submitted{" "}
                                                    {new Date(
                                                        req.submittedAt,
                                                    ).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* OWNER APPROVAL ACTIONS */}
                                        {req.status === "SUBMITTED" &&
                                            isOwner && (
                                                <>
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() =>
                                                            void onApprove(req)
                                                        }
                                                        className="inline-flex items-center gap-1.5 h-8.5 rounded-xl bg-emerald-600 px-3 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60 transition-colors"
                                                    >
                                                        <CheckCircle2 className="size-3.5" />
                                                        Approve Request
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() =>
                                                            void onReject(req)
                                                        }
                                                        className="inline-flex items-center gap-1 h-8.5 rounded-xl border border-hairline px-3 text-[12px] font-medium text-slate-gray hover:bg-surface-ivory disabled:opacity-60 transition-colors"
                                                    >
                                                        <X className="size-3.5" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                        {/* AWAITING OWNER MESSAGE FOR NON-OWNER */}
                                        {req.status === "SUBMITTED" &&
                                            !isOwner &&
                                            requireOwnerApproval && (
                                                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 flex items-center gap-1.5">
                                                    <Clock className="size-3.5" />
                                                    Pending Owner Approval
                                                </span>
                                            )}

                                        {/* STOREKEEPER START PREPARING ACTION */}
                                        {canStorekeeperPrepare && (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() =>
                                                    void onStartPrepare(req)
                                                }
                                                className="inline-flex items-center gap-1.5 h-8.5 rounded-xl bg-indigo-600 px-3 text-[12px] font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 transition-colors"
                                            >
                                                <Boxes className="size-3.5" />
                                                Start Preparing
                                            </button>
                                        )}

                                        {/* STOREKEEPER DISPATCH & SHIP ACTION */}
                                        {req.status === "PREPARING" && (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() =>
                                                    setDispatchingReq(req)
                                                }
                                                className="inline-flex items-center gap-1.5 h-8.5 rounded-xl bg-brand px-3.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60 transition-colors"
                                            >
                                                <Truck className="size-3.5" />
                                                Dispatch & Ship
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Items list */}
                                <div className="mt-3 pt-3 border-t border-hairline">
                                    <p className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider mb-1.5">
                                        Requested Items ({req.lines.length})
                                    </p>
                                    <div className="grid gap-1.5 sm:grid-cols-2">
                                        {req.lines.map(line => (
                                            <div
                                                key={line.id}
                                                className="flex items-center justify-between rounded-lg bg-surface-ivory/50 px-2.5 py-1 text-[12px] border border-hairline/60"
                                            >
                                                <span className="font-medium text-foreground">
                                                    {line.ingredient.name}
                                                </span>
                                                <span className="font-semibold text-brand">
                                                    {formatQty(
                                                        line.quantityRequested,
                                                    )}{" "}
                                                    <span className="text-[10px] text-slate-gray font-normal">
                                                        {line.unit ??
                                                            line.ingredient
                                                                .unit}
                                                    </span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {req.note && (
                                    <p className="mt-2 text-[11px] text-slate-gray italic bg-surface-ivory/40 p-2 rounded-lg">
                                        Note: {req.note}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal for dispatching prepared supply requests */}
            <ApproveSupplyModal
                open={Boolean(dispatchingReq)}
                request={dispatchingReq}
                onClose={() => setDispatchingReq(null)}
            />
        </div>
    );
}

export function MySupplyRequestsPanel() {
    const t = useTranslations("inventory");
    const { data, isLoading } = useListSupplyRequestsQuery({
        page: 1,
        limit: 50,
        direction: "mine",
    });
    const requests = data?.data ?? [];
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    function toggleExpand(id: string) {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin text-brand" />
                {t("loadingSupply")}
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <p className="rounded-2xl border border-hairline px-4 py-8 text-center text-[13px] text-slate-gray">
                {t("emptyMySupply")}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-[12px] text-slate-gray">
                Real-time tracking of stock requisitions sent from your branch
                to the central warehouse.
            </p>

            <div className="space-y-2.5">
                {requests.map(req => {
                    const isExpanded = expandedIds.has(req.id);
                    return (
                        <div
                            key={req.id}
                            className="rounded-2xl border border-hairline bg-surface-card p-4 transition-all shadow-subtle hover:border-hairline/80"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[14px] font-semibold text-foreground">
                                            Request #{req.id.slice(0, 8)}
                                        </p>
                                        <span className="text-[11px] text-slate-gray">
                                            {new Date(
                                                req.createdAt,
                                            ).toLocaleDateString()}{" "}
                                            ·{" "}
                                            {new Date(
                                                req.createdAt,
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-slate-gray mt-0.5">
                                        {req.lines.length} items requested from{" "}
                                        {req.toLocation.name}
                                    </p>
                                </div>

                                {/* Status tracker badge */}
                                <div className="flex items-center gap-2">
                                    {req.status === "SUBMITTED" && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[12px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                            <Clock className="size-3.5" />
                                            Awaiting Owner Approval
                                        </span>
                                    )}
                                    {req.status === "APPROVED" && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[12px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                            <FileCheck className="size-3.5" />
                                            Approved · Queued for Packing
                                        </span>
                                    )}
                                    {req.status === "PREPARING" && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-[12px] font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20 animate-pulse">
                                            <Boxes className="size-3.5" />
                                            Warehouse Preparing & Packing
                                        </span>
                                    )}
                                    {(req.status === "FULFILLED" ||
                                        req.status === "DISPATCHED") && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            <Truck className="size-3.5" />
                                            Dispatched · In Transit
                                        </span>
                                    )}
                                    {req.status === "REJECTED" && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[12px] font-semibold text-red-600 border border-red-500/20">
                                            <XCircle className="size-3.5" />
                                            Rejected by Owner
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(req.id)}
                                        className="p-1 rounded-lg hover:bg-surface-ivory text-slate-gray"
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="size-4" />
                                        ) : (
                                            <ChevronDown className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Summary preview or expanded detail */}
                            {!isExpanded ? (
                                <p className="mt-2 text-[12px] text-slate-gray truncate">
                                    {req.lines
                                        .map(
                                            l =>
                                                `${l.ingredient.name} (${formatQty(l.quantityRequested)} ${l.unit ?? l.ingredient.unit})`,
                                        )
                                        .join(", ")}
                                </p>
                            ) : (
                                <div className="mt-3 pt-3 border-t border-hairline space-y-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                        Line Items
                                    </p>
                                    <div className="grid gap-1.5 sm:grid-cols-2">
                                        {req.lines.map(line => (
                                            <div
                                                key={line.id}
                                                className="flex items-center justify-between rounded-lg bg-surface-ivory/50 px-2.5 py-1 text-[12px] border border-hairline/60"
                                            >
                                                <span className="font-medium text-foreground">
                                                    {line.ingredient.name}
                                                </span>
                                                <span className="font-semibold text-brand">
                                                    {formatQty(
                                                        line.quantityRequested,
                                                    )}{" "}
                                                    <span className="text-[10px] text-slate-gray font-normal">
                                                        {line.unit ??
                                                            line.ingredient
                                                                .unit}
                                                    </span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {req.decisionNote && (
                                        <p className="mt-2 text-[11px] text-slate-gray bg-surface-ivory/50 p-2 rounded-lg">
                                            Decision Note: {req.decisionNote}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
