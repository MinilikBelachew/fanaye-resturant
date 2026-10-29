"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Pencil,
    Phone,
    Plus,
    Search,
    Trash2,
    Truck,
    User,
    X,
} from "lucide-react";
import {
    useCreateDriverMutation,
    useDeleteDriverMutation,
    useListDriversQuery,
    useUpdateDriverMutation,
    type InventoryDriver,
} from "@/context/services/inventoryApi";
import { InventoryNiceSelect } from "@/domains/inventory/ui/InventoryFormControls";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function InventoryDriversPanel() {
    const locale = useLocale();
    const isAm = locale === "am";

    const { data: driversRes, isLoading } = useListDriversQuery();
    const drivers = driversRes?.data ?? [];

    const [createDriver, { isLoading: isCreating }] = useCreateDriverMutation();
    const [updateDriver, { isLoading: isUpdating }] = useUpdateDriverMutation();
    const [deleteDriver, { isLoading: isDeleting }] = useDeleteDriverMutation();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<InventoryDriver | null>(
        null,
    );
    const [deletingDriver, setDeletingDriver] =
        useState<InventoryDriver | null>(null);

    const [formData, setFormData] = useState({
        displayName: "",
        phone: "",
        licencePlate: "",
        vehicleDesc: "",
        status: "ACTIVE",
    });

    const filteredDrivers = useMemo(() => {
        return drivers.filter(d => {
            const matchesStatus =
                statusFilter === "ALL" ||
                (d.status ?? "ACTIVE") === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                d.displayName.toLowerCase().includes(q) ||
                (d.phone && d.phone.toLowerCase().includes(q)) ||
                (d.licencePlate && d.licencePlate.toLowerCase().includes(q)) ||
                (d.vehicleDesc && d.vehicleDesc.toLowerCase().includes(q));
            return matchesStatus && matchesQuery;
        });
    }, [drivers, statusFilter, searchQuery]);

    function openCreate() {
        setEditingDriver(null);
        setFormData({
            displayName: "",
            phone: "",
            licencePlate: "",
            vehicleDesc: "",
            status: "ACTIVE",
        });
        setIsSideSheetOpen(true);
    }

    function openEdit(driver: InventoryDriver) {
        setEditingDriver(driver);
        setFormData({
            displayName: driver.displayName,
            phone: driver.phone ?? "",
            licencePlate: driver.licencePlate ?? "",
            vehicleDesc: driver.vehicleDesc ?? "",
            status: driver.status ?? "ACTIVE",
        });
        setIsSideSheetOpen(true);
    }

    function closeSideSheet() {
        setIsSideSheetOpen(false);
        setEditingDriver(null);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        const trimmedName = formData.displayName.trim();
        if (!trimmedName) {
            toast.error("Driver display name is required");
            return;
        }

        try {
            if (editingDriver) {
                await updateDriver({
                    id: editingDriver.id,
                    body: {
                        displayName: trimmedName,
                        phone: formData.phone.trim() || undefined,
                        licencePlate: formData.licencePlate.trim() || undefined,
                        vehicleDesc: formData.vehicleDesc.trim() || undefined,
                        status: formData.status,
                    },
                }).unwrap();
                toast.success(`Driver "${trimmedName}" updated`);
            } else {
                await createDriver({
                    displayName: trimmedName,
                    phone: formData.phone.trim() || undefined,
                    licencePlate: formData.licencePlate.trim() || undefined,
                    vehicleDesc: formData.vehicleDesc.trim() || undefined,
                }).unwrap();
                toast.success(`Driver "${trimmedName}" registered`);
            }
            closeSideSheet();
        } catch (err) {
            toast.fromUnknown(err, "Failed to save driver");
        }
    }

    async function confirmDelete() {
        if (!deletingDriver) return;
        try {
            await deleteDriver(deletingDriver.id).unwrap();
            toast.success(`Driver "${deletingDriver.displayName}" removed`);
            setDeletingDriver(null);
        } catch (err) {
            toast.fromUnknown(err, "Failed to delete driver");
        }
    }

    return (
        <div className="space-y-4">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={
                                isAm
                                    ? "አሽከርካሪዎችን በስም፣ ስልክ፣ ታርጋ ይፈልጉ..."
                                    : "Search drivers by name, phone, licence plate..."
                            }
                            className="h-10 w-full rounded-xl border border-hairline bg-card pl-9 pr-3 text-[13px] text-foreground placeholder:text-slate-gray focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
                        />
                    </div>

                    <div className="w-40">
                        <InventoryNiceSelect
                            value={statusFilter}
                            placeholder={isAm ? "ሁሉም ሁኔታዎች" : "All Statuses"}
                            onChange={setStatusFilter}
                            options={[
                                {
                                    value: "ALL",
                                    label: isAm ? "ሁሉም ሁኔታዎች" : "All Statuses",
                                },
                                {
                                    value: "ACTIVE",
                                    label: isAm ? "ንቁ" : "Active",
                                },
                                {
                                    value: "INACTIVE",
                                    label: isAm ? "ያልነቃ" : "Inactive",
                                },
                            ]}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 text-[13px] font-semibold shadow-xs transition-colors shrink-0"
                >
                    <Plus className="size-4 stroke-[2.5]" />
                    <span>{isAm ? "አሽከርካሪ ጨምር" : "Add Driver"}</span>
                </button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                            <tr className="border-b border-hairline bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-slate-gray">
                                <th className="px-5 py-3">
                                    {isAm ? "የአሽከርካሪ ስም" : "Driver Name"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "ስልክ ቁጥር" : "Phone"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm
                                        ? "ተሽከርካሪ / መግለጫ"
                                        : "Vehicle / Description"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "የሰሌዳ ቁጥር" : "Licence Plate"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "ሁኔታ" : "Status"}
                                </th>
                                <th className="px-5 py-3 text-right">
                                    {isAm ? "ተግባራት" : "Actions"}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-12 text-center text-slate-gray"
                                    >
                                        <Loader2 className="mx-auto size-6 animate-spin text-amber-600 mb-2" />
                                        <span>
                                            {isAm
                                                ? "አሽከርካሪዎች በመጫን ላይ..."
                                                : "Loading drivers..."}
                                        </span>
                                    </td>
                                </tr>
                            ) : filteredDrivers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-12 text-center text-slate-gray"
                                    >
                                        <Truck className="mx-auto size-10 stroke-[1.2] opacity-30 text-amber-600 mb-2" />
                                        <p className="font-semibold text-foreground text-[14px]">
                                            {isAm
                                                ? "ምንም የተመዘገበ አሽከርካሪ የለም"
                                                : "No drivers registered"}
                                        </p>
                                        <p className="text-[12px] text-slate-gray mt-0.5">
                                            {isAm
                                                ? "በዋና መጋዘን እና በቅርንጫፍ መደብሮች መካከል ዕቃ ለማጓጓዝ አሽከርካሪዎችን ይመዝግቡ።"
                                                : "Add drivers to dispatch deliveries between central warehouse and branch stores."}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDrivers.map(driver => (
                                    <tr
                                        key={driver.id}
                                        className="hover:bg-secondary/40 transition-colors"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                                                    <Truck className="size-4" />
                                                </div>
                                                <span className="font-semibold text-foreground">
                                                    {driver.displayName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-gray">
                                            {driver.phone ? (
                                                <a
                                                    href={`tel:${driver.phone}`}
                                                    className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                                                >
                                                    <Phone className="size-3.5" />
                                                    <span>{driver.phone}</span>
                                                </a>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-gray">
                                            {driver.vehicleDesc || "—"}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {driver.licencePlate ? (
                                                <span className="inline-flex items-center rounded-md bg-secondary border border-hairline px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-gray">
                                                    {driver.licencePlate}
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {(driver.status ?? "ACTIVE") ===
                                            "ACTIVE" ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                                    {isAm ? "ንቁ" : "Active"}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-slate-gray border border-hairline px-2.5 py-0.5 text-[11px] font-medium">
                                                    <span className="size-1.5 rounded-full bg-slate-400" />
                                                    {isAm ? "ያልነቃ" : "Inactive"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(driver)
                                                    }
                                                    className="p-1.5 rounded-lg text-slate-gray hover:text-foreground hover:bg-secondary transition-colors"
                                                    title={
                                                        isAm
                                                            ? "አሽከርካሪ አርትዕ"
                                                            : "Edit driver"
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDeletingDriver(
                                                            driver,
                                                        )
                                                    }
                                                    className="p-1.5 rounded-lg text-slate-gray hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                    title={
                                                        isAm
                                                            ? "አሽከርካሪ ሰርዝ"
                                                            : "Delete driver"
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slide-Over Side Sheet for Add / Edit */}
            {isSideSheetOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="flex-1" onClick={closeSideSheet} />
                    <aside className="relative flex h-full w-full max-w-md flex-col bg-card border-l border-hairline shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Truck className="size-4.5" />
                                </div>
                                <h3 className="text-[16px] font-bold text-foreground">
                                    {editingDriver
                                        ? "Edit Driver"
                                        : "Add Driver"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={closeSideSheet}
                                className="rounded-full p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSave}
                            className="flex-1 overflow-y-auto p-6 space-y-4"
                        >
                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    Driver Full Name{" "}
                                    <span className="text-rose-500">*</span>
                                </span>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            displayName: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Abebe Bikila"
                                    required
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    Phone Number
                                </span>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            phone: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. +251 91 234 5678"
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    Vehicle Type / Model
                                </span>
                                <input
                                    type="text"
                                    value={formData.vehicleDesc}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            vehicleDesc: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Isuzu NPR Chilled Box, Toyota Hiace Van"
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    Licence Plate Number
                                </span>
                                <input
                                    type="text"
                                    value={formData.licencePlate}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            licencePlate:
                                                e.target.value.toUpperCase(),
                                        }))
                                    }
                                    placeholder="e.g. 3-B12345 AA"
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 font-mono text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </label>

                            {editingDriver && (
                                <div className="space-y-1.5 text-[12px]">
                                    <span className="font-semibold text-foreground">
                                        Status
                                    </span>
                                    <InventoryNiceSelect
                                        value={formData.status}
                                        placeholder="Select status"
                                        onChange={v =>
                                            setFormData(s => ({
                                                ...s,
                                                status: v,
                                            }))
                                        }
                                        options={[
                                            {
                                                value: "ACTIVE",
                                                label: "Active",
                                            },
                                            {
                                                value: "INACTIVE",
                                                label: "Inactive",
                                            },
                                        ]}
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-2 border-t border-hairline">
                                <button
                                    type="button"
                                    onClick={closeSideSheet}
                                    className="h-10 rounded-xl border border-hairline px-4 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 text-[13px] font-semibold shadow-xs disabled:opacity-60 transition-colors"
                                >
                                    {(isCreating || isUpdating) && (
                                        <Loader2 className="size-4 animate-spin" />
                                    )}
                                    <span>
                                        {editingDriver
                                            ? "Update Driver"
                                            : "Save Driver"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingDriver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-card p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 shrink-0">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-[16px] font-bold text-foreground">
                                    Delete Driver
                                </h3>
                                <p className="text-[12px] text-slate-gray mt-0.5">
                                    Are you sure you want to remove{" "}
                                    <strong className="text-foreground">
                                        {deletingDriver.displayName}
                                    </strong>{" "}
                                    from the fleet drivers list?
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeletingDriver(null)}
                                className="h-10 rounded-xl border border-hairline px-4 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={confirmDelete}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 text-[13px] font-semibold shadow-xs disabled:opacity-60 transition-colors"
                            >
                                {isDeleting && (
                                    <Loader2 className="size-4 animate-spin" />
                                )}
                                <span>Delete Driver</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
