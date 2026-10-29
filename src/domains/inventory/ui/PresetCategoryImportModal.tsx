"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
    Check,
    CheckSquare,
    FolderPlus,
    Loader2,
    Sparkles,
    Square,
    X,
} from "lucide-react";
import {
    useCreateInventoryCategoryMutation,
    useListInventoryCategoriesQuery,
} from "@/context/services/inventoryApi";
import {
    STANDARD_CATEGORY_PRESETS,
    type StandardCategoryPreset,
} from "@/domains/inventory/application/inventoryPresets";
import { toast } from "@/lib/toast";

interface PresetCategoryImportModalProps {
    open: boolean;
    onClose: () => void;
}

export function PresetCategoryImportModal({
    open,
    onClose,
}: PresetCategoryImportModalProps) {
    const locale = useLocale();
    const isAm = locale === "am";

    const { data: categoriesRes } = useListInventoryCategoriesQuery();
    const categoriesData = categoriesRes?.data;
    const existingCategories = useMemo(
        () => categoriesData ?? [],
        [categoriesData],
    );

    const [createCategory] = useCreateInventoryCategoryMutation();
    const [isImporting, setIsImporting] = useState(false);

    // Identify which preset categories are already added in DB
    const existingCodeSet = useMemo(() => {
        return new Set(
            existingCategories.map(c => (c.code || "").trim().toUpperCase()),
        );
    }, [existingCategories]);

    const existingNameSet = useMemo(() => {
        return new Set(
            existingCategories.map(c => (c.name || "").trim().toLowerCase()),
        );
    }, [existingCategories]);

    const isPresetAlreadyAdded = useCallback(
        (preset: StandardCategoryPreset) => {
            return (
                existingCodeSet.has(preset.code.toUpperCase()) ||
                existingNameSet.has(preset.name.toLowerCase().trim())
            );
        },
        [existingCodeSet, existingNameSet],
    );

    // Calculate available presets (not already in DB)
    const availablePresets = useMemo(() => {
        return STANDARD_CATEGORY_PRESETS.filter(p => !isPresetAlreadyAdded(p));
    }, [isPresetAlreadyAdded]);

    // Selection state: by default, select all available
    const [selectedCodes, setSelectedCodes] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        for (const p of STANDARD_CATEGORY_PRESETS) {
            if (
                !existingCodeSet.has(p.code.toUpperCase()) &&
                !existingNameSet.has(p.name.toLowerCase().trim())
            ) {
                initial.add(p.code);
            }
        }
        return initial;
    });

    if (!open) return null;

    function toggleSelect(code: string, alreadyAdded: boolean) {
        if (alreadyAdded) return;
        setSelectedCodes(prev => {
            const next = new Set(prev);
            if (next.has(code)) {
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
    }

    function selectAllAvailable() {
        const allAvailable = new Set<string>();
        for (const p of availablePresets) {
            allAvailable.add(p.code);
        }
        setSelectedCodes(allAvailable);
    }

    function deselectAll() {
        setSelectedCodes(new Set());
    }

    async function handleImport() {
        const presetsToImport = STANDARD_CATEGORY_PRESETS.filter(
            p => selectedCodes.has(p.code) && !isPresetAlreadyAdded(p),
        );

        if (presetsToImport.length === 0) {
            toast.error(
                isAm
                    ? "እባክዎ ቢያንስ አንድ ምድብ ይምረጡ"
                    : "Please select at least one category to add",
            );
            return;
        }

        setIsImporting(true);
        let successCount = 0;
        let failCount = 0;

        try {
            const sorted = [...presetsToImport].sort(
                (a, b) => a.sortOrder - b.sortOrder,
            );

            for (const preset of sorted) {
                try {
                    await createCategory({
                        name: preset.name,
                        amharicName: preset.amharicName,
                        code: preset.code,
                        description: preset.description,
                        sortOrder: preset.sortOrder,
                    }).unwrap();
                    successCount++;
                } catch {
                    failCount++;
                }
            }

            if (successCount > 0) {
                toast.success(
                    isAm
                        ? `${successCount} ምድቦች በተሳካ ሁኔታ ተጨምረዋል!`
                        : `Successfully added ${successCount} standard categories!`,
                );
            }
            if (failCount > 0) {
                toast.error(
                    isAm
                        ? `${failCount} ምድቦችን መጨመር አልተቻለም`
                        : `Could not add ${failCount} categories`,
                );
            }
            onClose();
        } catch (err) {
            toast.fromUnknown(
                err,
                isAm ? "ምድቦችን መጨመር አልተቻለም" : "Failed to import categories",
            );
        } finally {
            setIsImporting(false);
        }
    }

    const availableCount = availablePresets.length;
    const selectedCount = Array.from(selectedCodes).filter(code =>
        availablePresets.some(p => p.code === code),
    ).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-hairline bg-card shadow-2xl overflow-hidden">
                {/* Minimal Header */}
                <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5 bg-secondary/15">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                            <Sparkles className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold text-foreground leading-tight">
                                {isAm ? "የተዘጋጁ ምድቦች" : "Standard Categories"}
                            </h3>
                            <p className="text-[11px] text-slate-gray mt-0.5">
                                {isAm
                                    ? "ከሬስቶራንትዎ ጋር የሚስማሙትን ምድቦች ይምረጡ።"
                                    : "Select categories to add to your inventory."}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isImporting}
                        className="rounded-lg p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Compact Selection Sub-bar */}
                <div className="flex items-center justify-between border-b border-hairline px-5 py-2 bg-secondary/30 text-[11.5px]">
                    <span className="text-slate-gray">
                        {isAm ? "የተመረጡ፦" : "Selected:"}{" "}
                        <strong className="text-foreground">
                            {selectedCount}
                        </strong>{" "}
                        {isAm ? `ከ ${availableCount}` : `of ${availableCount}`}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={selectAllAvailable}
                            disabled={
                                isImporting ||
                                selectedCount === availableCount ||
                                availableCount === 0
                            }
                            className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-40"
                        >
                            {isAm ? "ሁሉንም ምረጥ" : "Select All"}
                        </button>
                        <span className="text-slate-gray/40">·</span>
                        <button
                            type="button"
                            onClick={deselectAll}
                            disabled={isImporting || selectedCount === 0}
                            className="font-medium text-slate-gray hover:text-foreground disabled:opacity-40"
                        >
                            {isAm ? "ምርጫ አጽዳ" : "Deselect"}
                        </button>
                    </div>
                </div>

                {/* Minimal Categories Grid */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {STANDARD_CATEGORY_PRESETS.map(preset => {
                            const alreadyAdded = isPresetAlreadyAdded(preset);
                            const isSelected =
                                selectedCodes.has(preset.code) && !alreadyAdded;

                            const title = isAm
                                ? preset.amharicName
                                : preset.name;
                            const sampleList = isAm
                                ? preset.sampleItemsAmharic
                                      .slice(0, 3)
                                      .join("፣ ")
                                : preset.sampleItems.slice(0, 3).join(", ");

                            return (
                                <div
                                    key={preset.code}
                                    onClick={() =>
                                        toggleSelect(preset.code, alreadyAdded)
                                    }
                                    className={`group flex items-center justify-between rounded-xl border p-2.5 text-left transition-all select-none ${
                                        alreadyAdded
                                            ? "border-hairline bg-secondary/20 opacity-50 cursor-not-allowed"
                                            : isSelected
                                              ? "border-emerald-500/70 bg-emerald-500/5 ring-1 ring-emerald-500/20 cursor-pointer"
                                              : "border-hairline bg-card hover:border-slate-300 dark:hover:border-slate-700 hover:bg-secondary/20 cursor-pointer"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                        <span className="text-lg shrink-0 leading-none">
                                            {preset.icon}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-[13px] font-medium text-foreground truncate leading-tight">
                                                {title}
                                            </h4>
                                            <p className="text-[11px] text-slate-gray truncate mt-0.5">
                                                {sampleList}
                                            </p>
                                        </div>
                                    </div>

                                    {alreadyAdded ? (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-slate-gray border border-hairline shrink-0">
                                            <Check className="size-2.5" />
                                            {isAm ? "ተጨምሯል" : "Added"}
                                        </span>
                                    ) : (
                                        <div className="text-emerald-600 shrink-0">
                                            {isSelected ? (
                                                <CheckSquare className="size-4" />
                                            ) : (
                                                <Square className="size-4 text-slate-gray/40 group-hover:text-slate-gray/60" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Minimal Footer */}
                <div className="flex items-center justify-between border-t border-hairline px-5 py-3 bg-secondary/15">
                    <span className="text-[11.5px] text-slate-gray hidden sm:inline">
                        {availableCount === 0
                            ? isAm
                                ? "ሁሉም ምድቦች ተጨምረዋል።"
                                : "All categories already added."
                            : isAm
                              ? `${selectedCount} ምድቦች ይመዘገባሉ`
                              : `${selectedCount} will be added`}
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isImporting}
                            className="rounded-xl border border-hairline bg-card px-3.5 py-1.5 text-[12px] font-medium hover:bg-secondary text-slate-gray transition-colors"
                        >
                            {isAm ? "ሰርዝ" : "Cancel"}
                        </button>
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={isImporting || selectedCount === 0}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-[12px] font-semibold text-white shadow-xs disabled:opacity-50 transition-colors"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>
                                        {isAm ? "በመጨመር ላይ..." : "Adding..."}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <FolderPlus className="size-3.5" />
                                    <span>
                                        {isAm
                                            ? `${selectedCount} ምድቦችን ጨምር`
                                            : `Add ${selectedCount} Categories`}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
