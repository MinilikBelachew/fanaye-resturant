"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
    AlertTriangle,
    Building2,
    Globe,
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
    useGetInventoryNetworkStatusQuery,
    useListInventoryLocationsQuery,
    type InventoryVendor,
} from "@/context/services/inventoryApi";
import { useListBranchesQuery } from "@/context/services/branchesApi";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useAppSelector } from "@/context/hooks";
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

    const staff = useAppSelector(selectCurrentStaff);
    const { data: networkRes } = useGetInventoryNetworkStatusQuery();
    const network = networkRes?.data;
    const canOperateCentral =
        network?.canOperateCentral ??
        (staff?.role === "owner" || staff?.role === "store_manager");

    const { data: locationsRes } = useListInventoryLocationsQuery();
    const locations = locationsRes?.data ?? [];
    const branchStores = locations.filter(l => l.type === "BRANCH_STORE");
    const myBranchStore = !canOperateCentral ? (branchStores[0] ?? null) : null;
    const defaultBranchId = myBranchStore?.branchId ?? "";

    const { data: branchesRes } = useListBranchesQuery();
    const branches = branchesRes?.data ?? [];

    const { data: vendorsRes, isLoading } = useListVendorsQuery();
    const vendors = vendorsRes?.data ?? [];

    const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
    const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
    const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [scopeFilter, setScopeFilter] = useState("ALL");

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
        branchId: "",
    });

    const scopeOptions = useMemo(() => {
        const opts = [
            {
                value: "ALL",
                label: isAm
                    ? "ሁሉም ወሰኖች (ማዕከላዊ እና ቅርንጫፎች)"
                    : "All Scopes (Central & Branches)",
            },
            {
                value: "CENTRAL",
                label: isAm
                    ? "🌐 ማዕከላዊ / ኩባንያ አቀፍ ብቻ"
                    : "🌐 Company-Wide (Central Only)",
            },
        ];
        branches.forEach(b => {
            opts.push({
                value: `BRANCH:${b.id}`,
                label: `📍 ${b.name}${b.displayCode ? ` (${b.displayCode})` : ""}`,
            });
        });
        return opts;
    }, [branches, isAm]);

    const filteredVendors = useMemo(() => {
        return vendors.filter(v => {
            const matchesType = typeFilter === "ALL" || v.type === typeFilter;
            let matchesScope = true;
            if (scopeFilter === "CENTRAL") {
                matchesScope = !v.branchId;
            } else if (scopeFilter.startsWith("BRANCH:")) {
                const targetBranchId = scopeFilter.replace("BRANCH:", "");
                matchesScope = v.branchId === targetBranchId;
            }

            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                v.name.toLowerCase().includes(q) ||
                (v.contactPerson &&
                    v.contactPerson.toLowerCase().includes(q)) ||
                (v.phone && v.phone.toLowerCase().includes(q)) ||
                (v.address && v.address.toLowerCase().includes(q)) ||
                (v.branch?.name && v.branch.name.toLowerCase().includes(q));
            return matchesType && matchesScope && matchesQuery;
        });
    }, [vendors, typeFilter, scopeFilter, searchQuery]);

    const companyWideCount = useMemo(
        () => vendors.filter(v => !v.branchId).length,
        [vendors],
    );
    const branchSpecificCount = useMemo(
        () => vendors.filter(v => !!v.branchId).length,
        [vendors],
    );

    function openCreate() {
        setEditingVendor(null);
        setFormData({
            type: "FARM",
            name: "",
            contactPerson: "",
            phone: "",
            address: "",
            branchId: defaultBranchId,
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
            branchId: vendor.branchId ?? "",
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
            toast.error(
                isAm ? "የአቅራቢ ስም ማስገባት ግዴታ ነው" : "Vendor name is required",
            );
            return;
        }

        try {
            const branchIdPayload = formData.branchId
                ? formData.branchId
                : null;
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
                        branchId: branchIdPayload,
                    },
                }).unwrap();
                toast.success(
                    isAm
                        ? `አቅራቢ "${trimmedName}" ተሻሽሏል`
                        : `Vendor "${trimmedName}" updated`,
                );
            } else {
                await createVendor({
                    type: formData.type,
                    name: trimmedName,
                    contactPerson: formData.contactPerson.trim() || undefined,
                    phone: formData.phone.trim() || undefined,
                    address: formData.address.trim() || undefined,
                    branchId: branchIdPayload,
                }).unwrap();
                toast.success(
                    isAm
                        ? `አቅራቢ "${trimmedName}" ተመዝግቧል`
                        : `Vendor "${trimmedName}" registered`,
                );
            }
            closeSideSheet();
        } catch (err) {
            toast.fromUnknown(
                err,
                isAm ? "አቅራቢውን ማስቀመጥ አልተቻለም" : "Failed to save vendor",
            );
        }
    }

    async function confirmDelete() {
        if (!deletingVendor) return;
        try {
            await deleteVendor(deletingVendor.id).unwrap();
            toast.success(
                isAm
                    ? `አቅራቢ "${deletingVendor.name}" ተሰርዟል`
                    : `Vendor "${deletingVendor.name}" deleted`,
            );
            setDeletingVendor(null);
        } catch (err) {
            toast.fromUnknown(
                err,
                isAm ? "አቅራቢውን መሰረዝ አልተቻለም" : "Failed to delete vendor",
            );
        }
    }

    return (
        <div className="space-y-4">
            {/* Scope Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-hairline bg-card p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-gray">
                            {isAm ? "ጠቅላላ አቅራቢዎች" : "Total Suppliers"}
                        </div>
                        <div className="text-2xl font-black text-foreground mt-0.5">
                            {vendors.length}
                        </div>
                        <div className="text-[11px] text-slate-gray mt-0.5">
                            {isAm
                                ? "የተመዘገቡ አቅራቢዎች"
                                : "All registered suppliers"}
                        </div>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-slate-gray">
                        <Store className="size-5" />
                    </div>
                </div>

                <div className="rounded-2xl border border-hairline bg-card p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-gray">
                            {isAm
                                ? "ኩባንያ አቀፍ (ማዕከላዊ)"
                                : "Company-Wide (Central)"}
                        </div>
                        <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                            {companyWideCount}
                        </div>
                        <div className="text-[11px] text-purple-600/80 dark:text-purple-400/80 mt-0.5">
                            {isAm
                                ? "ለሁሉም ቅርንጫፎች የሚገኝ"
                                : "Available to all locations"}
                        </div>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Globe className="size-5" />
                    </div>
                </div>

                <div className="rounded-2xl border border-hairline bg-card p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-gray">
                            {isAm ? "ቅርንጫፍ ተኮር" : "Branch-Specific"}
                        </div>
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                            {branchSpecificCount}
                        </div>
                        <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                            {isAm
                                ? "ለተወሰኑ ቅርንጫፎች ብቻ"
                                : "Scoped to specific branches"}
                        </div>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <MapPin className="size-5" />
                    </div>
                </div>
            </div>

            {/* Top Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                    <div className="relative flex-1 min-w-[200px]">
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

                    <div className="w-56 min-w-[180px]">
                        <InventoryNiceSelect
                            value={scopeFilter}
                            placeholder={isAm ? "ወሰን ይምረጡ" : "Filter by Scope"}
                            onChange={setScopeFilter}
                            options={scopeOptions}
                        />
                    </div>

                    <div className="w-48 min-w-[160px]">
                        <InventoryNiceSelect
                            value={typeFilter}
                            placeholder={
                                isAm ? "ሁሉም የአቅራቢ ዓይነቶች" : "All Vendor Types"
                            }
                            onChange={setTypeFilter}
                            options={[
                                {
                                    value: "ALL",
                                    label: isAm ? "ሁሉም ዓይነቶች" : "All Types",
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
                                    {isAm ? "ወሰን / ቅርንጫፍ" : "Scope / Branch"}
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
                                        colSpan={7}
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
                                        colSpan={7}
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
                                            {vendor.branchId &&
                                            vendor.branch ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                                    <MapPin className="size-3 text-amber-600 dark:text-amber-400" />
                                                    <span>
                                                        {vendor.branch.name}
                                                    </span>
                                                    {vendor.branch
                                                        .displayCode ? (
                                                        <span className="opacity-70 text-[10px]">
                                                            (
                                                            {
                                                                vendor.branch
                                                                    .displayCode
                                                            }
                                                            )
                                                        </span>
                                                    ) : null}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                                                    <Globe className="size-3 text-purple-600 dark:text-purple-400" />
                                                    <span>
                                                        {isAm
                                                            ? "ኩባንያ አቀፍ (ማዕከላዊ)"
                                                            : "Company-Wide"}
                                                    </span>
                                                </span>
                                            )}
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
                                                    title={
                                                        isAm
                                                            ? "አቅራቢ አስተካክል"
                                                            : "Edit vendor"
                                                    }
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
                                                    title={
                                                        isAm
                                                            ? "አቅራቢ ሰርዝ"
                                                            : "Delete vendor"
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
                                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <Store className="size-4.5" />
                                </div>
                                <h3 className="text-[16px] font-bold text-foreground">
                                    {editingVendor
                                        ? isAm
                                            ? "አቅራቢ አስተካክል"
                                            : "Edit Vendor"
                                        : isAm
                                          ? "አዲስ አቅራቢ መዝግብ"
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
                            {/* Scope / Branch Selection */}
                            <div className="space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground flex items-center justify-between">
                                    <span>
                                        {isAm
                                            ? "የአቅርቦት ወሰን / ቅርንጫፍ"
                                            : "Supplier Scope & Branch"}
                                    </span>
                                    <span className="text-[11px] font-normal text-slate-gray">
                                        {formData.branchId
                                            ? isAm
                                                ? "ለተመረጠው ቅርንጫፍ ብቻ"
                                                : "Branch-specific"
                                            : isAm
                                              ? "ለሁሉም ቅርንጫፎች"
                                              : "Company-wide"}
                                    </span>
                                </span>
                                <InventoryNiceSelect
                                    value={formData.branchId || "CENTRAL"}
                                    placeholder={
                                        isAm ? "ወሰን ይምረጡ" : "Select scope"
                                    }
                                    onChange={v =>
                                        setFormData(s => ({
                                            ...s,
                                            branchId: v === "CENTRAL" ? "" : v,
                                        }))
                                    }
                                    options={[
                                        {
                                            value: "CENTRAL",
                                            label: isAm
                                                ? "🌐 ኩባንያ አቀፍ / ማዕከላዊ (ለሁሉም ቅርንጫፎች)"
                                                : "🌐 Company-Wide (All Branches & Central)",
                                            hint: isAm
                                                ? "ማዕከላዊ መጋዘን እና ሁሉም ቅርንጫፎች ሊጠቀሙበት ይችላሉ"
                                                : "Available to Main Warehouse and all branches",
                                        },
                                        ...branches.map(b => ({
                                            value: b.id,
                                            label: `📍 ${b.name}${b.displayCode ? ` (${b.displayCode})` : ""}`,
                                            hint: isAm
                                                ? "ለዚህ ቅርንጫፍ ብቻ የተወሰነ"
                                                : "Local branch supplier only",
                                        })),
                                    ]}
                                />
                                <p className="text-[11px] text-slate-gray leading-relaxed">
                                    {formData.branchId
                                        ? isAm
                                            ? "ይህ አቅራቢ በዚህ ቅርንጫፍ ብቻ ይታያል እንዲሁም እቃዎች ሲገቡ ይገኛል።"
                                            : "This supplier will only be visible and usable for receiving purchases at this specific branch."
                                        : isAm
                                          ? "ይህ አቅራቢ ለማዕከላዊ መጋዘን እና ለሁሉም ቅርንጫፎች በእኩል ይቀርባል (ኩባንያ አቀፍ)።"
                                          : "This supplier will be accessible to the Main Warehouse and all branch locations for receiving purchases."}
                                </p>
                            </div>

                            <div className="space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    {isAm
                                        ? "የአቅራቢ ዓይነት / ምድብ"
                                        : "Vendor Category / Type"}
                                </span>
                                <InventoryNiceSelect
                                    value={formData.type}
                                    placeholder={
                                        isAm
                                            ? "የአቅራቢ ዓይነት ይምረጡ"
                                            : "Select vendor type"
                                    }
                                    onChange={v =>
                                        setFormData(s => ({ ...s, type: v }))
                                    }
                                    options={vendorTypes}
                                />
                            </div>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    {isAm
                                        ? "የአቅራቢ / ድርጅት ስም"
                                        : "Vendor / Business Name"}{" "}
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
                                    placeholder={
                                        isAm
                                            ? "ለምሳሌ፦ ወንጂ እርሻ፣ መርካቶ ጅምላ አከፋፋይ"
                                            : "e.g. Wenji Farm, Green Valley Produce"
                                    }
                                    required
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    {isAm ? "ተጠሪ ሰው" : "Contact Person"}
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
                                    placeholder={
                                        isAm
                                            ? "ለምሳሌ፦ አቶ በቀለ"
                                            : "e.g. Ato Bekele"
                                    }
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    {isAm ? "ስልክ ቁጥር" : "Phone Number"}
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
                                    {isAm
                                        ? "አድራሻ / የመረከቢያ ቦታ"
                                        : "Address / Delivery Point"}
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
                                    placeholder={
                                        isAm
                                            ? "ለምሳሌ፦ አዲስ አበባ፣ ቦሌ ክ/ከተማ፣ ወረዳ 03"
                                            : "e.g. Addis Ababa, Bole Sub-city, Woreda 03"
                                    }
                                    className="w-full rounded-xl border border-hairline bg-background p-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </label>

                            <div className="pt-4 flex justify-end gap-2 border-t border-hairline">
                                <button
                                    type="button"
                                    onClick={closeSideSheet}
                                    className="h-10 rounded-xl border border-hairline px-4 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                                >
                                    {isAm ? "ተመለስ" : "Cancel"}
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
                                            ? isAm
                                                ? "አቅራቢ አድስ"
                                                : "Update Vendor"
                                            : isAm
                                              ? "አቅራቢ መዝግብ"
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
                                    {isAm ? "አቅራቢ ሰርዝ" : "Delete Vendor"}
                                </h3>
                                <p className="text-[12px] text-slate-gray mt-0.5">
                                    {isAm ? (
                                        <>
                                            በእርግጥ አቅራቢ{" "}
                                            <strong className="text-foreground">
                                                {deletingVendor.name}
                                            </strong>
                                            ን ከአቅራቢዎች ዝርዝር ማስወገድ ይፈልጋሉ?
                                        </>
                                    ) : (
                                        <>
                                            Are you sure you want to remove{" "}
                                            <strong className="text-foreground">
                                                {deletingVendor.name}
                                            </strong>{" "}
                                            from suppliers list?
                                        </>
                                    )}
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
                                {isAm ? "አትሰርዝ" : "Cancel"}
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
                                <span>{isAm ? "አዎ ሰርዝ" : "Delete Vendor"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
