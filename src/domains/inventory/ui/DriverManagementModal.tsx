"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import { Check, Pencil, Phone, Plus, Truck, X } from "lucide-react";
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
    const t = useTranslations("inventory.drivers");
    const tCommon = useTranslations("common");
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
            toast.error(t("nameRequired"));
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
                toast.success(t("driverUpdated"));
                resetForm();
            } else {
                const res = await createDriver({
                    displayName: formData.displayName.trim(),
                    phone: formData.phone.trim() || undefined,
                    licencePlate: formData.licencePlate.trim() || undefined,
                    vehicleDesc: formData.vehicleDesc.trim() || undefined,
                }).unwrap();
                toast.success(t("driverRegistered"));
                if (onSelectDriver && res.data) {
                    onSelectDriver(res.data);
                }
                resetForm();
            }
        } catch (err) {
            toast.fromUnknown(err, t("saveFailed"));
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
                    ? t("activated", { name: driver.displayName })
                    : t("deactivated", { name: driver.displayName }),
            );
        } catch (err) {
            toast.fromUnknown(err, t("statusChangeFailed"));
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
                                {t("title")}
                            </h2>
                            <p className="text-xs text-slate-gray">
                                {t("subtitle")}
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
                            {t("registerDriver")}
                        </button>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-3.5 rounded-2xl border border-hairline bg-surface-ivory/60 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">
                                    {editingDriver
                                        ? t("editDriver")
                                        : t("registerDriver")}
                                </span>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-xs text-slate-gray hover:text-foreground"
                                >
                                    {t("cancel")}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                        {t("nameLabel")}
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
                                        placeholder={t("namePlaceholder")}
                                        className="h-9 w-full rounded-xl border border-hairline bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                        {t("phoneLabel")}
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
                                        placeholder={t("phonePlaceholder")}
                                        className="h-9 w-full rounded-xl border border-hairline bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                        {t("plateLabel")}
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
                                        placeholder={t("platePlaceholder")}
                                        className="h-9 w-full rounded-xl border border-hairline bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                        {t("vehicleLabel")}
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
                                        placeholder={t("vehiclePlaceholder")}
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
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="flex h-8 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {isCreating || isUpdating ? (
                                        <RestorchSpinner className="size-3.5 " />
                                    ) : (
                                        <Check className="size-3.5" />
                                    )}
                                    {t("save")}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Driver List */}
                <div className="flex-1 overflow-y-auto pr-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-xs text-slate-gray">
                            <RestorchSpinner className="mr-2 size-4 " />
                            {tCommon("loading")}
                        </div>
                    ) : drivers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Truck className="size-10 text-slate-gray/40 mb-2" />
                            <p className="text-xs font-medium text-slate-gray">
                                {tCommon("noData")}
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
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-xs text-foreground">
                                                        {driver.displayName}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                            isActive
                                                                ? "bg-emerald-500/10 text-emerald-600"
                                                                : "bg-slate-gray/10 text-slate-gray"
                                                        }`}
                                                    >
                                                        {isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-gray">
                                                    {driver.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="size-3" />
                                                            {driver.phone}
                                                        </span>
                                                    )}
                                                    {driver.licencePlate && (
                                                        <span className="font-mono bg-surface-ivory px-1.5 py-0.5 rounded text-[10px]">
                                                            {
                                                                driver.licencePlate
                                                            }
                                                        </span>
                                                    )}
                                                    {driver.vehicleDesc && (
                                                        <span>
                                                            {driver.vehicleDesc}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {onSelectDriver && (
                                                    <button
                                                        onClick={() =>
                                                            onSelectDriver(
                                                                driver,
                                                            )
                                                        }
                                                        className="rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors"
                                                    >
                                                        Select
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        startEdit(driver)
                                                    }
                                                    className="rounded-xl border border-hairline p-1.5 text-slate-gray hover:bg-surface-ivory hover:text-foreground transition-colors"
                                                    title={t("editDriver")}
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        toggleStatus(driver)
                                                    }
                                                    className={`rounded-xl border border-hairline px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                                        isActive
                                                            ? "text-rose-600 hover:bg-rose-500/10 hover:border-rose-500/30"
                                                            : "text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/30"
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
