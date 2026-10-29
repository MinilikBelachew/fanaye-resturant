"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Phone, Plus, Truck, X } from "lucide-react";
import {
    useCreateDriverMutation,
    useListDriversQuery,
    useUpdateDriverMutation,
    type InventoryDriver,
} from "@/context/services/inventoryApi";
import { toast } from "@/lib/toast";

interface DriverManagementModalProps {
    open: boolean;
    onClose: () => void;
    onSelectDriver?: (driver: InventoryDriver) => void;
}

export function DriverManagementModal({
    open,
    onClose,
    onSelectDriver,
}: DriverManagementModalProps) {
    const { data: driversRes, isLoading } = useListDriversQuery();
    const drivers = driversRes?.data ?? [];

    const [createDriver, { isLoading: isCreating }] = useCreateDriverMutation();
    const [updateDriver, { isLoading: isUpdating }] = useUpdateDriverMutation();

    const [editingDriver, setEditingDriver] = useState<InventoryDriver | null>(
        null,
    );
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formData, setFormData] = useState({
        displayName: "",
        phone: "",
        licencePlate: "",
        vehicleDesc: "",
    });

    if (!open) return null;

    function resetForm() {
        setFormData({
            displayName: "",
            phone: "",
            licencePlate: "",
            vehicleDesc: "",
        });
        setEditingDriver(null);
        setIsFormOpen(false);
    }

    function startEdit(driver: InventoryDriver) {
        setEditingDriver(driver);
        setFormData({
            displayName: driver.displayName,
            phone: driver.phone ?? "",
            licencePlate: driver.licencePlate ?? "",
            vehicleDesc: driver.vehicleDesc ?? "",
        });
        setIsFormOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.displayName.trim()) {
            toast.error("Please enter driver name");
            return;
        }

        try {
            if (editingDriver) {
                await updateDriver({
                    id: editingDriver.id,
                    body: {
                        displayName: formData.displayName.trim(),
                        phone: formData.phone.trim() || undefined,
                        licencePlate: formData.licencePlate.trim() || undefined,
                        vehicleDesc: formData.vehicleDesc.trim() || undefined,
                    },
                }).unwrap();
                toast.success("Driver updated successfully");
                resetForm();
            } else {
                const res = await createDriver({
                    displayName: formData.displayName.trim(),
                    phone: formData.phone.trim() || undefined,
                    licencePlate: formData.licencePlate.trim() || undefined,
                    vehicleDesc: formData.vehicleDesc.trim() || undefined,
                }).unwrap();
                toast.success("Driver registered successfully");
                if (onSelectDriver && res.data) {
                    onSelectDriver(res.data);
                }
                resetForm();
            }
        } catch (err) {
            toast.fromUnknown(err, "Failed to save driver");
        }
    }

    async function toggleStatus(driver: InventoryDriver) {
        const nextStatus = driver.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        try {
            await updateDriver({
                id: driver.id,
                body: { status: nextStatus },
            }).unwrap();
            toast.success(
                nextStatus === "ACTIVE"
                    ? `${driver.displayName} activated`
                    : `${driver.displayName} deactivated`,
            );
        } catch (err) {
            toast.fromUnknown(err, "Failed to change driver status");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-hairline bg-surface-card p-6 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                            <Truck className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                Fleet & Drivers
                            </h2>
                            <p className="text-xs text-slate-gray">
                                Register transit drivers and assign to transfers
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-gray hover:bg-surface-ivory hover:text-foreground transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Form or Add button */}
                <div className="my-4">
                    {!isFormOpen ? (
                        <button
                            onClick={() => {
                                resetForm();
                                setIsFormOpen(true);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline py-3 text-xs font-medium text-amber-600 hover:border-amber-400 hover:bg-amber-500/5 transition-all"
                        >
                            <Plus className="size-4" />
                            Register New Driver
                        </button>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-3.5 rounded-2xl border border-hairline bg-surface-ivory/60 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">
                                    {editingDriver
                                        ? "Edit Driver"
                                        : "Register Driver"}
                                </span>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-xs text-slate-gray hover:text-foreground"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                        Driver Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.displayName}
                                        onChange={e =>
                                            setFormData(f => ({
                                                ...f,
                                                displayName: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. Abebe Kebede"
                                        className="h-9 w-full rounded-xl border border-hairline bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e =>
                                            setFormData(f => ({
                                                ...f,
                                                phone: e.target.value,
                                            }))
                                        }
                                        placeholder="+251 9..."
                                        className="h-9 w-full rounded-xl border border-hairline bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                        Licence Plate
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.licencePlate}
                                        onChange={e =>
                                            setFormData(f => ({
                                                ...f,
                                                licencePlate: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. 3-12345 AA"
                                        className="h-9 w-full rounded-xl border border-hairline bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                        Vehicle Description
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.vehicleDesc}
                                        onChange={e =>
                                            setFormData(f => ({
                                                ...f,
                                                vehicleDesc: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. White Toyota Hiace"
                                        className="h-9 w-full rounded-xl border border-hairline bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="h-8 rounded-xl border border-hairline px-3 text-xs font-medium hover:bg-surface-ivory"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="flex h-8 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {isCreating || isUpdating ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Check className="size-3.5" />
                                    )}
                                    {editingDriver
                                        ? "Save Changes"
                                        : "Register Driver"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Driver List */}
                <div className="flex-1 overflow-y-auto pr-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-xs text-slate-gray">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Loading drivers...
                        </div>
                    ) : drivers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Truck className="size-10 text-slate-gray/40 mb-2" />
                            <p className="text-xs font-medium text-slate-gray">
                                No drivers registered yet
                            </p>
                            <p className="mt-1 text-[11px] text-slate-gray/70">
                                Register your delivery drivers or contracted
                                fleet for transfer tracking.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {drivers.map(driver => {
                                const isActive = driver.status === "ACTIVE";
                                return (
                                    <div
                                        key={driver.id}
                                        className="rounded-2xl border border-hairline bg-background p-3.5 transition-colors hover:border-amber-500/40"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                                                <Truck className="size-4.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="truncate text-[13px] font-semibold text-foreground">
                                                        {driver.displayName}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                            isActive
                                                                ? "bg-emerald-500/10 text-emerald-600"
                                                                : "bg-slate-gray/10 text-slate-gray"
                                                        }`}
                                                    >
                                                        {driver.status}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 truncate text-[11px] text-slate-gray">
                                                    {[
                                                        driver.phone,
                                                        driver.licencePlate,
                                                        driver.vehicleDesc,
                                                    ]
                                                        .filter(Boolean)
                                                        .join("  ·  ") ||
                                                        "No contact or vehicle info"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-hairline pt-2.5">
                                            <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-gray">
                                                {driver.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="size-3" />
                                                        {driver.phone}
                                                    </span>
                                                )}
                                                {driver.licencePlate && (
                                                    <span className="rounded bg-surface-ivory px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                                                        {driver.licencePlate}
                                                    </span>
                                                )}
                                                {driver.vehicleDesc && (
                                                    <span className="truncate">
                                                        {driver.vehicleDesc}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex shrink-0 items-center gap-1">
                                                {onSelectDriver && isActive && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onSelectDriver(
                                                                driver,
                                                            );
                                                            onClose();
                                                        }}
                                                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-700"
                                                    >
                                                        Select
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        startEdit(driver)
                                                    }
                                                    className="rounded-lg border border-hairline p-1.5 text-slate-gray hover:bg-surface-ivory hover:text-foreground"
                                                    title="Edit Driver"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleStatus(driver)
                                                    }
                                                    className={`rounded-lg px-2 py-1.5 text-[11px] font-medium ${
                                                        isActive
                                                            ? "text-rose-600 hover:bg-rose-500/10"
                                                            : "text-emerald-600 hover:bg-emerald-500/10"
                                                    }`}
                                                >
                                                    {isActive
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
