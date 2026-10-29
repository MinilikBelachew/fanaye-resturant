"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
    useDispatchSupplyRequestMutation,
    useListDriversQuery,
    type InventoryDriver,
    type InventorySupplyRequest,
} from "@/context/services/inventoryApi";
import { useGetTenantSiteQuery } from "@/context/services/siteApi";
import { DriverManagementModal } from "@/domains/inventory/ui/DriverManagementModal";
import { formatQty } from "@/lib/money";
import { toast } from "@/lib/toast";
import {
    AlertCircle,
    ArrowRight,
    Check,
    CheckCircle2,
    Loader2,
    PackageCheck,
    Phone,
    Plus,
    Truck,
    UserCheck,
    X,
} from "lucide-react";

interface ApproveSupplyModalProps {
    open: boolean;
    request: InventorySupplyRequest | null;
    onClose: () => void;
}

export function ApproveSupplyModal({
    open,
    request,
    onClose,
}: ApproveSupplyModalProps) {
    const t = useTranslations("inventory");
    const { data: driversRes, isLoading: driversLoading } =
        useListDriversQuery();
    const { data: siteRes } = useGetTenantSiteQuery();
    const [dispatchSupply, { isLoading: isApproving }] =
        useDispatchSupplyRequestMutation();

    const activeDrivers = (driversRes?.data ?? []).filter(
        d => d.status === "ACTIVE",
    );
    const requireDriver = siteRes?.data?.requireDriverForDispatch ?? false;

    const [deliveryMode, setDeliveryMode] = useState<"driver" | "direct">(
        "driver",
    );
    const [selectedDriverId, setSelectedDriverId] = useState<string>("");
    const [immediateTransit, setImmediateTransit] = useState(false);
    const [decisionNote, setDecisionNote] = useState("");
    const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

    // Pre-select first active driver if available
    useEffect(() => {
        if (!selectedDriverId && activeDrivers.length > 0) {
            setSelectedDriverId(activeDrivers[0].id);
        }
    }, [activeDrivers, selectedDriverId]);

    // Reset fields on modal open
    useEffect(() => {
        if (open) {
            setDeliveryMode("driver");
            setImmediateTransit(false);
            setDecisionNote("");
            if (activeDrivers.length > 0 && !selectedDriverId) {
                setSelectedDriverId(activeDrivers[0].id);
            }
        }
    }, [open]);

    if (!open || !request) return null;

    const selectedDriver = activeDrivers.find(d => d.id === selectedDriverId);

    async function handleConfirmApprove() {
        if (!request) return;

        if (requireDriver && deliveryMode === "direct") {
            toast.error(
                "Restaurant policy requires assigning a fleet driver for dispatch.",
            );
            return;
        }

        if (deliveryMode === "driver" && !selectedDriverId) {
            toast.error(
                "Please select a fleet driver or choose Direct Handover.",
            );
            return;
        }

        try {
            await dispatchSupply({
                id: request.id,
                driverId:
                    deliveryMode === "driver" ? selectedDriverId : undefined,
                immediateTransit: deliveryMode === "driver" && immediateTransit,
                decisionNote: decisionNote.trim() || undefined,
            }).unwrap();

            toast.success(
                deliveryMode === "driver"
                    ? immediateTransit
                        ? "Shipment dispatched — driver in transit!"
                        : "Shipment dispatched — driver assigned!"
                    : "Shipment dispatched for direct branch handover!",
            );
            onClose();
        } catch (err) {
            toast.fromUnknown(err, "Failed to dispatch supply transfer.");
        }
    }

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
                <div className="w-full max-w-lg rounded-3xl bg-surface-card border border-hairline p-6 shadow-2xl relative text-foreground">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-hairline">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                <PackageCheck className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-foreground">
                                    Approve & Dispatch Supply
                                </h3>
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-gray">
                                    <span className="font-medium text-foreground">
                                        {request.toLocation.name}
                                    </span>
                                    <ArrowRight className="size-3 text-slate-gray" />
                                    <span className="font-medium text-foreground">
                                        {request.fromLocation.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-1.5 text-slate-gray hover:bg-surface-ivory hover:text-foreground transition-colors"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="mt-4 space-y-4">
                        {/* Requested items summary */}
                        <div>
                            <p className="text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1.5">
                                Items to Dispatch ({request.lines.length})
                            </p>
                            <div className="max-h-32 overflow-y-auto rounded-2xl border border-hairline bg-surface-ivory/50 p-3 space-y-1.5 text-xs">
                                {request.lines.map(line => (
                                    <div
                                        key={line.id}
                                        className="flex items-center justify-between font-mono"
                                    >
                                        <span className="text-foreground font-sans font-medium">
                                            {line.ingredient.name}
                                        </span>
                                        <span className="text-slate-gray font-semibold">
                                            {formatQty(line.quantityRequested)}{" "}
                                            {line.unit ?? line.ingredient.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Method Selection */}
                        <div>
                            <p className="text-xs font-semibold text-slate-gray uppercase tracking-wider mb-2">
                                Fulfillment & Delivery Method
                            </p>
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setDeliveryMode("driver")}
                                    className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all ${
                                        deliveryMode === "driver"
                                            ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                                            : "border-hairline bg-surface-card hover:bg-surface-ivory/50"
                                    }`}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
                                            <Truck className="size-4" />
                                        </div>
                                        {deliveryMode === "driver" && (
                                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white">
                                                <Check className="size-2.5 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="mt-1 text-xs font-semibold text-foreground">
                                        Fleet Driver
                                    </span>
                                    <span className="text-[11px] text-slate-gray leading-tight">
                                        Assign driver with vehicle tracking
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDeliveryMode("direct")}
                                    className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all ${
                                        deliveryMode === "direct"
                                            ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                                            : "border-hairline bg-surface-card hover:bg-surface-ivory/50"
                                    }`}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-500/10 text-slate-gray">
                                            <UserCheck className="size-4" />
                                        </div>
                                        {deliveryMode === "direct" && (
                                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white">
                                                <Check className="size-2.5 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="mt-1 text-xs font-semibold text-foreground">
                                        Direct Handover
                                    </span>
                                    <span className="text-[11px] text-slate-gray leading-tight">
                                        Branch staff self-pickup at warehouse
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Driver Options when Fleet Delivery is selected */}
                        {deliveryMode === "driver" ? (
                            <div className="space-y-3 rounded-2xl border border-hairline bg-surface-ivory/30 p-3.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-foreground">
                                        Assigned Driver
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsDriverModalOpen(true)
                                        }
                                        className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                                    >
                                        <Plus className="size-3" />
                                        Manage Drivers
                                    </button>
                                </div>

                                {driversLoading ? (
                                    <div className="flex items-center gap-2 py-2 text-xs text-slate-gray">
                                        <Loader2 className="size-3.5 animate-spin" />
                                        Loading drivers...
                                    </div>
                                ) : activeDrivers.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700">
                                        <p className="font-medium">
                                            No active drivers found.
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-amber-600/90">
                                            Please add a driver to assign fleet
                                            transit, or switch to Direct
                                            Handover.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsDriverModalOpen(true)
                                            }
                                            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
                                        >
                                            <Plus className="size-3" /> Add
                                            Driver
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <select
                                            value={selectedDriverId}
                                            onChange={e =>
                                                setSelectedDriverId(
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-hairline bg-surface-card px-3 py-2 text-xs font-medium text-foreground focus:border-brand focus:outline-none"
                                        >
                                            {activeDrivers.map(driver => (
                                                <option
                                                    key={driver.id}
                                                    value={driver.id}
                                                >
                                                    {driver.displayName}
                                                    {driver.licencePlate
                                                        ? ` · [${driver.licencePlate}]`
                                                        : ""}
                                                    {driver.vehicleDesc
                                                        ? ` (${driver.vehicleDesc})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Selected driver card preview */}
                                        {selectedDriver && (
                                            <div className="flex items-center justify-between rounded-xl bg-surface-card border border-hairline p-2.5 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                                        <Truck className="size-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground">
                                                            {
                                                                selectedDriver.displayName
                                                            }
                                                        </p>
                                                        <p className="text-[11px] text-slate-gray">
                                                            {selectedDriver.vehicleDesc ||
                                                                "No vehicle description"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {selectedDriver.licencePlate && (
                                                        <span className="font-mono rounded bg-surface-ivory px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                                                            {
                                                                selectedDriver.licencePlate
                                                            }
                                                        </span>
                                                    )}
                                                    {selectedDriver.phone && (
                                                        <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-slate-gray">
                                                            <Phone className="size-2.5" />
                                                            {
                                                                selectedDriver.phone
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Immediate Transit checkbox */}
                                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={immediateTransit}
                                        onChange={e =>
                                            setImmediateTransit(
                                                e.target.checked,
                                            )
                                        }
                                        className="mt-0.5 h-4 w-4 rounded border-hairline text-brand focus:ring-brand"
                                    />
                                    <div>
                                        <p className="text-xs font-medium text-foreground">
                                            Skip driver acceptance (mark
                                            IN_TRANSIT immediately)
                                        </p>
                                        <p className="text-[11px] text-slate-gray">
                                            Use only when the driver is already
                                            on-site. Otherwise the trip starts
                                            when the driver accepts it in their
                                            portal.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-hairline bg-surface-ivory/40 p-3.5 text-xs text-slate-gray">
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <UserCheck className="size-4 text-brand" />
                                    Branch Direct Handover
                                </div>
                                <p className="mt-1 text-[11px]">
                                    Goods are given directly to branch staff. No
                                    driver assignment is made, and the
                                    destination branch can accept immediately
                                    once loaded.
                                </p>
                                {requireDriver && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                                        <AlertCircle className="size-3.5" />
                                        Note: Company transit policy recommends
                                        fleet drivers for tracking.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dispatch Note */}
                        <div>
                            <label className="text-xs font-semibold text-slate-gray uppercase tracking-wider block mb-1">
                                Dispatch Note (Optional)
                            </label>
                            <input
                                type="text"
                                value={decisionNote}
                                onChange={e => setDecisionNote(e.target.value)}
                                placeholder="e.g. Dispatched in 2 crates with receipt attached"
                                className="w-full rounded-xl border border-hairline bg-surface-card px-3 py-2 text-xs text-foreground placeholder:text-slate-gray/60 focus:border-brand focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="mt-6 flex items-center justify-end gap-2 border-t border-hairline pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isApproving}
                            className="h-9 rounded-xl border border-hairline px-4 text-xs font-medium text-slate-gray hover:bg-surface-ivory transition-colors disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleConfirmApprove()}
                            disabled={
                                isApproving ||
                                (deliveryMode === "driver" &&
                                    (!selectedDriverId ||
                                        activeDrivers.length === 0))
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition-all"
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Approving & Dispatching...
                                </>
                            ) : (
                                <>
                                    <Truck className="size-3.5" />
                                    Approve & Dispatch
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick driver management modal if needed */}
            <DriverManagementModal
                open={isDriverModalOpen}
                onClose={() => setIsDriverModalOpen(false)}
                onSelectDriver={d => {
                    setSelectedDriverId(d.id);
                    setIsDriverModalOpen(false);
                }}
            />
        </>
    );
}
