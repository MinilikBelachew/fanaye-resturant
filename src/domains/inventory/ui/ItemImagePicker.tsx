"use client";

import { useId, useMemo, useRef, useState } from "react";
import {
    Check,
    ImagePlus,
    Loader2,
    Search,
    Sparkles,
    Upload,
    X,
} from "lucide-react";
import { useUploadMenuImageMutation } from "@/context/services/menuApi";
import {
    INVENTORY_PRESETS,
    PRESET_CATEGORIES,
    findMatchingPreset,
    resolveItemImage,
    type InventoryPreset,
    type PresetCategory,
} from "../application/inventoryPresets";
import { toast } from "@/lib/toast";

interface ItemImagePickerProps {
    value: string;
    onChange: (url: string) => void;
    itemName?: string;
    onSelectPreset?: (preset: InventoryPreset) => void;
    compact?: boolean;
}

export function ItemThumbnail({
    src,
    name,
    className = "size-10",
}: {
    src?: string | null;
    name?: string;
    className?: string;
}) {
    const resolved = resolveItemImage(src, name);

    return (
        <div
            className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-hairline bg-secondary/60 shrink-0 ${className}`}
        >
            {resolved ? (
                <img
                    src={resolved}
                    alt={name || "Item"}
                    className="size-full object-cover"
                    loading="lazy"
                    onError={e => {
                        // Fallback on broken image
                        (e.target as HTMLElement).style.display = "none";
                    }}
                />
            ) : (
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-gray">
                    {name ? name.slice(0, 2) : "IT"}
                </span>
            )}
        </div>
    );
}

export function ItemImagePicker({
    value,
    onChange,
    itemName = "",
    onSelectPreset,
    compact = false,
}: ItemImagePickerProps) {
    const fileInputId = useId();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploadImage, { isLoading: isUploading }] =
        useUploadMenuImageMutation();
    const [presetModalOpen, setPresetModalOpen] = useState(false);
    const [selectedCat, setSelectedCat] = useState<PresetCategory | "all">(
        "all",
    );
    const [searchQuery, setSearchQuery] = useState("");

    // Auto-matched preset suggestion when typing a name and no image is chosen yet
    const matchedPreset = useMemo(() => {
        if (value && value.trim()) return null;
        return findMatchingPreset(itemName);
    }, [itemName, value]);

    const filteredPresets = useMemo(() => {
        return INVENTORY_PRESETS.filter(p => {
            if (selectedCat !== "all" && p.category !== selectedCat)
                return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = p.name.toLowerCase().includes(q);
                const matchAmharic = p.amharicName?.includes(q);
                const matchKw = p.keywords.some(k =>
                    k.toLowerCase().includes(q),
                );
                return matchName || matchAmharic || matchKw;
            }
            return true;
        });
    }, [selectedCat, searchQuery]);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file (PNG, JPG, WEBP).");
            return;
        }

        try {
            const res = await uploadImage(file).unwrap();
            if (res?.file?.path) {
                onChange(res.file.path);
                toast.success("Photo uploaded to Cloudinary");
            }
        } catch (err) {
            toast.fromUnknown(err, "Could not upload image to server");
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    function handleApplyPreset(preset: InventoryPreset) {
        onChange(preset.imageUrl);
        if (onSelectPreset) {
            onSelectPreset(preset);
        }
        setPresetModalOpen(false);
        toast.success(`Preset applied: ${preset.name}`);
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                {/* Visual Thumbnail Preview */}
                <div className="relative group size-16 shrink-0 overflow-hidden rounded-xl border border-hairline bg-secondary/50">
                    {value ? (
                        <>
                            <img
                                src={value}
                                alt="Item preview"
                                className="size-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                aria-label="Remove image"
                                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </>
                    ) : (
                        <div className="flex size-full flex-col items-center justify-center text-slate-gray">
                            <ImagePlus className="size-5 opacity-60" />
                        </div>
                    )}
                </div>

                {/* Buttons: Pick Preset or Upload Custom Photo */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setPresetModalOpen(true)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-card px-2.5 text-[12px] font-medium hover:bg-secondary transition-colors"
                        >
                            <Sparkles className="size-3.5 text-emerald-600" />
                            <span>Presets</span>
                        </button>

                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-card px-2.5 text-[12px] font-medium hover:bg-secondary disabled:opacity-60 transition-colors"
                        >
                            {isUploading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Upload className="size-3.5 text-slate-gray" />
                            )}
                            <span>
                                {isUploading ? "Uploadingâ€¦" : "Upload"}
                            </span>
                        </button>

                        {value ? (
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                className="inline-flex h-8 items-center rounded-lg px-2 text-[12px] text-slate-gray hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            >
                                Clear
                            </button>
                        ) : null}
                    </div>

                    <input
                        ref={fileInputRef}
                        id={fileInputId}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            {/* Smart Auto-Match Suggestion when typing item name */}
            {matchedPreset ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-[12px]">
                    <div className="flex items-center gap-2 min-w-0">
                        <img
                            src={matchedPreset.imageUrl}
                            alt={matchedPreset.name}
                            className="size-7 rounded-lg object-cover border border-hairline shrink-0"
                        />
                        <div className="truncate">
                            <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                                {matchedPreset.name}
                            </span>
                            {matchedPreset.amharicName ? (
                                <span className="ml-1 text-[11px] text-slate-gray">
                                    Â· {matchedPreset.amharicName}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleApplyPreset(matchedPreset)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white shrink-0 shadow-sm transition-colors"
                    >
                        <Check className="size-3" />
                        Apply
                    </button>
                </div>
            ) : null}

            {/* Full Realistic Preset Modal Gallery */}
            {presetModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-hairline bg-card shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                            <div>
                                <h3 className="text-[16px] font-semibold">
                                    Restaurant Item Presets
                                </h3>
                                <p className="text-[12px] text-slate-gray">
                                    Select a real food preset to pre-fill item
                                    details and photo.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPresetModalOpen(false)}
                                className="rounded-lg p-1.5 text-slate-gray hover:bg-secondary"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Search & Category Tabs */}
                        <div className="space-y-3 border-b border-hairline px-5 py-3 bg-secondary/20">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 size-4 text-slate-gray" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Search by name in English or Amharic (e.g. Berbere, áŒ¤á, Shiro, Beef, Onion)..."
                                    className="h-9 w-full rounded-xl border border-hairline bg-card pl-9 pr-3 text-[13px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[12px] no-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCat("all")}
                                    className={`rounded-lg px-2.5 py-1 font-medium whitespace-nowrap transition-colors ${
                                        selectedCat === "all"
                                            ? "bg-emerald-600 text-white"
                                            : "bg-secondary text-slate-gray hover:text-foreground"
                                    }`}
                                >
                                    All ({INVENTORY_PRESETS.length})
                                </button>
                                {PRESET_CATEGORIES.map(cat => {
                                    const count = INVENTORY_PRESETS.filter(
                                        p => p.category === cat.id,
                                    ).length;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedCat(cat.id)
                                            }
                                            className={`rounded-lg px-2.5 py-1 font-medium whitespace-nowrap transition-colors ${
                                                selectedCat === cat.id
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-secondary text-slate-gray hover:text-foreground"
                                            }`}
                                        >
                                            <span>{cat.label}</span>
                                            <span className="ml-1 opacity-75 text-[11px]">
                                                Â· {cat.amharic} ({count})
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Grid of Presets */}
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {filteredPresets.map(preset => {
                                    const isSelected =
                                        value === preset.imageUrl;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() =>
                                                handleApplyPreset(preset)
                                            }
                                            className={`group relative flex flex-col items-start rounded-xl border p-2.5 text-left transition-all hover:border-emerald-600 hover:shadow-md ${
                                                isSelected
                                                    ? "border-emerald-600 bg-emerald-500/5 ring-1 ring-emerald-600"
                                                    : "border-hairline bg-card"
                                            }`}
                                        >
                                            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-secondary/50">
                                                <img
                                                    src={preset.imageUrl}
                                                    alt={preset.name}
                                                    className="size-full object-cover transition-transform group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                                {isSelected ? (
                                                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                                                        <Check className="size-3" />
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="mt-2 w-full">
                                                <div className="flex items-baseline justify-between gap-1">
                                                    <span className="text-[13px] font-semibold truncate text-foreground">
                                                        {preset.name}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-slate-gray rounded bg-secondary px-1 py-0.5 shrink-0">
                                                        {preset.unit}
                                                    </span>
                                                </div>
                                                {preset.amharicName ? (
                                                    <span className="block text-[11px] text-slate-gray truncate">
                                                        {preset.amharicName}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {filteredPresets.length === 0 ? (
                                <div className="py-12 text-center text-slate-gray text-[13px]">
                                    No preset found matching &quot;{searchQuery}
                                    &quot;.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
