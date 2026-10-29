"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    useAcceptInventoryTransferMutation,
    useCreateInventoryTransferMutation,
    useDispatchTransferMutation,
    useListDriversQuery,
    useListInventoryBalancesQuery,
    useListInventoryLocationsQuery,
    useListInventoryTransfersQuery,
    useListInventoryUnitConversionsQuery,
    useMarkDriverArrivedMutation,
    useRejectInventoryTransferMutation,
    type InventoryDriver,
    type InventoryTransfer,
} from "@/context/services/inventoryApi";
import {
    InventoryMultiSelect,
    InventoryNiceSelect,
    PrimaryActionButton,
    QtyLineCard,
    parsePositiveQty,
} from "@/domains/inventory/ui/InventoryFormControls";
import { UnitPicker } from "@/domains/inventory/ui/UnitPicker";
import { toBaseQtyClient } from "@/domains/inventory/application/unitMath";
import { DriverManagementModal } from "@/domains/inventory/ui/DriverManagementModal";
import { formatQty } from "@/lib/money";
import { toast } from "@/lib/toast";
import {
    CheckCircle2,
    Loader2,
    MapPin,
    Phone,
    Plus,
    Send,
    Truck,
    X,
} from "lucide-react";

type SendLine = {
    ingredientId: string;
    name: string;
    unit: string;
    typedUnit: string;
    quantity: string;
    onHandQty: number;
};

export function SendTransferPanel() {
    const t = useTranslations("inventory");
    const { data: locationsRes } = useListInventoryLocationsQuery();
    const locations = locationsRes?.data ?? [];
    const main = locations.find(l => l.type === "MAIN_WAREHOUSE");
    const branchStores = locations.filter(l => l.type === "BRANCH_STORE");

    const { data: mainStock } = useListInventoryBalancesQuery(
        { page: 1, limit: 100, locationId: main?.id },
        { skip: !main?.id },
    );

    const { data: driversRes } = useListDriversQuery();
    const { data: conversionsRes } = useListInventoryUnitConversionsQuery();
    const conversionRows = useMemo(
        () =>
            (conversionsRes?.data ?? [])
                .filter(c => c.status === "ACTIVE")
                .map(c => ({
                    fromUnit: c.fromUnit,
                    toUnit: c.toUnit,
                    factor: c.factor,
                })),
        [conversionsRes?.data],
    );
    const activeDrivers = useMemo(
        () => (driversRes?.data ?? []).filter(d => d.status === "ACTIVE"),
        [driversRes?.data],
    );

    const [createTransfer, sendingSingle] =
        useCreateInventoryTransferMutation();
    const [dispatchTransfer, dispatching] = useDispatchTransferMutation();

    const [driverModalOpen, setDriverModalOpen] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState("");

    // ─── Direct Send State ───────────────────────────────────────────────────
    const [toLocationId, setToLocationId] = useState("");
    const [directNote, setDirectNote] = useState("");
    const [directLines, setDirectLines] = useState<SendLine[]>([]);
    const [triedDirectSubmit, setTriedDirectSubmit] = useState(false);

    const stockRows = useMemo(
        () =>
            (mainStock?.data ?? []).filter(
                row => (Number(row.onHandQty) || 0) > 0,
            ),
        [mainStock?.data],
    );

    // Direct Send validation
    const directLineErrors = useMemo(() => {
        const map = new Map<string, string>();
        for (const line of directLines) {
            const qty = parsePositiveQty(line.quantity);
            if (line.quantity !== "" && qty == null) {
                map.set(line.ingredientId, t("errQtyInvalid"));
                continue;
            }
            if (qty != null) {
                const baseQty = toBaseQtyClient(
                    qty,
                    line.typedUnit,
                    line.unit,
                    conversionRows,
                );
                if (baseQty == null) {
                    map.set(line.ingredientId, t("errUnitMismatch"));
                    continue;
                }
                if (baseQty > line.onHandQty) {
                    map.set(
                        line.ingredientId,
                        t("errNotEnoughAtMain", {
                            name: line.name,
                            have: formatQty(line.onHandQty),
                            need: formatQty(baseQty),
                            unit: line.unit,
                        }),
                    );
                }
            }
        }
        return map;
    }, [directLines, conversionRows, t]);

    const validDirectLines = useMemo(
        () =>
            directLines
                .map(l => ({
                    ingredientId: l.ingredientId,
                    quantity: parsePositiveQty(l.quantity),
                    typedUnit: l.typedUnit,
                    unit: l.unit,
                    onHandQty: l.onHandQty,
                }))
                .filter(
                    (
                        l,
                    ): l is {
                        ingredientId: string;
                        quantity: number;
                        typedUnit: string;
                        unit: string;
                        onHandQty: number;
                    } => {
                        if (l.quantity == null || l.quantity <= 0) return false;
                        const baseQty = toBaseQtyClient(
                            l.quantity,
                            l.typedUnit,
                            l.unit,
                            conversionRows,
                        );
                        return baseQty != null && baseQty <= l.onHandQty;
                    },
                ),
        [directLines, conversionRows],
    );

    const canSendDirect =
        Boolean(toLocationId) &&
        Boolean(selectedDriverId) &&
        directLines.length > 0 &&
        validDirectLines.length === directLines.length &&
        directLineErrors.size === 0;

    function toggleDirectLine(ingredientId: string) {
        setDirectLines(prev => {
            const exists = prev.some(l => l.ingredientId === ingredientId);
            if (exists) {
                return prev.filter(l => l.ingredientId !== ingredientId);
            }
            const row = stockRows.find(r => r.ingredientId === ingredientId);
            if (!row) return prev;
            return [
                ...prev,
                {
                    ingredientId: row.ingredientId,
                    name: row.name,
                    unit: row.unit,
                    typedUnit: row.unit,
                    quantity: "",
                    onHandQty: Number(row.onHandQty) || 0,
                },
            ];
        });
    }

    async function onSendDirect(e: React.FormEvent) {
        e.preventDefault();
        setTriedDirectSubmit(true);
        if (!toLocationId) {
            toast.error(t("errPickDestination"));
            return;
        }
        if (!selectedDriverId) {
            toast.error("Pick a driver to assign this transfer");
            return;
        }
        if (directLines.length === 0) {
            toast.error(t("errTransferIncomplete"));
            return;
        }
        if (!canSendDirect) {
            toast.error(t("errFixLineQuantities"));
            return;
        }

        try {
            const res = await createTransfer({
                toLocationId,
                note: directNote.trim() || undefined,
                lines: validDirectLines.map(l => ({
                    ingredientId: l.ingredientId,
                    quantity: l.quantity,
                    ...(l.typedUnit !== l.unit ? { unit: l.typedUnit } : {}),
                })),
            }).unwrap();

            // If a driver was assigned, immediately dispatch
            if (selectedDriverId && res.data?.id) {
                await dispatchTransfer({
                    id: res.data.id,
                    body: { driverId: selectedDriverId },
                }).unwrap();
                toast.success(
                    "Transfer sent — driver assigned, awaiting their acceptance.",
                );
            } else {
                toast.success(t("toastTransferSent"));
            }

            setDirectLines([]);
            setDirectNote("");
            setToLocationId("");
            setSelectedDriverId("");
            setTriedDirectSubmit(false);
        } catch (err) {
            toast.fromUnknown(err, t("errTransferSend"));
        }
    }

    if (!main) {
        return (
            <p className="text-[13px] text-slate-gray">
                {t("needMainForTransfer")}
            </p>
        );
    }

    const isSubmitting = sendingSingle.isLoading || dispatching.isLoading;

    return (
        <div className="space-y-6">
            <DriverManagementModal
                open={driverModalOpen}
                onClose={() => setDriverModalOpen(false)}
                onSelectDriver={d => setSelectedDriverId(d.id)}
            />

            {/* Fleet Driver Manager trigger */}
            <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-hairline bg-surface-ivory/50 p-2">
                <button
                    type="button"
                    onClick={() => setDriverModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-hairline bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-amber-500/40 hover:bg-surface-ivory transition-colors"
                >
                    <Truck className="size-3.5 text-amber-600" />
                    Fleet & Drivers ({activeDrivers.length})
                </button>
            </div>

            <form onSubmit={onSendDirect} className="space-y-6">
                <div className="space-y-4 rounded-2xl border border-hairline bg-surface-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
                        <h3 className="text-sm font-semibold text-foreground">
                            {t("sendTransferTitle")}
                        </h3>
                        <span className="text-[11px] text-slate-gray">
                            {t("sendFromMain", { name: main.name })}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-medium text-slate-gray mb-1">
                                {t("fieldDestination")} *
                            </label>
                            <InventoryNiceSelect
                                placeholder={t("selectDestination")}
                                value={toLocationId}
                                options={branchStores.map(s => ({
                                    value: s.id,
                                    label: s.name,
                                }))}
                                onChange={setToLocationId}
                                error={
                                    triedDirectSubmit && !toLocationId
                                        ? t("errPickDestination")
                                        : undefined
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-slate-gray mb-1">
                                {t("colNote")} (Optional)
                            </label>
                            <input
                                value={directNote}
                                onChange={e => setDirectNote(e.target.value)}
                                placeholder="e.g. Weekly restock order"
                                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-xs"
                            />
                        </div>
                    </div>

                    {/* Transit Driver (required — trip starts when driver accepts) */}
                    <div className="pt-2">
                        <label className="block text-[11px] font-medium text-slate-gray mb-1">
                            Transit Driver *
                        </label>
                        {activeDrivers.length > 0 ? (
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <InventoryNiceSelect
                                        placeholder="Select active driver…"
                                        value={selectedDriverId}
                                        options={activeDrivers.map(d => ({
                                            value: d.id,
                                            label: `${d.displayName}${d.licencePlate ? ` (${d.licencePlate})` : ""}`,
                                        }))}
                                        onChange={setSelectedDriverId}
                                        error={
                                            triedDirectSubmit &&
                                            !selectedDriverId
                                                ? "Pick a driver to assign this transfer"
                                                : undefined
                                        }
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDriverModalOpen(true)}
                                    className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-hairline text-slate-gray hover:border-amber-500/40 hover:text-amber-600"
                                    title="Register new driver"
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                                <p className="text-xs text-slate-gray">
                                    No active drivers yet — register one to
                                    assign this shipment.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setDriverModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                                >
                                    <Plus className="size-3.5" />
                                    Register Driver
                                </button>
                            </div>
                        )}
                        <p className="mt-1.5 text-[11px] text-slate-gray">
                            The transfer stays Ready (SENT) until the driver
                            accepts it in their portal.
                        </p>
                    </div>

                    {/* Items Multi-Select from Main Stock */}
                    <div className="pt-2">
                        <label className="block text-[11px] font-medium text-slate-gray mb-1">
                            {t("fieldItemsToSend")} *
                        </label>
                        <InventoryMultiSelect
                            placeholder={t("selectInputsPlaceholder")}
                            searchPlaceholder={t("searchInputsPlaceholder")}
                            emptyLabel={t("emptyInputOptions")}
                            selectedCountLabel={count =>
                                t("inputsSelectedCount", { count })
                            }
                            selectedIds={
                                new Set(directLines.map(l => l.ingredientId))
                            }
                            options={stockRows.map(r => ({
                                value: r.ingredientId,
                                label: r.name,
                                hint: t("onHandShort", {
                                    qty: formatQty(r.onHandQty),
                                    unit: r.unit,
                                }),
                            }))}
                            onToggle={toggleDirectLine}
                        />
                    </div>

                    {/* Line cards */}
                    <ul className="space-y-2 pt-2">
                        {directLines.map(line => (
                            <QtyLineCard
                                key={line.ingredientId}
                                title={line.name}
                                unit={line.unit}
                                unitNode={
                                    <UnitPicker
                                        compact
                                        baseUnit={line.unit}
                                        value={line.typedUnit}
                                        onChange={v =>
                                            setDirectLines(prev =>
                                                prev.map(l =>
                                                    l.ingredientId ===
                                                    line.ingredientId
                                                        ? { ...l, typedUnit: v }
                                                        : l,
                                                ),
                                            )
                                        }
                                    />
                                }
                                quantity={line.quantity}
                                max={
                                    line.typedUnit !== line.unit
                                        ? (toBaseQtyClient(
                                              line.onHandQty,
                                              line.unit,
                                              line.typedUnit,
                                              conversionRows,
                                          ) ?? undefined)
                                        : line.onHandQty
                                }
                                quantityPlaceholder={t("fieldQuantity")}
                                removeLabel={t("removeLine")}
                                error={
                                    triedDirectSubmit || line.quantity !== ""
                                        ? directLineErrors.get(
                                              line.ingredientId,
                                          )
                                        : undefined
                                }
                                onQuantityChange={v =>
                                    setDirectLines(prev =>
                                        prev.map(l =>
                                            l.ingredientId === line.ingredientId
                                                ? { ...l, quantity: v }
                                                : l,
                                        ),
                                    )
                                }
                                onRemove={() =>
                                    toggleDirectLine(line.ingredientId)
                                }
                            />
                        ))}
                    </ul>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline p-4 bg-surface-ivory/50">
                    <div className="text-xs text-slate-gray">
                        {selectedDriverId ? (
                            <span className="text-amber-600 font-medium flex items-center gap-1.5">
                                <Truck className="size-3.5" />
                                {activeDrivers.find(
                                    d => d.id === selectedDriverId,
                                )?.displayName ?? "Driver"}{" "}
                                assigned — trip starts when they accept
                            </span>
                        ) : (
                            <span>Pick a driver to assign the shipment</span>
                        )}
                    </div>

                    <PrimaryActionButton
                        loading={isSubmitting}
                        disabled={!canSendDirect && triedDirectSubmit}
                        className="px-6"
                    >
                        {isSubmitting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Send className="size-3.5" />
                        )}
                        {t("sendTransfer")}
                    </PrimaryActionButton>
                </div>
            </form>
        </div>
    );
}

// ─── OUTGOING TRANSFERS PANEL ────────────────────────────────────────────────

export function OutgoingTransfersPanel() {
    const t = useTranslations("inventory");
    const { data, isLoading } = useListInventoryTransfersQuery({
        page: 1,
        limit: 100,
        direction: "outgoing",
    });
    const transfers = useMemo(() => data?.data ?? [], [data]);

    const { data: driversRes } = useListDriversQuery();
    const activeDrivers = useMemo(
        () => (driversRes?.data ?? []).filter(d => d.status === "ACTIVE"),
        [driversRes?.data],
    );

    const [dispatchTransfer, { isLoading: isDispatching }] =
        useDispatchTransferMutation();
    const [dispatchModalTransfer, setDispatchModalTransfer] =
        useState<InventoryTransfer | null>(null);
    const [modalDriverId, setModalDriverId] = useState("");
    const [modalDriverNote, setModalDriverNote] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [outgoingDriverModalOpen, setOutgoingDriverModalOpen] =
        useState(false);

    const filteredTransfers = useMemo(() => {
        if (statusFilter === "ALL") return transfers;
        return transfers.filter(t => t.status === statusFilter);
    }, [transfers, statusFilter]);

    async function handleDispatch(e: React.FormEvent) {
        e.preventDefault();
        if (!dispatchModalTransfer || !modalDriverId) {
            toast.error("Please select a driver to dispatch");
            return;
        }

        try {
            await dispatchTransfer({
                id: dispatchModalTransfer.id,
                body: {
                    driverId: modalDriverId,
                    note: modalDriverNote.trim() || undefined,
                },
            }).unwrap();

            toast.success(
                "Driver assigned — awaiting their acceptance to start the trip.",
            );
            setDispatchModalTransfer(null);
            setModalDriverId("");
            setModalDriverNote("");
        } catch (err) {
            toast.fromUnknown(err, "Failed to assign driver");
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin" />
                {t("loadingTransfers")}
            </div>
        );
    }

    if (transfers.length === 0) {
        return (
            <p className="rounded-2xl border border-hairline px-4 py-8 text-center text-[13px] text-slate-gray">
                {t("emptyOutgoing")}
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {/* Quick Dispatch Modal */}
            {dispatchModalTransfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-3xl border border-hairline bg-surface-card p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-hairline pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                                    <Truck className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Assign Driver
                                    </h3>
                                    <p className="text-[11px] text-slate-gray">
                                        Shipment to{" "}
                                        {dispatchModalTransfer.toLocation.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDispatchModalTransfer(null)}
                                className="rounded-xl p-1.5 text-slate-gray hover:bg-surface-ivory"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleDispatch}
                            className="space-y-4 pt-4"
                        >
                            <div>
                                <label className="block text-xs font-medium text-slate-gray mb-1">
                                    Select Active Driver *
                                </label>
                                <select
                                    required
                                    value={modalDriverId}
                                    onChange={e =>
                                        setModalDriverId(e.target.value)
                                    }
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-xs"
                                >
                                    <option value="">Choose a driver...</option>
                                    {activeDrivers.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.displayName}{" "}
                                            {d.licencePlate
                                                ? `(${d.licencePlate})`
                                                : ""}{" "}
                                            {d.phone ? `· ${d.phone}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-gray mb-1">
                                    Dispatch Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={modalDriverNote}
                                    onChange={e =>
                                        setModalDriverNote(e.target.value)
                                    }
                                    placeholder="e.g. Departing warehouse 10:30 AM"
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDispatchModalTransfer(null)
                                    }
                                    className="h-9 rounded-xl border border-hairline px-3 text-xs font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDispatching || !modalDriverId}
                                    className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {isDispatching ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Truck className="size-3.5" />
                                    )}
                                    Assign Driver
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filter Badges and Fleet Manager trigger */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        { key: "ALL", label: "All Outgoing" },
                        { key: "IN_TRANSIT", label: "🚚 In Transit" },
                        { key: "SENT", label: "📦 Sent / Awaiting Pickup" },
                        { key: "RECEIVED", label: "✓ Received" },
                        { key: "REJECTED", label: "✕ Rejected" },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                                statusFilter === f.key
                                    ? "bg-amber-600 text-white shadow-sm"
                                    : "border border-hairline bg-surface-card text-slate-gray hover:text-foreground"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setOutgoingDriverModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-hairline bg-surface-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-amber-500/40 hover:bg-surface-ivory transition-colors"
                >
                    <Truck className="size-3.5 text-amber-600" />
                    Fleet & Drivers ({activeDrivers.length})
                </button>
            </div>

            <DriverManagementModal
                open={outgoingDriverModalOpen}
                onClose={() => setOutgoingDriverModalOpen(false)}
                onSelectDriver={d => setModalDriverId(d.id)}
            />

            {/* Transfers Table / Cards */}
            <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-card">
                <table className="w-full text-left text-[13px]">
                    <thead className="bg-surface-ivory text-slate-gray border-b border-hairline">
                        <tr>
                            <th className="px-4 py-3 font-medium">
                                Destination
                            </th>
                            <th className="px-4 py-3 font-medium">
                                Status & Driver
                            </th>
                            <th className="px-4 py-3 font-medium">
                                Items Transferred
                            </th>
                            <th className="px-4 py-3 font-medium">Timeline</th>
                            <th className="px-4 py-3 font-medium text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                        {filteredTransfers.map(transfer => {
                            const isInTransit =
                                transfer.status === "IN_TRANSIT";
                            const isSent = transfer.status === "SENT";
                            const isReceived = transfer.status === "RECEIVED";

                            return (
                                <tr
                                    key={transfer.id}
                                    className="hover:bg-surface-ivory/20 transition-colors"
                                >
                                    <td className="px-4 py-3.5">
                                        <p className="font-semibold text-foreground">
                                            {transfer.toLocation.name}
                                        </p>
                                        <p className="text-[11px] text-slate-gray">
                                            From {transfer.fromLocation.name}
                                        </p>
                                    </td>

                                    <td className="px-4 py-3.5">
                                        <div className="space-y-1">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                    isInTransit
                                                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                        : isSent
                                                          ? "bg-blue-500/10 text-blue-600"
                                                          : isReceived
                                                            ? "bg-emerald-500/10 text-emerald-600"
                                                            : "bg-rose-500/10 text-rose-600"
                                                }`}
                                            >
                                                {isInTransit && (
                                                    <Truck className="size-3 animate-pulse" />
                                                )}
                                                {transfer.status}
                                            </span>

                                            {isSent && transfer.driverId && (
                                                <div className="text-[11px] font-medium text-amber-600">
                                                    Awaiting driver acceptance
                                                </div>
                                            )}

                                            {transfer.driver && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-gray">
                                                    <span className="font-medium text-foreground">
                                                        {
                                                            transfer.driver
                                                                .displayName
                                                        }
                                                    </span>
                                                    {transfer.driver
                                                        .licencePlate && (
                                                        <span className="font-mono text-[10px] bg-surface-ivory px-1 rounded">
                                                            {
                                                                transfer.driver
                                                                    .licencePlate
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3.5">
                                        <div className="text-xs text-foreground max-w-xs">
                                            {transfer.lines
                                                .map(
                                                    l =>
                                                        `${l.ingredient.name} (${formatQty(l.quantitySent)} ${l.unitSent ?? l.ingredient.unit})`,
                                                )
                                                .join(", ")}
                                        </div>
                                        {transfer.note && (
                                            <p className="mt-0.5 text-[11px] text-slate-gray italic">
                                                "{transfer.note}"
                                            </p>
                                        )}
                                    </td>

                                    <td className="px-4 py-3.5 text-slate-gray text-xs">
                                        <div>
                                            Sent:{" "}
                                            {transfer.sentAt
                                                ? new Date(
                                                      transfer.sentAt,
                                                  ).toLocaleTimeString([], {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                                : "—"}
                                        </div>
                                        {transfer.dispatchedAt && (
                                            <div className="text-[11px] text-amber-600">
                                                Dispatched:{" "}
                                                {new Date(
                                                    transfer.dispatchedAt,
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-4 py-3.5 text-right">
                                        {isSent && !transfer.driverId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDispatchModalTransfer(
                                                        transfer,
                                                    );
                                                    setModalDriverId("");
                                                    setModalDriverNote("");
                                                }}
                                                className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20"
                                            >
                                                <Truck className="size-3.5" />
                                                Assign Driver
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── INCOMING TRANSFERS PANEL ────────────────────────────────────────────────

export function IncomingTransfersPanel() {
    const t = useTranslations("inventory");
    const { data, isLoading } = useListInventoryTransfersQuery({
        page: 1,
        limit: 50,
        direction: "incoming",
    });
    const [acceptTransfer, accepting] = useAcceptInventoryTransferMutation();
    const [rejectTransfer, rejecting] = useRejectInventoryTransferMutation();
    const [markDriverArrived, markingArrived] = useMarkDriverArrivedMutation();
    const transfers = data?.data ?? [];

    const busy =
        accepting.isLoading || rejecting.isLoading || markingArrived.isLoading;

    async function onAccept(transfer: InventoryTransfer) {
        try {
            await acceptTransfer({ id: transfer.id }).unwrap();
            toast.success(t("toastTransferAccepted"));
        } catch (err) {
            toast.fromUnknown(err, t("errTransferAccept"));
        }
    }

    async function onMarkArrived(transfer: InventoryTransfer) {
        try {
            await markDriverArrived({ id: transfer.id }).unwrap();
            toast.success("Driver marked as arrived at branch.");
        } catch (err) {
            toast.fromUnknown(err, "Failed to mark driver arrival.");
        }
    }

    async function onReject(transfer: InventoryTransfer) {
        try {
            await rejectTransfer({
                id: transfer.id,
                note: t("rejectDefaultNote"),
            }).unwrap();
            toast.success(t("toastTransferRejected"));
        } catch (err) {
            toast.fromUnknown(err, t("errTransferReject"));
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin" />
                {t("loadingTransfers")}
            </div>
        );
    }

    if (transfers.length === 0) {
        return (
            <p className="rounded-2xl border border-hairline px-4 py-8 text-center text-[13px] text-slate-gray">
                {t("emptyIncoming")}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {transfers.map(transfer => {
                const hasDriver = Boolean(transfer.driverId || transfer.driver);
                const isArrived = transfer.status === "ARRIVED";
                const isInTransit = transfer.status === "IN_TRANSIT";
                const isAwaitingArrival = hasDriver && !isArrived;

                return (
                    <div
                        key={transfer.id}
                        className={`rounded-2xl border p-4 bg-surface-card transition-all ${
                            isArrived
                                ? "border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20"
                                : isInTransit
                                  ? "border-amber-500/50 shadow-md ring-1 ring-amber-500/20"
                                  : "border-hairline"
                        }`}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[14px] font-semibold text-foreground">
                                        {transfer.fromLocation.name} →{" "}
                                        {transfer.toLocation.name}
                                    </p>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                            isArrived
                                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                : isInTransit
                                                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                  : hasDriver
                                                    ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                                    : "bg-surface-ivory text-slate-gray border border-hairline"
                                        }`}
                                    >
                                        {isArrived && (
                                            <CheckCircle2 className="size-3 text-emerald-600" />
                                        )}
                                        {isInTransit && (
                                            <Truck className="size-3 animate-pulse text-amber-600" />
                                        )}
                                        {isArrived
                                            ? "🏁 Driver Arrived (Ready to Accept)"
                                            : isInTransit
                                              ? "🚚 In Transit (En Route)"
                                              : hasDriver
                                                ? "📦 Ready for Driver Pickup"
                                                : "🏃 Direct Handover / Branch Pickup"}
                                    </span>
                                </div>

                                {/* Driver details banner for branch recipient */}
                                {transfer.driver && (
                                    <div
                                        className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl px-3 py-2 text-xs border ${
                                            isArrived
                                                ? "bg-emerald-500/5 text-emerald-800 border-emerald-500/20"
                                                : "bg-amber-500/5 text-amber-800 border-amber-500/15"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 font-semibold">
                                            {isArrived ? (
                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                            ) : (
                                                <Truck className="size-3.5 text-amber-600" />
                                            )}
                                            <span>
                                                {isArrived
                                                    ? "Arrived with Driver:"
                                                    : "Fleet Driver:"}{" "}
                                                {transfer.driver.displayName}
                                            </span>
                                        </div>
                                        {transfer.driver.phone && (
                                            <a
                                                href={`tel:${transfer.driver.phone}`}
                                                className="flex items-center gap-1 font-medium hover:underline text-foreground"
                                            >
                                                <Phone className="size-3" />
                                                {transfer.driver.phone}
                                            </a>
                                        )}
                                        {transfer.driver.licencePlate && (
                                            <span className="font-mono bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground border border-hairline">
                                                {transfer.driver.licencePlate}
                                            </span>
                                        )}
                                        {transfer.driver.vehicleDesc && (
                                            <span className="text-[11px] text-slate-gray">
                                                ({transfer.driver.vehicleDesc})
                                            </span>
                                        )}
                                        {isArrived && (
                                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                Package arrived on-site
                                            </span>
                                        )}
                                    </div>
                                )}

                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {transfer.sentAt
                                        ? `Sent at ${new Date(transfer.sentAt).toLocaleString()}`
                                        : ""}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {isAwaitingArrival ? (
                                    <>
                                        <button
                                            type="button"
                                            disabled
                                            title="Transfer goods cannot be accepted into branch inventory until the delivery driver arrives on-site."
                                            className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-surface-ivory border border-amber-500/30 text-amber-700/80 cursor-not-allowed flex items-center gap-1.5"
                                        >
                                            <Truck className="size-3.5 animate-pulse text-amber-600" />
                                            Awaiting Driver Arrival
                                        </button>
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() =>
                                                void onMarkArrived(transfer)
                                            }
                                            title="If the driver is already physically at your branch, click here to confirm arrival"
                                            className="h-9 px-3 text-xs font-medium rounded-xl border border-hairline bg-surface-card hover:bg-emerald-500/10 text-emerald-700 hover:border-emerald-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                        >
                                            <MapPin className="size-3 text-emerald-600" />
                                            Driver Arrived
                                        </button>
                                    </>
                                ) : (
                                    <PrimaryActionButton
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void onAccept(transfer)}
                                        className="h-9 px-4 text-xs font-semibold"
                                    >
                                        <CheckCircle2 className="size-3.5" />
                                        {t("acceptFull")}
                                    </PrimaryActionButton>
                                )}
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void onReject(transfer)}
                                    className="h-9 rounded-xl border border-hairline px-3 text-xs font-medium text-rose-600 hover:bg-rose-500/10 disabled:opacity-60 transition-colors"
                                >
                                    {t("rejectTransfer")}
                                </button>
                            </div>
                        </div>

                        <ul className="mt-3 space-y-1 text-xs border-t border-hairline pt-3">
                            {transfer.lines.map(line => (
                                <li
                                    key={line.id}
                                    className="tabular-nums flex items-center justify-between text-slate-gray"
                                >
                                    <span className="font-medium text-foreground">
                                        {line.ingredient.name}
                                    </span>
                                    <span>
                                        {formatQty(line.quantitySent)}{" "}
                                        {line.unitSent ?? line.ingredient.unit}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {transfer.note && (
                            <p className="mt-2 text-xs text-slate-gray italic bg-surface-ivory/50 rounded-xl p-2">
                                Note: {transfer.note}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
