"use client";

import { useState } from "react";
import {
    Check,
    Loader2,
    Pencil,
    Phone,
    Plus,
    Store,
    Trash2,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
    useCreateVendorMutation,
    useDeleteVendorMutation,
    useListVendorsQuery,
    useUpdateVendorMutation,
    type InventoryVendor,
} from "@/context/services/inventoryApi";
import { InventoryNiceSelect } from "@/domains/inventory/ui/InventoryFormControls";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface VendorManagerSheetProps {
    open: boolean;
    onClose: () => void;
    onSelectVendor?: (vendor: InventoryVendor) => void;
}

export function VendorManagerSheet({
    open,
    onClose,
    onSelectVendor,
}: VendorManagerSheetProps) {
    const t = useTranslations("inventory");
    const { data: vendorsRes, isLoading } = useListVendorsQuery();
    const vendors = vendorsRes?.data ?? [];

    const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
    const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
    const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

    const [editingVendor, setEditingVendor] = useState<InventoryVendor | null>(
        null,
    );
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formData, setFormData] = useState({
        type: "FARM",
        name: "",
        contactPerson: "",
        phone: "",
        address: "",
    });

    if (!open) return null;

    function resetForm() {
        setFormData({
            type: "FARM",
            name: "",
            contactPerson: "",
            phone: "",
            address: "",
        });
        setEditingVendor(null);
        setIsFormOpen(false);
    }

    function startEdit(vendor: InventoryVendor) {
        setEditingVendor(vendor);
        setFormData({
            type: vendor.type,
            name: vendor.name,
            contactPerson: vendor.contactPerson ?? "",
            phone: vendor.phone ?? "",
            address: vendor.address ?? "",
        });
        setIsFormOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error(t("vendorsErrName"));
            return;
        }
        try {
            if (editingVendor) {
                await updateVendor({
                    id: editingVendor.id,
                    body: {
                        type: formData.type,
                        name: formData.name.trim(),
                        contactPerson:
                            formData.contactPerson.trim() || undefined,
                        phone: formData.phone.trim() || undefined,
                        address: formData.address.trim() || undefined,
                    },
                }).unwrap();
                toast.success(t("vendorsToastUpdated"));
                resetForm();
            } else {
                const res = await createVendor({
                    type: formData.type,
                    name: formData.name.trim(),
                    contactPerson: formData.contactPerson.trim() || undefined,
                    phone: formData.phone.trim() || undefined,
                    address: formData.address.trim() || undefined,
                }).unwrap();
                toast.success(t("vendorsToastCreated"));
                if (onSelectVendor && res.data) {
                    onSelectVendor(res.data);
                }
                resetForm();
            }
        } catch (err) {
            toast.fromUnknown(err, t("vendorsErrSave"));
        }
    }

    async function toggleStatus(vendor: InventoryVendor) {
        const nextStatus = vendor.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        try {
            await updateVendor({
                id: vendor.id,
                body: { status: nextStatus },
            }).unwrap();
            toast.success(
                nextStatus === "ACTIVE"
                    ? t("vendorsToastActivated", { name: vendor.name })
                    : t("vendorsToastDeactivated", { name: vendor.name }),
            );
        } catch (err) {
            toast.fromUnknown(err, t("vendorsErrSave"));
        }
    }

    async function handleDelete(vendor: InventoryVendor) {
        try {
            await deleteVendor(vendor.id).unwrap();
            toast.success(t("vendorsToastDeleted"));
            if (editingVendor?.id === vendor.id) resetForm();
        } catch (err) {
            toast.fromUnknown(err, t("vendorsErrDelete"));
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
            <div className="flex-1" onClick={onClose} aria-hidden="true" />

            <div className="relative flex h-full w-full max-w-lg flex-col border-l border-hairline bg-card shadow-2xl animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-surface-ivory px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                            <Store className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-semibold text-foreground">
                                {t("vendorsManagerTitle")}
                            </h2>
                            <p className="text-[12px] text-slate-gray">
                                {t("vendorsManagerSub")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-full text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Add button / form */}
                <div className="shrink-0 border-b border-hairline px-6 py-4">
                    {!isFormOpen ? (
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setIsFormOpen(true);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-hairline py-2.5 text-[12px] font-medium text-emerald-600 hover:border-emerald-400 hover:bg-emerald-500/5 transition-all"
                        >
                            <Plus className="size-4" />
                            {t("vendorsAddButton")}
                        </button>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-3 rounded-xl border border-hairline bg-background/60 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-semibold">
                                    {editingVendor
                                        ? t("vendorsEditTitle")
                                        : t("vendorsAddTitle")}
                                </span>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-[12px] text-slate-gray hover:text-foreground"
                                >
                                    {t("cancelConfirm")}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className="space-y-1 text-[12px]">
                                    <span className="font-medium text-slate-gray">
                                        {t("vendorsFieldType")}
                                    </span>
                                    <InventoryNiceSelect
                                        value={formData.type}
                                        placeholder=""
                                        options={[
                                            {
                                                value: "FARM",
                                                label: t("vendorsTypeFarm"),
                                            },
                                            {
                                                value: "NEGADE",
                                                label: t("vendorsTypeNegade"),
                                            },
                                            {
                                                value: "OTHER",
                                                label: t("vendorsTypeOther"),
                                            },
                                        ]}
                                        onChange={v =>
                                            setFormData(f => ({
                                                ...f,
                                                type: v,
                                            }))
                                        }
                                    />
                                </label>
                                <label className="space-y-1 text-[12px]">
                                    <span className="font-medium text-slate-gray">
                                        {t("vendorsFieldName")} *
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e =>
                                            setFormData(f => ({
                                                ...f,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder={t(
                                            "vendorsNamePlaceholder",
                                        )}
                                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                                    />
                                </label>
                                <label className="space-y-1 text-[12px]">
                                    <span className="font-medium text-slate-gray">
                                        {t("vendorsFieldContact")}
                                    </span>
                                    <input
                                        type="text"
                                        value={formData.contactPerson}
                                        onChange={e =>
                                            setFormData(f => ({
                                                ...f,
                                                contactPerson: e.target.value,
                                            }))
                                        }
                                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                                    />
                                </label>
                                <label className="space-y-1 text-[12px]">
                                    <span className="font-medium text-slate-gray">
                                        {t("vendorsFieldPhone")}
                                    </span>
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
                                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                                    />
                                </label>
                                <label className="space-y-1 text-[12px] sm:col-span-2">
                                    <span className="font-medium text-slate-gray">
                                        {t("vendorsFieldAddress")}
                                    </span>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={e =>
                                            setFormData(f => ({
                                                ...f,
                                                address: e.target.value,
                                            }))
                                        }
                                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                                    />
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="h-9 rounded-xl border border-hairline px-3 text-[12px] font-medium text-slate-gray hover:bg-secondary"
                                >
                                    {t("cancelConfirm")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {isCreating || isUpdating ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Check className="size-3.5" />
                                    )}
                                    {editingVendor
                                        ? t("save")
                                        : t("vendorsAddAction")}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Vendor list */}
                <div className="app-scroll flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-slate-gray">
                            <Loader2 className="size-4 animate-spin" />
                            {t("loading")}
                        </div>
                    ) : vendors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Store className="mb-2 size-10 text-slate-gray/40" />
                            <p className="text-[13px] font-medium text-slate-gray">
                                {t("vendorsNoVendors")}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-gray/70">
                                {t("vendorsNoVendorsSub")}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {vendors.map(vendor => {
                                const isActive = vendor.status === "ACTIVE";
                                return (
                                    <div
                                        key={vendor.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-background px-3 py-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-slate-gray">
                                                <Store className="size-4 text-emerald-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="truncate text-[13px] font-semibold">
                                                        {vendor.name}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                                            vendor.type ===
                                                                "FARM"
                                                                ? "bg-emerald-500/10 text-emerald-600"
                                                                : vendor.type ===
                                                                    "NEGADE"
                                                                  ? "bg-blue-500/10 text-blue-600"
                                                                  : "bg-slate-gray/10 text-slate-gray",
                                                        )}
                                                    >
                                                        {vendor.type === "FARM"
                                                            ? t(
                                                                  "vendorsTypeFarm",
                                                              )
                                                            : vendor.type ===
                                                                "NEGADE"
                                                              ? t(
                                                                    "vendorsTypeNegade",
                                                                )
                                                              : t(
                                                                    "vendorsTypeOther",
                                                                )}
                                                    </span>
                                                    {!isActive && (
                                                        <span className="rounded-full bg-slate-gray/10 px-2 py-0.5 text-[10px] font-medium text-slate-gray">
                                                            {vendor.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-gray">
                                                    {vendor.contactPerson && (
                                                        <span>
                                                            {
                                                                vendor.contactPerson
                                                            }
                                                        </span>
                                                    )}
                                                    {vendor.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="size-3" />
                                                            {vendor.phone}
                                                        </span>
                                                    )}
                                                    {vendor.address && (
                                                        <span className="truncate">
                                                            {vendor.address}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1">
                                            {onSelectVendor && isActive && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onSelectVendor(vendor);
                                                        onClose();
                                                    }}
                                                    className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-500/20"
                                                >
                                                    Select
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    startEdit(vendor)
                                                }
                                                className="rounded-lg p-2 text-slate-gray hover:bg-secondary hover:text-foreground"
                                                title={t("vendorsEditTitle")}
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isDeleting}
                                                onClick={() =>
                                                    handleDelete(vendor)
                                                }
                                                className="rounded-lg p-2 text-slate-gray hover:bg-rose-500/10 hover:text-rose-600"
                                                title={t("vendorsDelete")}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleStatus(vendor)
                                                }
                                                className={cn(
                                                    "rounded-lg px-2 py-1 text-[10px] font-medium",
                                                    isActive
                                                        ? "text-rose-600 hover:bg-rose-500/10"
                                                        : "text-emerald-600 hover:bg-emerald-500/10",
                                                )}
                                            >
                                                {isActive
                                                    ? t("vendorsDeactivate")
                                                    : t("vendorsActivate")}
                                            </button>
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
