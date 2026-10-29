"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
    AlertTriangle,
    Boxes,
    Building2,
    Check,
    CheckCircle2,
    Clock,
    Coffee,
    ExternalLink,
    Loader2,
    MapPin,
    MessageSquarePlus,
    Phone,
    Plus,
    RefreshCw,
    ShieldAlert,
    Store,
    Trash2,
    User,
    Utensils,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    useGetOutsideOrderQuery,
    useCloseOutsideOrderMutation,
    type OrderMaterialIssue,
} from "@/context/services/outsideOrdersApi";
import AddOrderMenu from "@/domains/floor/ui/AddOrderMenu";
import IssueMaterialsModal from "./IssueMaterialsModal";
import ReturnMaterialsModal from "./ReturnMaterialsModal";
import RequestMaterialsModal from "./RequestMaterialsModal";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/context/hooks";

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

export default function OutsideOrderDetailModal({
    outsideOrderId,
    onClose,
}: {
    outsideOrderId: string;
    onClose: () => void;
}) {
    const {
        data: orderRes,
        isLoading,
        refetch,
    } = useGetOutsideOrderQuery(outsideOrderId);
    const order = orderRes?.data;

    const [closeOrder, { isLoading: closing }] = useCloseOutsideOrderMutation();

    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [returningIssue, setReturningIssue] =
        useState<OrderMaterialIssue | null>(null);

    const session = useAppSelector(state => state.identity.session);
    const userPermissions = session?.permissions || [];
    const canIssueMaterials = userPermissions.includes(
        "inventory.material.issue",
    );
    const isWaiter = !canIssueMaterials;

    const allItems = useMemo(() => {
        if (!order?.orders) return [];
        return order.orders.flatMap(o =>
            o.items.map(i => ({ ...i, orderId: o.id })),
        );
    }, [order?.orders]);

    const materialIssues = useMemo(() => {
        return order?.materialIssues ?? [];
    }, [order?.materialIssues]);

    const materialsSummary = useMemo(() => {
        let totalIssued = 0;
        let totalReturned = 0;
        let totalShortfall = 0;
        let pendingReturns = 0;

        for (const issue of materialIssues) {
            if (["ISSUED", "RETURNED", "DISPUTED"].includes(issue.status)) {
                pendingReturns++;
            }
            for (const line of issue.lines) {
                totalIssued += parseQty(line.qtyIssued);
                totalReturned += parseQty(line.qtyReturned);
                totalShortfall += parseQty(line.qtyShortfall);
            }
        }

        return {
            totalIssued,
            totalReturned,
            totalShortfall,
            pendingReturns,
            isFullyCleared:
                totalIssued > 0 &&
                totalReturned + totalShortfall >= totalIssued &&
                pendingReturns === 0,
        };
    }, [materialIssues]);

    async function handleCloseOrder() {
        if (
            order?.requiresMaterialReturn &&
            materialsSummary.pendingReturns > 0
        ) {
            toast.error(
                "Cannot close: Materials still with waiter or pending chef audit.",
            );
            return;
        }

        try {
            await closeOrder(outsideOrderId).unwrap();
            toast.success("Outside order closed successfully.");
            void refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to close outside order.");
        }
    }

    if (isLoading || !order) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                <div className="w-full max-w-2xl rounded-xl border border-border/80 bg-background p-8 text-center text-xs text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading outside order details...
                </div>
            </div>
        );
    }

    const isClosed = order.status === "CLOSED";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl rounded-xl border border-border/80 bg-background p-5 animate-in fade-in-50 zoom-in-95 max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border/40 pb-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-foreground" />
                            <h3 className="text-sm font-medium text-foreground">
                                {order.destinationName}
                            </h3>
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
                                    order.status === "OPEN"
                                        ? "bg-sky-500/10 text-sky-600"
                                        : order.status === "CLOSED"
                                          ? "bg-muted text-muted-foreground"
                                          : "bg-amber-500/10 text-amber-600",
                                )}
                            >
                                {order.status}
                            </span>
                            {order.requiresMaterialReturn ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600">
                                    Returnable Materials
                                </span>
                            ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <User className="size-3 text-muted-foreground" />
                                Waiter: {order.createdBy.employeeDisplayName}
                            </span>
                            {order.customerName ? (
                                <span className="flex items-center gap-1">
                                    Recipient: {order.customerName}
                                </span>
                            ) : null}
                            {order.customerPhone ? (
                                <span className="flex items-center gap-1">
                                    <Phone className="size-3 text-muted-foreground" />
                                    {order.customerPhone}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto space-y-5 my-4 pr-1">
                    {/* Destination Note if present */}
                    {order.destinationNote ? (
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                                Delivery Note:{" "}
                            </span>
                            {order.destinationNote}
                        </div>
                    ) : null}

                    {/* Section 1: Food & Beverage Items */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Utensils className="size-3.5 text-foreground" />
                                <h4 className="text-xs font-medium text-foreground">
                                    Order Items ({allItems.length})
                                </h4>
                            </div>
                            {!isClosed && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAddMenuOpen(true)}
                                    className="h-7 text-xs gap-1.5"
                                >
                                    <Plus className="size-3" />
                                    Add Food Items
                                </Button>
                            )}
                        </div>

                        {allItems.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                                No menu items added yet. Click &quot;Add Food
                                Items&quot; to send items to the kitchen.
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border/60 divide-y divide-border/40">
                                {allItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-2.5 text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">
                                                {item.quantity}×
                                            </span>
                                            <span className="text-foreground">
                                                {item.itemNameSnapshot}
                                            </span>
                                            {item.modifiers?.length ? (
                                                <span className="text-[11px] text-muted-foreground">
                                                    (
                                                    {item.modifiers
                                                        .map(
                                                            m => m.nameSnapshot,
                                                        )
                                                        .join(", ")}
                                                    )
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] uppercase font-medium",
                                                    item.state === "READY"
                                                        ? "bg-emerald-500/10 text-emerald-600"
                                                        : item.state ===
                                                            "SERVED"
                                                          ? "bg-muted text-muted-foreground"
                                                          : "bg-sky-500/10 text-sky-600",
                                                )}
                                            >
                                                {item.state}
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {formatEtb(
                                                    Number(
                                                        item.priceSnapshot ??
                                                            (item as any)
                                                                .unitPriceSnapshot ??
                                                            0,
                                                    ) * item.quantity,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 2: Returnable Materials Custody */}
                    {order.requiresMaterialReturn ? (
                        <div className="space-y-3 pt-2 border-t border-border/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Boxes className="size-3.5 text-foreground" />
                                    <h4 className="text-xs font-medium text-foreground">
                                        Returnable Materials Custody
                                    </h4>
                                    {materialsSummary.totalIssued > 0 && (
                                        <span className="text-[11px] text-muted-foreground">
                                            ({materialsSummary.totalReturned}/
                                            {materialsSummary.totalIssued}{" "}
                                            returned)
                                        </span>
                                    )}
                                </div>
                                {!isClosed && (
                                    <>
                                        {canIssueMaterials ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setIssueModalOpen(true)
                                                }
                                                className="h-7 text-xs gap-1.5"
                                            >
                                                <Boxes className="size-3" />
                                                Issue Materials (Chef)
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setRequestModalOpen(true)
                                                }
                                                className="h-7 text-xs gap-1.5 text-amber-600 border-amber-600/40"
                                            >
                                                <MessageSquarePlus className="size-3" />
                                                Request Materials
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>

                            {materialIssues.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                                    No materials issued yet. Kitchen staff will
                                    issue materials when food is ready.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {materialIssues.map(issue => (
                                        <div
                                            key={issue.id}
                                            className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2.5"
                                        >
                                            <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
                                                            issue.status ===
                                                                "APPROVED"
                                                                ? "bg-emerald-500/10 text-emerald-600"
                                                                : issue.status ===
                                                                    "RETURNED"
                                                                  ? "bg-sky-500/10 text-sky-600"
                                                                  : issue.status ===
                                                                      "DISPUTED"
                                                                    ? "bg-rose-500/10 text-rose-600"
                                                                    : "bg-amber-500/10 text-amber-600",
                                                        )}
                                                    >
                                                        {issue.status}
                                                    </span>
                                                    {issue.issuedBy && (
                                                        <span className="text-[11px] text-muted-foreground">
                                                            Issued by{" "}
                                                            {
                                                                issue.issuedBy
                                                                    .employeeDisplayName
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Issue actions based on role & status */}
                                                <div className="flex items-center gap-1.5">
                                                    {issue.status ===
                                                        "ISSUED" &&
                                                        !isClosed && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setReturningIssue(
                                                                        issue,
                                                                    )
                                                                }
                                                                className="h-6 px-2 text-[11px]"
                                                            >
                                                                Record Return
                                                            </Button>
                                                        )}
                                                </div>
                                            </div>

                                            {/* Lines table */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {issue.lines.map(line => (
                                                    <div
                                                        key={line.id}
                                                        className="flex items-center justify-between p-2 rounded border border-border/40 bg-background/60"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {line.material
                                                                ?.imageUrl ? (
                                                                <div className="size-7 rounded border border-border/60 overflow-hidden relative shrink-0">
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
                                                                <Boxes className="size-3.5 text-muted-foreground shrink-0" />
                                                            )}
                                                            <span className="text-xs font-medium text-foreground">
                                                                {
                                                                    line.materialNameSnapshot
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="text-right text-[11px]">
                                                            <div>
                                                                Issued:{" "}
                                                                <span className="font-medium">
                                                                    {parseQty(
                                                                        line.qtyIssued,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {parseQty(
                                                                line.qtyReturned,
                                                            ) > 0 ? (
                                                                <div className="text-emerald-600">
                                                                    Ret:{" "}
                                                                    {parseQty(
                                                                        line.qtyReturned,
                                                                    )}
                                                                </div>
                                                            ) : null}
                                                            {parseQty(
                                                                line.qtyShortfall,
                                                            ) > 0 ? (
                                                                <div className="text-rose-500 font-medium">
                                                                    Short:{" "}
                                                                    {parseQty(
                                                                        line.qtyShortfall,
                                                                    )}{" "}
                                                                    (
                                                                    {
                                                                        line.condition
                                                                    }
                                                                    )
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {issue.note ? (
                                                <div className="text-[11px] text-muted-foreground italic">
                                                    Note: {issue.note}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-auto">
                    <div className="text-xs text-muted-foreground">
                        {order.bills?.[0] ? (
                            <span>
                                Bill:{" "}
                                <span className="font-medium text-foreground">
                                    {formatEtb(
                                        Number(order.bills[0].totalAmount),
                                    )}
                                </span>{" "}
                                ({order.bills[0].status})
                            </span>
                        ) : (
                            <span>No bill issued yet</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="h-8 text-xs"
                        >
                            Close Modal
                        </Button>

                        {!isClosed && (
                            <Button
                                type="button"
                                size="sm"
                                disabled={closing}
                                onClick={handleCloseOrder}
                                className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90"
                            >
                                {closing ? (
                                    <>
                                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                        Closing...
                                    </>
                                ) : (
                                    "Complete & Close Outside Order"
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Add Order Menu overlay */}
                {addMenuOpen ? (
                    <AddOrderMenu
                        outsideOrderId={outsideOrderId}
                        expectedVersion={order.version}
                        tableLabel={`Outside · ${order.destinationName}`}
                        onClose={() => {
                            setAddMenuOpen(false);
                            void refetch();
                        }}
                    />
                ) : null}

                {/* Issue Materials Modal */}
                {issueModalOpen ? (
                    <IssueMaterialsModal
                        outsideOrderId={outsideOrderId}
                        orderId={order.orders?.[0]?.id}
                        destinationName={order.destinationName}
                        onClose={() => setIssueModalOpen(false)}
                        onSuccess={() => void refetch()}
                    />
                ) : null}

                {/* Return Materials Modal */}
                {returningIssue ? (
                    <ReturnMaterialsModal
                        issue={returningIssue}
                        onClose={() => setReturningIssue(null)}
                        onSuccess={() => void refetch()}
                    />
                ) : null}

                {/* Request Materials Modal (Waiter) */}
                {requestModalOpen ? (
                    <RequestMaterialsModal
                        outsideOrderId={outsideOrderId}
                        destinationName={order.destinationName}
                        onClose={() => setRequestModalOpen(false)}
                        onSuccess={() => void refetch()}
                    />
                ) : null}
            </div>
        </div>
    );
}
