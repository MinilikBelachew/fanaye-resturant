"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Coffee,
    CookingPot,
    CupSoda,
    ImagePlus,
    Plus,
    Save,
    Trash2,
    Upload,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import {
    useAdminMenuMetaQuery,
    useAdminModifierGroupsQuery,
    useCreateAdminMenuItemMutation,
    useMarkMenuItemSoldOutMutation,
    useUpdateAdminMenuItemMutation,
    useUploadMenuImageMutation,
} from "@/context/services/menuApi";
import { useGetStationsQuery } from "@/context/services/stationsApi";
import {
    catalogModifiersToApi,
    filePublicUrl,
} from "@/domains/catalog/application/mapAdminMenu";
import type { MenuItem } from "@/domains/catalog/domain/menu";
import type {
    ModifierGroup,
    ModifierGroupKind,
    ModifierOption,
} from "@/domains/catalog/domain/modifiers";
import { STATION_IDS } from "@/domains/fulfillment/domain/station";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createId } from "@/lib/ids";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { menuItemFormSchema } from "@/lib/validators/catalog";
import { cn } from "@/lib/utils";

interface AddMenuItemSheetProps {
    isOpen: boolean;
    onClose: () => void;
    initialItem?: MenuItem | null;
}

function isPersistedId(id: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
    );
}

const DEFAULT_STATION_META: Record<
    string,
    {
        label: string;
        icon: typeof CookingPot;
        categoryDefault: string;
        defaultPrepMin: number;
        color: string;
    }
> = {
    [STATION_IDS.kitchen]: {
        label: "Kitchen",
        icon: CookingPot,
        categoryDefault: "Main Kitchen",
        defaultPrepMin: 12,
        color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    },
    [STATION_IDS.barista]: {
        label: "Barista",
        icon: Coffee,
        categoryDefault: "Hot Drinks",
        defaultPrepMin: 5,
        color: "text-orange-600 bg-orange-500/10 border-orange-500/20",
    },
    [STATION_IDS.cakes]: {
        label: "Cakes",
        icon: UtensilsCrossed,
        categoryDefault: "Cakes",
        defaultPrepMin: 4,
        color: "text-pink-600 bg-pink-500/10 border-pink-500/20",
    },
    [STATION_IDS.soft_drinks]: {
        label: "Soft Drinks",
        icon: CupSoda,
        categoryDefault: "Soft Drinks",
        defaultPrepMin: 2,
        color: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    },
};

function stationIconForName(name: string) {
    const value = name.toLowerCase();
    if (value.includes("barista") || value.includes("coffee")) return Coffee;
    if (
        value.includes("cake") ||
        value.includes("pastry") ||
        value.includes("bakery")
    )
        return UtensilsCrossed;
    if (
        value.includes("soft") ||
        value.includes("drink") ||
        value.includes("beverage")
    )
        return CupSoda;
    return CookingPot;
}

export default function AddMenuItemSheet({
    isOpen,
    onClose,
    initialItem,
}: AddMenuItemSheetProps) {
    const reduxStations = useAppSelector(state => state.station.stations);
    const { data: dbStations } = useGetStationsQuery(undefined, {
        skip: !isOpen,
    });
    const { data: metaData } = useAdminMenuMetaQuery(undefined, {
        skip: !isOpen,
    });
    const { data: libraryData } = useAdminModifierGroupsQuery(undefined, {
        skip: !isOpen,
    });
    const [createItem, { isLoading: creating }] =
        useCreateAdminMenuItemMutation();
    const [updateItem, { isLoading: updating }] =
        useUpdateAdminMenuItemMutation();
    const [markSoldOut] = useMarkMenuItemSoldOutMutation();
    const [uploadImage, { isLoading: uploading }] =
        useUploadMenuImageMutation();

    const libraryGroups = libraryData?.data ?? [];

    const stations = useMemo(() => {
        if (dbStations && dbStations.length > 0) {
            return dbStations
                .filter(st => st.enabled !== false && st.status !== "DISABLED")
                .map(st => ({
                    id: st.id,
                    name: st.name,
                    category: st.category || st.name,
                    avgPrepMin:
                        st.avgPrepMin || st.defaultDelayThresholdMinutes || 10,
                }));
        }

        if (reduxStations && reduxStations.length > 0) {
            return reduxStations
                .filter(st => st.enabled !== false && st.status !== "DISABLED")
                .map(st => {
                    const backendMatch = (metaData?.data.stations ?? []).find(
                        b =>
                            b.name.toLowerCase() === st.name.toLowerCase() ||
                            b.id === st.id,
                    );
                    return {
                        id: backendMatch?.id || st.id,
                        name: st.name,
                        category: st.category || st.name,
                        avgPrepMin: st.avgPrepMin || 10,
                    };
                });
        }

        return (metaData?.data.stations ?? []).map(station => ({
            id: station.id,
            name: station.name,
            category: station.name,
            avgPrepMin:
                DEFAULT_STATION_META[
                    station.name.toLowerCase().includes("barista")
                        ? STATION_IDS.barista
                        : station.name.toLowerCase().includes("cake")
                          ? STATION_IDS.cakes
                          : station.name.toLowerCase().includes("soft")
                            ? STATION_IDS.soft_drinks
                            : STATION_IDS.kitchen
                ]?.defaultPrepMin ?? 10,
        }));
    }, [dbStations, reduxStations, metaData]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState<string>("250");
    const [stationId, setStationId] = useState<string>("");
    const [category, setCategory] = useState("Kitchen");
    const [expectedPrepMinutes, setExpectedPrepMinutes] = useState<number>(12);
    const [imageFileId, setImageFileId] = useState<string | null>(null);
    const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(
        null,
    );
    const [available, setAvailable] = useState(true);
    const [submitError, setSubmitError] = useState("");

    const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
    const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupKind, setNewGroupKind] =
        useState<ModifierGroupKind>("included");

    const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
    const [optionName, setOptionName] = useState("");
    const [optionDelta, setOptionDelta] = useState<string>("0");

    useEffect(() => {
        if (!isOpen) return;
        const defaultStationId =
            initialItem?.stationId ||
            stations[0]?.id ||
            metaData?.data.stations[0]?.id ||
            "";
        if (initialItem) {
            setName(initialItem.name);
            setDescription(initialItem.description);
            setPrice(String(initialItem.price));
            setStationId(initialItem.stationId || defaultStationId);
            setCategory(initialItem.category);
            setExpectedPrepMinutes(initialItem.expectedPreparationMinutes);
            setImageFileId(initialItem.imageFileId ?? null);
            setUploadPreviewUrl(initialItem.image || null);
            setAvailable(initialItem.available);
            const attached = initialItem.modifierGroups || [];
            setSelectedLibraryIds(
                attached.map(group => group.id).filter(isPersistedId),
            );
            setModifierGroups(
                attached.filter(group => !isPersistedId(group.id)),
            );
        } else {
            setName("");
            setDescription("");
            setPrice("250");
            setStationId(defaultStationId);
            setCategory(stations[0]?.name || "Kitchen");
            setExpectedPrepMinutes(stations[0]?.avgPrepMin || 12);
            setImageFileId(null);
            setUploadPreviewUrl(null);
            setAvailable(true);
            setSelectedLibraryIds([]);
            setModifierGroups([]);
        }
        setSubmitError("");
        setNewGroupName("");
        setOptionName("");
        setOptionDelta("0");
        setTargetGroupId(null);
    }, [initialItem, isOpen, stations, metaData]);

    if (!isOpen) return null;

    function handleStationChange(newStationId: string) {
        setStationId(newStationId);
        const matchingStation = stations.find(s => s.id === newStationId);
        if (matchingStation) {
            setCategory(matchingStation.category || matchingStation.name);
            setExpectedPrepMinutes(matchingStation.avgPrepMin || 10);
        } else if (DEFAULT_STATION_META[newStationId]) {
            setCategory(DEFAULT_STATION_META[newStationId].categoryDefault);
            setExpectedPrepMinutes(
                DEFAULT_STATION_META[newStationId].defaultPrepMin,
            );
        }
    }

    function handleAddGroup() {
        if (!newGroupName.trim()) return;
        const newGroup: ModifierGroup = {
            id: createId("modgroup"),
            name: newGroupName.trim(),
            kind: newGroupKind,
            min: 0,
            max: newGroupKind === "choice" ? 1 : 5,
            options: [],
        };
        setModifierGroups(prev => [...prev, newGroup]);
        setNewGroupName("");
        setTargetGroupId(newGroup.id);
    }

    function handleRemoveGroup(groupId: string) {
        setModifierGroups(prev => prev.filter(g => g.id !== groupId));
        if (targetGroupId === groupId) setTargetGroupId(null);
    }

    function handleAddOption(groupId: string) {
        if (!optionName.trim()) return;
        const delta = Number(optionDelta) || 0;
        const optName = optionName.trim();
        const targetGroup = modifierGroups.find(g => g.id === groupId);

        const newOption: ModifierOption = {
            id: createId("modopt"),
            name: optName,
            ticketLabel:
                targetGroup?.kind === "included"
                    ? `No ${optName.toLowerCase()}`
                    : optName,
            priceDelta: delta,
        };

        setModifierGroups(prev =>
            prev.map(g => {
                if (g.id !== groupId) return g;
                return {
                    ...g,
                    options: [...g.options, newOption],
                };
            }),
        );
        setOptionName("");
        setOptionDelta("0");
    }

    function handleRemoveOption(groupId: string, optionId: string) {
        setModifierGroups(prev =>
            prev.map(g => {
                if (g.id !== groupId) return g;
                return {
                    ...g,
                    options: g.options.filter(opt => opt.id !== optionId),
                };
            }),
        );
    }

    function toggleLibraryGroup(groupId: string) {
        setSelectedLibraryIds(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId],
        );
    }

    function handleDeleteItem() {
        if (!initialItem) return;
        if (
            confirm(`Mark "${initialItem.name}" sold out / remove from floor?`)
        ) {
            void markSoldOut({ id: initialItem.id })
                .then(() => {
                    toast.success("Item marked sold out", initialItem.name);
                    onClose();
                })
                .catch(err =>
                    toast.fromUnknown(err, "Could not update menu item."),
                );
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsed = menuItemFormSchema.safeParse({
            name,
            description,
            price,
            stationId,
            category,
            expectedPrepMinutes,
            available,
        });
        if (!parsed.success) {
            const message =
                parsed.error.issues[0]?.message || "Check the form fields.";
            setSubmitError(message);
            toast.error("Validation failed", message);
            return;
        }
        setSubmitError("");

        const values = parsed.data;
        const finalPrice = Math.max(0, Number(values.price) || 0).toFixed(2);
        const body = {
            name: values.name,
            description:
                values.description || `${values.name} prepared fresh to order.`,
            price: finalPrice,
            preparationStationId: values.stationId,
            categoryName:
                values.category ||
                stations.find(s => s.id === values.stationId)?.name ||
                "Kitchen",
            expectedPrepMinutes: values.expectedPrepMinutes,
            available: values.available,
            ...(imageFileId
                ? { imageFileId }
                : initialItem && !uploadPreviewUrl
                  ? { imageFileId: null }
                  : {}),
            modifierGroupIds: selectedLibraryIds,
            modifierGroups: catalogModifiersToApi(modifierGroups),
        };

        try {
            if (initialItem) {
                await updateItem({
                    id: initialItem.id,
                    body: {
                        ...body,
                        expectedVersion: initialItem.version,
                    },
                }).unwrap();
                toast.success("Menu item updated", values.name);
            } else {
                await createItem(body).unwrap();
                toast.success("Menu item created", values.name);
            }
            onClose();
        } catch (err) {
            const message =
                "Could not save menu item. Check the API is running and you are signed in as manager.";
            setSubmitError(message);
            toast.fromUnknown(err, message);
        }
    }

    const saving = creating || updating || uploading;
    const matchingStation = stations.find(s => s.id === stationId);
    const stationLabel = matchingStation?.name || "Kitchen";
    const StationIcon = stationIconForName(stationLabel);
    const effectiveImage = uploadPreviewUrl;

    async function onPickUpload(file: File | null) {
        if (!file) return;
        setSubmitError("");
        try {
            const uploaded = await uploadImage(file).unwrap();
            setImageFileId(uploaded.file.id);
            setUploadPreviewUrl(
                filePublicUrl(uploaded.file.path) || URL.createObjectURL(file),
            );
            toast.success("Image uploaded");
        } catch (err) {
            setSubmitError("Could not upload image. Use JPG or PNG.");
            toast.fromUnknown(err, "Could not upload image. Use JPG or PNG.");
        }
    }

    function clearImage() {
        setImageFileId(null);
        setUploadPreviewUrl(null);
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
            {/* Click outside to close */}
            <div className="flex-1" onClick={onClose} aria-hidden="true" />

            {/* Slide-over panel */}
            <div className="relative flex h-full w-full max-w-xl flex-col border-l border-hairline bg-card animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-surface-ivory px-5 py-3.5">
                    <h2 className="text-[16px] font-semibold text-foreground">
                        {initialItem ? "Edit menu item" : "Add menu item"}
                    </h2>
                    <div className="flex items-center gap-1.5">
                        {initialItem ? (
                            <button
                                type="button"
                                onClick={handleDeleteItem}
                                className="flex size-8 items-center justify-center rounded-full border border-hairline bg-card text-slate-gray transition-colors hover:bg-red-50 hover:text-destructive"
                                title="Delete item"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex size-8 items-center justify-center rounded-full border border-hairline bg-card text-slate-gray transition-colors hover:bg-secondary hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form
                    id="add-menu-item-form"
                    onSubmit={handleSubmit}
                    className="sidebar-scroll flex-1 space-y-5 overflow-y-auto p-5"
                >
                    {/* Item Details */}
                    <div className="space-y-3.5">
                        <div>
                            <label className="text-[13px] font-medium text-foreground">
                                Item name{" "}
                                <span className="text-destructive">*</span>
                            </label>
                            <Input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Special Kitfo, Double Cheeseburger, Iced Spanish Latte"
                                className="mt-1 h-10 rounded-[10px] bg-card text-[13px]"
                            />
                        </div>

                        <div>
                            <label className="text-[13px] font-medium text-foreground">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={2}
                                placeholder="e.g. Prime minced beef with spiced clarified butter, mitmita, and cheese."
                                className="mt-1 w-full rounded-[10px] border border-input bg-card p-2.5 text-[13px] outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[13px] font-medium text-foreground">
                                    Base price (ETB){" "}
                                    <span className="text-destructive">*</span>
                                </label>
                                <div className="relative mt-1">
                                    <span className="absolute inset-y-0 left-3 flex items-center text-[12px] font-medium text-slate-gray">
                                        ETB
                                    </span>
                                    <Input
                                        required
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        className="h-10 rounded-[10px] bg-card pl-11 text-[14px] font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[13px] font-medium text-foreground">
                                    Prep time (min)
                                </label>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={expectedPrepMinutes}
                                        onChange={e =>
                                            setExpectedPrepMinutes(
                                                Number(e.target.value) || 5,
                                            )
                                        }
                                        className="h-10 rounded-[10px] bg-card text-[13px]"
                                    />
                                    <div className="flex gap-1 shrink-0">
                                        {[5, 10, 15].map(min => (
                                            <button
                                                key={min}
                                                type="button"
                                                onClick={() =>
                                                    setExpectedPrepMinutes(min)
                                                }
                                                className={cn(
                                                    "rounded-full border px-2 py-1 text-[11px] font-medium transition-colors",
                                                    expectedPrepMinutes === min
                                                        ? "border-brand bg-brand text-white"
                                                        : "border-hairline bg-secondary text-slate-gray hover:text-foreground",
                                                )}
                                            >
                                                {min}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-hairline" />

                    {/* Fulfillment Station */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[13px] font-medium text-foreground">
                                Preparation station
                            </label>
                            <span className="text-[11px] text-slate-gray">
                                Destination KDS queue
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {stations.map(st => {
                                const Icon = stationIconForName(st.name);
                                const isSelected = stationId === st.id;
                                const label = st.name || "Station";
                                const prepMin = st.avgPrepMin || 10;

                                return (
                                    <button
                                        key={st.id}
                                        type="button"
                                        onClick={() =>
                                            handleStationChange(st.id)
                                        }
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1.5 rounded-[12px] border p-2.5 text-center transition-all",
                                            isSelected
                                                ? "border-brand bg-accent/60 ring-1 ring-brand"
                                                : "border-hairline bg-card hover:border-slate-300 hover:bg-secondary/40",
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "size-5",
                                                isSelected
                                                    ? "text-brand"
                                                    : "text-slate-gray",
                                            )}
                                        />
                                        <span className="text-[12px] font-medium">
                                            {label}
                                        </span>
                                        <span className="text-[10px] text-slate-gray">
                                            ~{prepMin}m
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {stations.length === 0 ? (
                            <p className="text-[12px] text-slate-gray">
                                Loading stations from the server…
                            </p>
                        ) : null}
                    </div>

                    <hr className="border-hairline" />

                    {/* Image upload */}
                    <div className="space-y-2.5">
                        <label className="text-[13px] font-medium text-foreground">
                            Dish photo
                        </label>
                        <p className="text-[12px] text-slate-gray">
                            Upload a JPG or PNG. It is stored with this menu
                            item.
                        </p>

                        <div className="overflow-hidden rounded-[14px] border border-hairline bg-surface-ivory">
                            <div className="relative aspect-[16/10] bg-secondary/40">
                                {effectiveImage ? (
                                    <>
                                        <img
                                            src={effectiveImage}
                                            alt={name || "Dish preview"}
                                            className="size-full object-cover"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/55 to-transparent p-3 pt-10">
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-semibold text-white">
                                                    {name || "Item name"}
                                                </p>
                                                <p className="text-[12px] text-white/85">
                                                    {formatEtb(
                                                        Number(price) || 0,
                                                    )}{" "}
                                                    · {stationLabel}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={clearImage}
                                                className="shrink-0 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-foreground"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <label className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 px-4 text-center transition-colors hover:bg-secondary/60">
                                        <span className="flex size-12 items-center justify-center rounded-full border border-dashed border-brand/40 bg-brand/10 text-brand">
                                            {uploading ? (
                                                <Upload className="size-5 animate-pulse" />
                                            ) : (
                                                <ImagePlus className="size-5" />
                                            )}
                                        </span>
                                        <span className="text-[13px] font-medium text-foreground">
                                            {uploading
                                                ? "Uploading…"
                                                : "Click to upload photo"}
                                        </span>
                                        <span className="text-[11px] text-slate-gray">
                                            JPG or PNG · best at least 800px
                                            wide
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/gif"
                                            className="sr-only"
                                            disabled={uploading}
                                            onChange={event => {
                                                const file =
                                                    event.target.files?.[0] ??
                                                    null;
                                                void onPickUpload(file);
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                            {effectiveImage ? (
                                <div className="border-t border-hairline bg-card px-3 py-2">
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-brand">
                                        <Upload className="size-3.5" />
                                        Replace photo
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/gif"
                                            className="sr-only"
                                            disabled={uploading}
                                            onChange={event => {
                                                const file =
                                                    event.target.files?.[0] ??
                                                    null;
                                                void onPickUpload(file);
                                            }}
                                        />
                                    </label>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <hr className="border-hairline" />

                    {/* Modifiers & Customizations */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-[13px] font-medium text-foreground">
                                Options & modifiers (Optional)
                            </label>
                            <p className="text-[12px] text-slate-gray">
                                Attach saved groups (Hold / Extra / Choice), or
                                create a new one just for this dish.
                            </p>
                        </div>

                        {libraryGroups.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray">
                                    Saved groups
                                </p>
                                <div className="space-y-1.5">
                                    {libraryGroups.map(group => {
                                        const selected =
                                            selectedLibraryIds.includes(
                                                group.id,
                                            );
                                        return (
                                            <button
                                                key={group.id}
                                                type="button"
                                                onClick={() =>
                                                    toggleLibraryGroup(group.id)
                                                }
                                                className={cn(
                                                    "flex w-full items-start gap-3 rounded-[12px] border px-3 py-2.5 text-left transition-colors",
                                                    selected
                                                        ? "border-brand bg-brand/10"
                                                        : "border-hairline bg-card hover:bg-secondary/40",
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border text-[10px]",
                                                        selected
                                                            ? "border-brand bg-brand text-white"
                                                            : "border-input bg-card",
                                                    )}
                                                >
                                                    {selected ? "✓" : ""}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[13px] font-semibold">
                                                            {group.name}
                                                        </span>
                                                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] capitalize text-slate-gray">
                                                            {group.kind}
                                                        </span>
                                                    </span>
                                                    <span className="mt-0.5 block text-[11px] text-slate-gray">
                                                        {group.options
                                                            .map(o => o.name)
                                                            .join(" · ") ||
                                                            "No options"}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <p className="rounded-[12px] border border-dashed border-hairline bg-secondary/20 px-3 py-2 text-[12px] text-slate-gray">
                                No saved groups yet. Use{" "}
                                <span className="font-medium text-foreground">
                                    Add modifier group
                                </span>{" "}
                                on the menu page, or create one below.
                            </p>
                        )}

                        {modifierGroups.length > 0 ? (
                            <div className="space-y-2.5">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray">
                                    New for this dish
                                </p>
                                {modifierGroups.map(group => (
                                    <div
                                        key={group.id}
                                        className="rounded-[12px] border border-hairline bg-surface-ivory p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground capitalize">
                                                    {group.kind}
                                                </span>
                                                <h4 className="text-[13px] font-semibold text-foreground">
                                                    {group.name}
                                                </h4>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveGroup(group.id)
                                                }
                                                className="text-slate-gray hover:text-destructive"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {group.options.map(opt => (
                                                <span
                                                    key={opt.id}
                                                    className="flex items-center gap-1.5 rounded-full border border-hairline bg-card px-2.5 py-0.5 text-[11px]"
                                                >
                                                    <span>{opt.name}</span>
                                                    {opt.priceDelta > 0 ? (
                                                        <span className="font-semibold text-brand">
                                                            +ETB{" "}
                                                            {opt.priceDelta}
                                                        </span>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveOption(
                                                                group.id,
                                                                opt.id,
                                                            )
                                                        }
                                                        className="text-slate-gray hover:text-destructive"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>

                                        <div className="mt-2.5 flex items-center gap-2 border-t border-hairline pt-2">
                                            <Input
                                                placeholder="Option name"
                                                value={
                                                    targetGroupId === group.id
                                                        ? optionName
                                                        : ""
                                                }
                                                onFocus={() =>
                                                    setTargetGroupId(group.id)
                                                }
                                                onChange={e => {
                                                    setTargetGroupId(group.id);
                                                    setOptionName(
                                                        e.target.value,
                                                    );
                                                }}
                                                className="h-8 rounded-[8px] bg-card text-[12px]"
                                            />
                                            {group.kind === "extra" ? (
                                                <div className="relative w-24 shrink-0">
                                                    <span className="absolute inset-y-0 left-2 flex items-center text-[10px] text-slate-gray">
                                                        +ETB
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={
                                                            targetGroupId ===
                                                            group.id
                                                                ? optionDelta
                                                                : "0"
                                                        }
                                                        onChange={e =>
                                                            setOptionDelta(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-8 rounded-[8px] bg-card pl-9 text-[12px]"
                                                    />
                                                </div>
                                            ) : null}
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    handleAddOption(group.id)
                                                }
                                                className="h-8 shrink-0 rounded-full px-3 text-[11px]"
                                            >
                                                <Plus className="size-3" />
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div className="rounded-[12px] border border-dashed border-hairline bg-secondary/30 p-2.5">
                            <p className="mb-2 text-[11px] text-slate-gray">
                                Create a new group for this dish only
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                                <Input
                                    placeholder="Group name (e.g. Milk Choice)"
                                    value={newGroupName}
                                    onChange={e =>
                                        setNewGroupName(e.target.value)
                                    }
                                    className="h-8 rounded-[8px] bg-card text-[12px]"
                                />
                                <select
                                    value={newGroupKind}
                                    onChange={e =>
                                        setNewGroupKind(
                                            e.target.value as ModifierGroupKind,
                                        )
                                    }
                                    className="h-8 rounded-[8px] border border-input bg-card px-2 text-[11px]"
                                >
                                    <option value="included">
                                        Included (Hold)
                                    </option>
                                    <option value="extra">
                                        Extra (+Price)
                                    </option>
                                    <option value="choice">
                                        Single Choice
                                    </option>
                                </select>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAddGroup}
                                    disabled={!newGroupName.trim()}
                                    className="h-8 shrink-0 rounded-full px-3 text-[11px]"
                                >
                                    Create group
                                </Button>
                            </div>
                        </div>
                    </div>

                    <hr className="border-hairline" />

                    {/* Availability toggle */}
                    <div className="flex items-center justify-between rounded-[12px] border border-hairline bg-surface-ivory p-3">
                        <div>
                            <p className="text-[13px] font-medium text-foreground">
                                Active on floor
                            </p>
                            <p className="text-[11px] text-slate-gray">
                                {available
                                    ? "Waiters can order this dish immediately."
                                    : "Marked 86 / Sold out."}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAvailable(!available)}
                            className={cn(
                                "flex h-6 w-11 items-center rounded-full transition-colors p-0.5",
                                available ? "bg-emerald-600" : "bg-slate-300",
                            )}
                        >
                            <div
                                className={cn(
                                    "size-5 rounded-full bg-white shadow-xs transition-transform",
                                    available
                                        ? "translate-x-5"
                                        : "translate-x-0",
                                )}
                            />
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-hairline bg-surface-ivory px-5 py-3.5">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className="flex items-center gap-1 text-[11px]"
                        >
                            <StationIcon className="size-3 text-brand" />
                            {stationLabel}
                        </Badge>
                        <span className="text-[13px] font-semibold text-foreground">
                            {formatEtb(Number(price) || 0)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-9 rounded-full px-4 text-[13px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="add-menu-item-form"
                            disabled={!name.trim() || !stationId || saving}
                            className="h-9 flex items-center gap-1.5 rounded-full bg-brand px-5 text-[13px] text-white hover:bg-brand-deep"
                        >
                            {saving ? (
                                "Saving…"
                            ) : initialItem ? (
                                <>
                                    <Save className="size-3.5" />
                                    Save changes
                                </>
                            ) : (
                                <>
                                    <Plus className="size-3.5" />
                                    Add menu item
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                {submitError ? (
                    <p className="border-t border-hairline px-5 py-2 text-[12px] text-red-600">
                        {submitError}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
