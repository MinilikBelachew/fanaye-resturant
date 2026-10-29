"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
    Check,
    FolderPlus,
    Loader2,
    Pencil,
    Plus,
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

interface CategoryManagerModalProps {
    open: boolean;
    onClose: () => void;
    onSelectCategory?: (category: InventoryCategoryItem) => void;
}

export function CategoryManagerModal({
    open,
    onClose,
    onSelectCategory,
}: CategoryManagerModalProps) {
    const locale = useLocale();
    const isAm = locale === "am";

    const { data: categoriesRes, isLoading } =
        useListInventoryCategoriesQuery();
    const categories = categoriesRes?.data ?? [];

    const [createCategory, { isLoading: isCreating }] =
        useCreateInventoryCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] =
        useUpdateInventoryCategoryMutation();
    const [deleteCategory, { isLoading: isDeleting }] =
        useDeleteInventoryCategoryMutation();

    const [editingCategory, setEditingCategory] =
        useState<InventoryCategoryItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [presetImportOpen, setPresetImportOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        amharicName: "",
        code: "",
        description: "",
        sortOrder: 0,
    });

    if (!open) return null;

    function resetForm() {
        setFormData({
            name: "",
            amharicName: "",
            code: "",
            description: "",
            sortOrder: categories.length + 1,
        });
        setEditingCategory(null);
        setIsFormOpen(false);
    }

    function handleStartEdit(category: InventoryCategoryItem) {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            amharicName: category.amharicName ?? "",
            code: category.code,
            description: category.description ?? "",
            sortOrder: category.sortOrder,
        });
        setIsFormOpen(true);
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
                const res = await createCategory({
                    name: trimmedName,
                    amharicName: formData.amharicName.trim() || undefined,
                    code: formData.code.trim().toUpperCase() || undefined,
                    description: formData.description.trim() || undefined,
                    sortOrder: Number(formData.sortOrder) || 0,
                }).unwrap();
                toast.success(`Category "${trimmedName}" created`);
                if (onSelectCategory && res.data) {
                    onSelectCategory(res.data);
                }
            }
            resetForm();
        } catch (err) {
            toast.fromUnknown(err, "Could not save category");
        }
    }

    async function handleDelete(category: InventoryCategoryItem) {
        const confirmMsg =
            category.itemCount > 0
                ? `Category "${category.name}" currently has ${category.itemCount} assigned items. Deleting it will unlink these items. Proceed?`
                : `Delete category "${category.name}"?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await deleteCategory(category.id).unwrap();
            toast.success(`Category "${category.name}" deleted`);
            if (editingCategory?.id === category.id) {
                resetForm();
            }
        } catch (err) {
            toast.fromUnknown(err, "Could not delete category");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl border border-hairline bg-card shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600">
                            <Tag className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-[16px] font-semibold text-foreground">
                                {isAm
                                    ? "የዕቃዎች ምድቦች ማስተዳደሪያ"
                                    : "Manage Item Categories"}
                            </h3>
                            <p className="text-[12px] text-slate-gray">
                                {isAm
                                    ? "ለቀላል ፍለጋ እና ለወጪ ክትትል የሬስቶራንት ዕቃዎችን በምድብ ያደራጁ።"
                                    : "Group and organize restaurant inventory items for quick filtering and cost tracking."}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Add / Edit Form Toggle or Section */}
                    {isFormOpen ? (
                        <form
                            onSubmit={handleSave}
                            className="rounded-xl border border-hairline bg-secondary/30 p-4 space-y-3"
                        >
                            <div className="flex items-center justify-between pb-1 border-b border-hairline">
                                <span className="text-[13px] font-semibold text-foreground">
                                    {editingCategory
                                        ? isAm
                                            ? "ምድብ አርትዕ"
                                            : "Edit Category"
                                        : isAm
                                          ? "አዲስ ምድብ"
                                          : "New Category"}
                                </span>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-[12px] text-slate-gray hover:text-foreground"
                                >
                                    {isAm ? "ሰርዝ" : "Cancel"}
                                </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-gray">
                                        Category Name (English) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e =>
                                            setFormData(s => ({
                                                ...s,
                                                name: e.target.value,
                                                code:
                                                    s.code ||
                                                    e.target.value
                                                        .toUpperCase()
                                                        .replace(
                                                            /[^A-Z0-9]/g,
                                                            "_",
                                                        )
                                                        .slice(0, 40),
                                            }))
                                        }
                                        placeholder="e.g. Meat & Poultry"
                                        className="h-9 w-full rounded-lg border border-hairline bg-card px-3 text-[13px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-gray">
                                        Amharic Name (የአማርኛ ስም)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.amharicName}
                                        onChange={e =>
                                            setFormData(s => ({
                                                ...s,
                                                amharicName: e.target.value,
                                            }))
                                        }
                                        placeholder="ለምሳሌ፡ ስጋ እና ዶሮ"
                                        className="h-9 w-full rounded-lg border border-hairline bg-card px-3 text-[13px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-gray">
                                        Category Code (Unique)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={e =>
                                            setFormData(s => ({
                                                ...s,
                                                code: e.target.value
                                                    .toUpperCase()
                                                    .replace(/\s+/g, "_"),
                                            }))
                                        }
                                        placeholder="e.g. MEAT_POULTRY"
                                        className="h-9 w-full rounded-lg border border-hairline bg-card px-3 text-[13px] font-mono outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-gray">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={e =>
                                            setFormData(s => ({
                                                ...s,
                                                description: e.target.value,
                                            }))
                                        }
                                        placeholder="Optional summary or notes"
                                        className="h-9 w-full rounded-lg border border-hairline bg-card px-3 text-[13px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-lg border border-hairline bg-card px-3 py-1.5 text-[12px] font-medium hover:bg-secondary text-slate-gray"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-xs disabled:opacity-60 transition-colors"
                                >
                                    {isCreating || isUpdating ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Check className="size-3.5" />
                                    )}
                                    <span>
                                        {editingCategory
                                            ? "Update Category"
                                            : "Create Category"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-foreground">
                                Categories ({categories.length})
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPresetImportOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 dark:text-emerald-400 shadow-xs transition-colors"
                                >
                                    <Sparkles className="size-3.5" />
                                    <span>
                                        {isAm
                                            ? "የተዘጋጁ ምድቦች"
                                            : "Standard Categories"}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm();
                                        setIsFormOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-[12px] font-semibold text-white shadow-xs transition-colors"
                                >
                                    <Plus className="size-3.5" />
                                    <span>
                                        {isAm ? "አዲስ ምድብ" : "Add Category"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* List of Categories */}
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center text-slate-gray">
                            <Loader2 className="size-5 animate-spin text-emerald-600" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="rounded-xl border border-hairline p-8 text-center text-slate-gray space-y-3 bg-secondary/10">
                            <FolderPlus className="mx-auto size-8 opacity-40 text-emerald-600" />
                            <div>
                                <p className="text-[13px] font-semibold text-foreground">
                                    {isAm
                                        ? "እስካሁን ምንም ምድብ የለም"
                                        : "No categories in your store yet"}
                                </p>
                                <p className="text-[11px] mt-0.5 text-slate-gray max-w-sm mx-auto">
                                    {isAm
                                        ? "ለምግብ ቤትዎ የሚስማሙ የቁሳቁስ ምድቦችን ይምረጡ፣ ወይም ብጁ ምድብ ይጨምሩ።"
                                        : "Choose which standard Ethiopian & general restaurant categories fit your concept, or create custom ones."}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setPresetImportOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-[12px] font-semibold text-white shadow-xs transition-colors"
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
                                    onClick={() => {
                                        resetForm();
                                        setIsFormOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-card hover:bg-secondary px-3.5 py-2 text-[12px] font-medium text-foreground shadow-xs transition-colors"
                                >
                                    <Plus className="size-3.5" />
                                    <span>
                                        {isAm ? "ብጁ ምድብ" : "Custom Category"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-hairline rounded-xl border border-hairline bg-card overflow-hidden">
                            {categories.map(cat => (
                                <div
                                    key={cat.id}
                                    className="flex items-center justify-between p-3.5 hover:bg-secondary/40 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-[13px] text-foreground">
                                                {isAm
                                                    ? cat.amharicName ||
                                                      cat.name
                                                    : cat.name}
                                            </span>
                                            {!isAm && cat.amharicName ? (
                                                <span className="text-[12px] text-slate-gray font-medium">
                                                    · {cat.amharicName}
                                                </span>
                                            ) : null}
                                            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-slate-gray uppercase">
                                                {cat.code}
                                            </span>
                                        </div>
                                        {cat.description ? (
                                            <p className="mt-0.5 text-[11px] text-slate-gray truncate">
                                                {cat.description}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 ml-3">
                                        <span className="rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-600">
                                            {cat.itemCount} items
                                        </span>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleStartEdit(cat)
                                                }
                                                aria-label={`Edit ${cat.name}`}
                                                className="rounded-lg p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isDeleting}
                                                onClick={() =>
                                                    handleDelete(cat)
                                                }
                                                aria-label={`Delete ${cat.name}`}
                                                className="rounded-lg p-1.5 text-slate-gray hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-hairline px-6 py-3 bg-secondary/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-hairline bg-card px-4 py-2 text-[13px] font-medium hover:bg-secondary text-foreground transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* Standard Categories Preset Selector Modal */}
            <PresetCategoryImportModal
                open={presetImportOpen}
                onClose={() => setPresetImportOpen(false)}
            />
        </div>
    );
}
