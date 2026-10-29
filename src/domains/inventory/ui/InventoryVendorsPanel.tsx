"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
    AlertTriangle,
    Building2,
    Loader2,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Search,
    Store,
    Trash2,
    User,
    X,
} from "lucide-react";
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

const VENDOR_TYPES = [
    { value: "FARM", label: "Direct Farm / Grower" },
    { value: "SUPPLIER", label: "Food Distributor / Wholesale" },
    { value: "MARKET", label: "Local Produce Market" },
    { value: "CENTRAL_WAREHOUSE", label: "Central Commissary / Warehouse" },
];

const VENDOR_TYPES_AM = [
    { value: "FARM", label: "ቀጥታ ከእርሻ / አምራች" },
    { value: "SUPPLIER", label: "አከፋፋይ / ጅምላ ሻጭ" },
    { value: "MARKET", label: "የአካባቢ ገበያ" },
    { value: "CENTRAL_WAREHOUSE", label: "ማዕከላዊ መጋዘን" },
];

export function InventoryVendorsPanel() {
    const locale = useLocale();
    const isAm = locale === "am";
    const vendorTypes = isAm ? VENDOR_TYPES_AM : VENDOR_TYPES;

    const { data: vendorsRes, isLoading } = useListVendorsQuery();
    const vendors = vendorsRes?.data ?? [];

    const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
    const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
    const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");

    const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<InventoryVendor | null>(
        null,
    );
    const [deletingVendor, setDeletingVendor] =
        useState<InventoryVendor | null>(null);

    const [formData, setFormData] = useState({
        type: "FARM",
        name: "",
        contactPerson: "",
        phone: "",
        address: "",
    });

    const filteredVendors = useMemo(() => {
        return vendors.filter(v => {
            const matchesType = typeFilter === "ALL" || v.type === typeFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                v.name.toLowerCase().includes(q) ||
                (v.contactPerson &&
                    v.contactPerson.toLowerCase().includes(q)) ||
                (v.phone && v.phone.toLowerCase().includes(q)) ||
                (v.address && v.address.toLowerCase().includes(q));
            return matchesType && matchesQuery;
        });
    }, [vendors, typeFilter, searchQuery]);

    function openCreate() {
        setEditingVendor(null);
        setFormData({
            type: "FARM",
            name: "",
            contactPerson: "",
            phone: "",
            address: "",
        });
        setIsSideSheetOpen(true);
    }

    function openEdit(vendor: InventoryVendor) {
        setEditingVendor(vendor);
        setFormData({
            type: vendor.type,
            name: vendor.name,
            contactPerson: vendor.contactPerson ?? "",
            phone: vendor.phone ?? "",
            address: vendor.address ?? "",
        });
        setIsSideSheetOpen(true);
    }

    function closeSideSheet() {
        setIsSideSheetOpen(false);
        setEditingVendor(null);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            toast.error("Vendor name is required");
            return;
        }

        try {
            if (editingVendor) {
                await updateVendor({
                    id: editingVendor.id,
                    body: {
                        type: formData.type,
                        name: trimmedName,
                        contactPerson:
                            formData.contactPerson.trim() || undefined,
                        phone: formData.phone.trim() || undefined,
                        address: formData.address.trim() || undefined,
                    },
                }).unwrap();
                toast.success(`Vendor "${trimmedName}" updated`);
            } else {
                await createVendor({
                    type: formData.type,
                    name: trimmedName,
                    contactPerson: formData.contactPerson.trim() || undefined,
                    phone: formData.phone.trim() || undefined,
                    address: formData.address.trim() || undefined,
                }).unwrap();
                toast.success(`Vendor "${trimmedName}" registered`);
            }
            closeSideSheet();
        } catch (err) {
            toast.fromUnknown(err, "Failed to save vendor");
        }
    }

    async function confirmDelete() {
        if (!deletingVendor) return;
        try {
            await deleteVendor(deletingVendor.id).unwrap();
            toast.success(`Vendor "${deletingVendor.name}" deleted`);
            setDeletingVendor(null);
        } catch (err) {
            toast.fromUnknown(err, "Failed to delete vendor");
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
                                    ? "አቅራቢዎችን በስም፣ አድራሻ፣ ስልክ ይፈልጉ..."
                                    : "Search vendors by name, contact, phone..."
                            }
                            className="h-10 w-full rounded-xl border border-hairline bg-card pl-9 pr-3 text-[13px] text-foreground placeholder:text-slate-gray focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
                        />
                    </div>

                    <div className="w-44">
                        <InventoryNiceSelect
                            value={typeFilter}
                            placeholder={
                                isAm ? "ሁሉም የአቅራቢ ዓይነቶች" : "All Vendor Types"
                            }
                            onChange={setTypeFilter}
                            options={[
                                {
                                    value: "ALL",
                                    label: isAm
                                        ? "ሁሉም የአቅራቢ ዓይነቶች"
                                        : "All Vendor Types",
                                },
                                ...vendorTypes,
                            ]}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 text-[13px] font-semibold shadow-xs transition-colors shrink-0"
                >
                    <Plus className="size-4 stroke-[2.5]" />
                    <span>{isAm ? "አቅራቢ ጨምር" : "Add Vendor"}</span>
                </button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                            <tr className="border-b border-hairline bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-slate-gray">
                                <th className="px-5 py-3">
                                    {isAm ? "አቅራቢ / ኩባንያ" : "Vendor / Supplier"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "ዓይነት" : "Type"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "ተጠሪ ሰው" : "Contact Person"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "ስልክ ቁጥር" : "Phone"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "አድራሻ / ክልል" : "Address / Region"}
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
                                        <Loader2 className="mx-auto size-6 animate-spin text-emerald-600 mb-2" />
                                        <span>
                                            {isAm
                                                ? "አቅራቢዎች በመጫን ላይ..."
                                                : "Loading vendors..."}
                                        </span>
                                    </td>
                                </tr>
                            ) : filteredVendors.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-12 text-center text-slate-gray"
                                    >
                                        <Store className="mx-auto size-10 stroke-[1.2] opacity-30 text-emerald-600 mb-2" />
                                        <p className="font-semibold text-foreground text-[14px]">
                                            {isAm
                                                ? "ምንም አቅራቢ አልተገኘም"
                                                : "No vendors found"}
                                        </p>
                                        <p className="text-[12px] text-slate-gray mt-0.5">
                                            {isAm
                                                ? "አቅራቢዎችን፣ የአካባቢ ገበሬዎችን ወይም አከፋፋዮችን ይመዝግቡ።"
                                                : "Register suppliers, local farms, or central distributors."}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredVendors.map(vendor => (
                                    <tr
                                        key={vendor.id}
                                        className="hover:bg-secondary/40 transition-colors"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                                    <Store className="size-4" />
                                                </div>
                                                <span className="font-semibold text-foreground">
                                                    {vendor.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex items-center rounded-md bg-secondary border border-hairline px-2 py-0.5 text-[11px] font-medium text-slate-gray">
                                                {VENDOR_TYPES.find(
                                                    t =>
                                                        t.value === vendor.type,
                                                )?.label ?? vendor.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-gray">
                                            {vendor.contactPerson ? (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="size-3.5 opacity-60" />
                                                    <span>
                                                        {vendor.contactPerson}
                                                    </span>
                                                </div>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-gray">
                                            {vendor.phone ? (
                                                <a
                                                    href={`tel:${vendor.phone}`}
                                                    className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                                                >
                                                    <Phone className="size-3.5" />
                                                    <span>{vendor.phone}</span>
                                                </a>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-gray max-w-xs truncate">
                                            {vendor.address ? (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 opacity-60 shrink-0" />
                                                    <span className="truncate">
                                                        {vendor.address}
                                                    </span>
                                                </div>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(vendor)
                                                    }
                                                    className="p-1.5 rounded-lg text-slate-gray hover:text-foreground hover:bg-secondary transition-colors"
                                                    title="Edit vendor"
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDeletingVendor(
                                                            vendor,
                                                        )
                                                    }
                                                    className="p-1.5 rounded-lg text-slate-gray hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                    title="Delete vendor"
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
                                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <Store className="size-4.5" />
                                </div>
                                <h3 className="text-[16px] font-bold text-foreground">
                                    {editingVendor
                                        ? "Edit Vendor"
                                        : "Add Vendor"}
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
                            <div className="space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    Vendor Category / Type
                                </span>
                                <InventoryNiceSelect
                                    value={formData.type}
                                    placeholder="Select vendor type"
                                    onChange={v =>
                                        setFormData(s => ({ ...s, type: v }))
                                    }
                                    options={VENDOR_TYPES}
                                />
                            </div>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    Vendor / Business Name{" "}
                                    <span className="text-rose-500">*</span>
                                </span>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Debre Zeit Farms, Green Valley Produce"
                                    required
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    Contact Person
                                </span>
                                <input
                                    type="text"
                                    value={formData.contactPerson}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            contactPerson: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Ato Bekele"
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                    placeholder="e.g. +251 91 123 4567"
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    Address / Delivery Point
                                </span>
                                <textarea
                                    rows={3}
                                    value={formData.address}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            address: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Addis Ababa, Bole Sub-city, Woreda 03"
                                    className="w-full rounded-xl border border-hairline bg-background p-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </label>

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
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 text-[13px] font-semibold shadow-xs disabled:opacity-60 transition-colors"
                                >
                                    {(isCreating || isUpdating) && (
                                        <Loader2 className="size-4 animate-spin" />
                                    )}
                                    <span>
                                        {editingVendor
                                            ? "Update Vendor"
                                            : "Save Vendor"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingVendor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-card p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 shrink-0">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-[16px] font-bold text-foreground">
                                    Delete Vendor
                                </h3>
                                <p className="text-[12px] text-slate-gray mt-0.5">
                                    Are you sure you want to remove{" "}
                                    <strong className="text-foreground">
                                        {deletingVendor.name}
                                    </strong>{" "}
                                    from suppliers list?
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeletingVendor(null)}
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
                                <span>Delete Vendor</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
