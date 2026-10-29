"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
    AlertTriangle,
    FolderPlus,
    Loader2,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Tag,
    Trash2,
    X,
} from "lucide-react";
import {
    useCreateInventoryCategoryMutation,
    useDeleteInventoryCategoryMutation,
    useListInventoryCategoriesQuery,
    useUpdateInventoryCategoryMutation,
    type InventoryCategoryItem,
} from "@/context/services/inventoryApi";
import { PresetCategoryImportModal } from "@/domains/inventory/ui/PresetCategoryImportModal";
import { toast } from "@/lib/toast";

export function InventoryCategoriesPanel() {
    const locale = useLocale();
    const isAm = locale === "am";

    const { data: categoriesRes, isLoading } =
        useListInventoryCategoriesQuery();
    const categoriesData = categoriesRes?.data;
    const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

    const [createCategory, { isLoading: isCreating }] =
        useCreateInventoryCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] =
        useUpdateInventoryCategoryMutation();
    const [deleteCategory, { isLoading: isDeleting }] =
        useDeleteInventoryCategoryMutation();

    const [searchQuery, setSearchQuery] = useState("");
    const [editingCategory, setEditingCategory] =
        useState<InventoryCategoryItem | null>(null);
    const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
    const [presetImportOpen, setPresetImportOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] =
        useState<InventoryCategoryItem | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        amharicName: "",
        code: "",
        description: "",
        sortOrder: 0,
    });

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        const q = searchQuery.toLowerCase();
        return categories.filter(
            c =>
                c.name.toLowerCase().includes(q) ||
                (c.amharicName && c.amharicName.toLowerCase().includes(q)) ||
                c.code.toLowerCase().includes(q) ||
                (c.description && c.description.toLowerCase().includes(q)),
        );
    }, [categories, searchQuery]);

    function openCreate() {
        setEditingCategory(null);
        setFormData({
            name: "",
            amharicName: "",
            code: "",
            description: "",
            sortOrder: categories.length + 1,
        });
        setIsSideSheetOpen(true);
    }

    function openEdit(category: InventoryCategoryItem) {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            amharicName: category.amharicName ?? "",
            code: category.code,
            description: category.description ?? "",
            sortOrder: category.sortOrder,
        });
        setIsSideSheetOpen(true);
    }

    function closeSideSheet() {
        setIsSideSheetOpen(false);
        setEditingCategory(null);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            toast.error("Category name is required");
            return;
        }

        try {
            if (editingCategory) {
                await updateCategory({
                    id: editingCategory.id,
                    body: {
                        name: trimmedName,
                        amharicName: formData.amharicName.trim() || undefined,
                        code: formData.code.trim().toUpperCase() || undefined,
                        description: formData.description.trim() || undefined,
                        sortOrder: Number(formData.sortOrder) || 0,
                    },
                }).unwrap();
                toast.success(`Category "${trimmedName}" updated`);
            } else {
                await createCategory({
                    name: trimmedName,
                    amharicName: formData.amharicName.trim() || undefined,
                    code: formData.code.trim().toUpperCase() || undefined,
                    description: formData.description.trim() || undefined,
                    sortOrder: Number(formData.sortOrder) || 0,
                }).unwrap();
                toast.success(`Category "${trimmedName}" created`);
            }
            closeSideSheet();
        } catch (err) {
            toast.fromUnknown(err, "Could not save category");
        }
    }

    async function confirmDelete() {
        if (!deletingCategory) return;
        try {
            await deleteCategory(deletingCategory.id).unwrap();
            toast.success(`Category "${deletingCategory.name}" deleted`);
            setDeletingCategory(null);
        } catch (err) {
            toast.fromUnknown(err, "Could not delete category");
        }
    }

    return (
        <div className="space-y-4">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={
                            isAm ? "ምድቦችን ይፈልጉ..." : "Search categories..."
                        }
                        className="h-10 w-full rounded-xl border border-hairline bg-card pl-9 pr-3 text-[13px] text-foreground placeholder:text-slate-gray focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
                    />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setPresetImportOpen(true)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3.5 text-[13px] font-semibold shadow-xs transition-colors shrink-0"
                    >
                        <Sparkles className="size-4" />
                        <span>
                            {isAm ? "የተዘጋጁ ምድቦች" : "Standard Categories"}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 text-[13px] font-semibold shadow-xs transition-colors shrink-0"
                    >
                        <Plus className="size-4 stroke-[2.5]" />
                        <span>{isAm ? "አዲስ ምድብ" : "Add Category"}</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                            <tr className="border-b border-hairline bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-slate-gray">
                                <th className="px-5 py-3">
                                    {isAm ? "ምድብ" : "Category"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "ኮድ" : "Code"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "መግለጫ" : "Description"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "ዕቃዎች" : "Items"}
                                </th>
                                <th className="px-4 py-3">
                                    {isAm ? "ደረጃ" : "Sort"}
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
                                                ? "ምድቦች በመጫን ላይ…"
                                                : "Loading categories..."}
                                        </span>
                                    </td>
                                </tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-12 text-center text-slate-gray"
                                    >
                                        <Tag className="mx-auto size-10 stroke-[1.2] opacity-30 text-emerald-600 mb-2" />
                                        <p className="font-semibold text-foreground text-[14px]">
                                            {searchQuery
                                                ? isAm
                                                    ? "ምድብ አልተገኘም"
                                                    : "No categories found"
                                                : isAm
                                                  ? "እስካሁን ምንም ምድብ የለም"
                                                  : "No categories in your store yet"}
                                        </p>
                                        <p className="text-[12px] text-slate-gray mt-0.5 max-w-sm mx-auto">
                                            {searchQuery
                                                ? isAm
                                                    ? "ሌላ ቃል ይሞክሩ።"
                                                    : "Try a different search term."
                                                : isAm
                                                  ? "ለምግብ ቤትዎ የሚስማሙ የቁሳቁስ ምድቦችን ይምረጡ፣ ወይም ብጁ ምድብ ይጨምሩ።"
                                                  : "Select which standard Ethiopian & general categories match your restaurant, or add custom ones."}
                                        </p>
                                        {!searchQuery && (
                                            <div className="flex items-center justify-center gap-2.5 mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPresetImportOpen(
                                                            true,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-[12px] font-semibold shadow-xs transition-colors"
                                                >
                                                    <Sparkles className="size-3.5" />
                                                    <span>
                                                        {isAm
                                                            ? "ከተዘጋጁት ምድቦች ይምረጡ"
                                                            : "Select Standard Categories"}
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={openCreate}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-card hover:bg-secondary px-3.5 py-2 text-[12px] font-medium text-foreground shadow-xs transition-colors"
                                                >
                                                    <Plus className="size-3.5" />
                                                    <span>
                                                        {isAm
                                                            ? "ብጁ ምድብ"
                                                            : "Custom Category"}
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map(cat => (
                                    <tr
                                        key={cat.id}
                                        className="hover:bg-secondary/40 transition-colors group"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                                    <Tag className="size-4" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-foreground">
                                                        {isAm
                                                            ? cat.amharicName ||
                                                              cat.name
                                                            : cat.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-mono font-medium text-slate-gray border border-hairline">
                                                {cat.code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 max-w-xs truncate text-slate-gray">
                                            {cat.description || "—"}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums">
                                                {cat.itemCount}{" "}
                                                {isAm ? "ዕቃዎች" : "items"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-gray tabular-nums">
                                            {cat.sortOrder}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(cat)
                                                    }
                                                    className="p-1.5 rounded-lg text-slate-gray hover:text-foreground hover:bg-secondary transition-colors"
                                                    title={
                                                        isAm
                                                            ? "ምድብ አርትዕ"
                                                            : "Edit category"
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDeletingCategory(cat)
                                                    }
                                                    className="p-1.5 rounded-lg text-slate-gray hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                    title={
                                                        isAm
                                                            ? "ምድብ ሰርዝ"
                                                            : "Delete category"
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
                                    <FolderPlus className="size-4.5" />
                                </div>
                                <h3 className="text-[16px] font-bold text-foreground">
                                    {editingCategory
                                        ? isAm
                                            ? "ምድብ አርትዕ"
                                            : "Edit Category"
                                        : isAm
                                          ? "አዲስ ምድብ ጨምር"
                                          : "Add Category"}
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
                                    {isAm
                                        ? "የምድብ ስም (እንግሊዝኛ)"
                                        : "Category Name"}{" "}
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
                                            ? "ለምሳሌ Vegetables, Meat, Dairy"
                                            : "e.g. Vegetables, Dairy, Meat"
                                    }
                                    required
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    {isAm ? "የአማርኛ ስም" : "Amharic Name"}
                                </span>
                                <input
                                    type="text"
                                    value={formData.amharicName}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            amharicName: e.target.value,
                                        }))
                                    }
                                    placeholder={
                                        isAm
                                            ? "ለምሳሌ አትክልት፣ ስጋ፣ የወተት ተዋጽኦ"
                                            : "e.g. አትክልት፣ የወተት ተዋጽኦ"
                                    }
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    {isAm ? "የምድብ ኮድ" : "Category Code"}
                                </span>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            code: e.target.value.toUpperCase(),
                                        }))
                                    }
                                    placeholder="e.g. VEG, DAIRY, MEAT"
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 font-mono text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    {isAm ? "ቅደም ተከተል" : "Sort Order"}
                                </span>
                                <input
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            sortOrder:
                                                Number(e.target.value) || 0,
                                        }))
                                    }
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </label>

                            <label className="block space-y-1.5 text-[12px]">
                                <span className="font-semibold text-foreground">
                                    {isAm ? "መግለጫ" : "Description"}
                                </span>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e =>
                                        setFormData(s => ({
                                            ...s,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder={
                                        isAm
                                            ? "ስለ ምድቡ ተጨማሪ ማስታወሻ..."
                                            : "Optional notes or details about this category..."
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
                                    {isAm ? "ሰርዝ" : "Cancel"}
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
                                        {editingCategory
                                            ? isAm
                                                ? "ምድብ አዘምን"
                                                : "Update Category"
                                            : isAm
                                              ? "ምድብ አስቀምጥ"
                                              : "Save Category"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-card p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 shrink-0">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-[16px] font-bold text-foreground">
                                    {isAm ? "ምድብ ሰርዝ" : "Delete Category"}
                                </h3>
                                <p className="text-[12px] text-slate-gray mt-0.5">
                                    {isAm ? (
                                        <>
                                            እርግጠኛ ነዎት{" "}
                                            <strong className="text-foreground">
                                                {deletingCategory.amharicName ||
                                                    deletingCategory.name}
                                            </strong>{" "}
                                            መሰረዝ ይፈልጋሉ?
                                        </>
                                    ) : (
                                        <>
                                            Are you sure you want to delete{" "}
                                            <strong className="text-foreground">
                                                {deletingCategory.name}
                                            </strong>
                                            ?
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {deletingCategory.itemCount > 0 && (
                            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-[12px] text-amber-800 dark:text-amber-200">
                                {isAm ? (
                                    <>
                                        ይህ ምድብ በአሁኑ ጊዜ{" "}
                                        <strong>
                                            {deletingCategory.itemCount} ዕቃዎች
                                        </strong>{" "}
                                        አሉት። መሰረዝ ዕቃዎቹን ከምድቡ ይለያቸዋል።
                                    </>
                                ) : (
                                    <>
                                        This category currently has{" "}
                                        <strong>
                                            {deletingCategory.itemCount} items
                                        </strong>{" "}
                                        assigned. Deleting it will unlink those
                                        items.
                                    </>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeletingCategory(null)}
                                className="h-10 rounded-xl border border-hairline px-4 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                {isAm ? "ተመለስ" : "Cancel"}
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
                                <span>
                                    {isAm ? "ምድብ ሰርዝ" : "Delete Category"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Categories Preset Selector Modal */}
            <PresetCategoryImportModal
                open={presetImportOpen}
                onClose={() => setPresetImportOpen(false)}
            />
        </div>
    );
}
