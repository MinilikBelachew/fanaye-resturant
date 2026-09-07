"use client";

import { useEffect, useState } from "react";
import {
    Coffee,
    CookingPot,
    CupSoda,
    Plus,
    Save,
    Trash2,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    addMenuItem,
    deleteMenuItem,
    updateMenuItem,
} from "@/context/slices/menuSlice";
import type { MenuItem } from "@/domains/catalog/domain/menu";
import type {
    ModifierGroup,
    ModifierGroupKind,
    ModifierOption,
} from "@/domains/catalog/domain/modifiers";
import {
    DEFAULT_STATIONS,
    STATION_IDS,
    type StationId,
} from "@/domains/fulfillment/domain/station";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DISH_IMAGES } from "@/lib/media";
import { createId } from "@/lib/ids";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

interface AddMenuItemSheetProps {
    isOpen: boolean;
    onClose: () => void;
    initialItem?: MenuItem | null;
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
        categoryDefault: "Kitchen",
        defaultPrepMin: 12,
        color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    },
    [STATION_IDS.barista]: {
        label: "Barista",
        icon: Coffee,
        categoryDefault: "Barista",
        defaultPrepMin: 5,
        color: "text-amber-800 bg-amber-800/10 border-amber-800/20",
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

const PRESET_DISH_IMAGES = [
    { key: "burger", label: "Burger", url: DISH_IMAGES.burger },
    { key: "pizza", label: "Pizza", url: DISH_IMAGES.pizza },
    { key: "pasta", label: "Pasta", url: DISH_IMAGES.pasta },
    { key: "salad", label: "Salad", url: DISH_IMAGES.salad },
    { key: "macchiato", label: "Macchiato", url: DISH_IMAGES.macchiato },
    { key: "latte", label: "Latte", url: DISH_IMAGES.latte },
    { key: "cheesecake", label: "Cheesecake", url: DISH_IMAGES.cheesecake },
    { key: "tiramisu", label: "Tiramisu", url: DISH_IMAGES.tiramisu },
    { key: "cola", label: "Cola", url: DISH_IMAGES.cola },
    { key: "sprite", label: "Sprite", url: DISH_IMAGES.sprite },
];

export default function AddMenuItemSheet({
    isOpen,
    onClose,
    initialItem,
}: AddMenuItemSheetProps) {
    const dispatch = useAppDispatch();
    const stations = useAppSelector(state => state.station.stations);

    // Form states
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState<string>("250");
    const [stationId, setStationId] = useState<string>(STATION_IDS.kitchen);
    const [category, setCategory] = useState("Kitchen");
    const [expectedPrepMinutes, setExpectedPrepMinutes] = useState<number>(12);
    const [selectedImage, setSelectedImage] = useState<string>(
        DISH_IMAGES.burger,
    );
    const [customImageUrl, setCustomImageUrl] = useState("");
    const [available, setAvailable] = useState(true);

    // Modifier Groups builder
    const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupKind, setNewGroupKind] =
        useState<ModifierGroupKind>("included");

    // Option sub-form
    const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
    const [optionName, setOptionName] = useState("");
    const [optionDelta, setOptionDelta] = useState<string>("0");

    // Populate or reset form when initialItem or isOpen changes
    useEffect(() => {
        if (initialItem) {
            setName(initialItem.name);
            setDescription(initialItem.description);
            setPrice(String(initialItem.price));
            setStationId(initialItem.stationId);
            setCategory(initialItem.category);
            setExpectedPrepMinutes(initialItem.expectedPreparationMinutes);
            const isHttp = initialItem.image?.startsWith("http");
            if (isHttp) {
                setCustomImageUrl(initialItem.image || "");
                setSelectedImage(DISH_IMAGES.burger);
            } else {
                setSelectedImage(initialItem.image || DISH_IMAGES.burger);
                setCustomImageUrl("");
            }
            setAvailable(initialItem.available);
            setModifierGroups(initialItem.modifierGroups || []);
        } else {
            setName("");
            setDescription("");
            setPrice("250");
            setStationId(STATION_IDS.kitchen);
            setCategory("Kitchen");
            setExpectedPrepMinutes(12);
            setSelectedImage(DISH_IMAGES.burger);
            setCustomImageUrl("");
            setAvailable(true);
            setModifierGroups([]);
        }
    }, [initialItem, isOpen]);

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

    function applyPresetHoldGroup() {
        const holdGroup: ModifierGroup = {
            id: createId("modgroup"),
            name: "Hold ingredients",
            kind: "included",
            min: 0,
            max: 4,
            options: [
                {
                    id: createId("opt"),
                    name: "Onion",
                    ticketLabel: "No onion",
                    priceDelta: 0,
                },
                {
                    id: createId("opt"),
                    name: "Tomato",
                    ticketLabel: "No tomato",
                    priceDelta: 0,
                },
                {
                    id: createId("opt"),
                    name: "Chili / Mitmita",
                    ticketLabel: "No chili",
                    priceDelta: 0,
                },
            ],
        };
        setModifierGroups(prev => [...prev, holdGroup]);
    }

    function applyPresetExtraGroup() {
        const extraGroup: ModifierGroup = {
            id: createId("modgroup"),
            name: "Extra toppings",
            kind: "extra",
            min: 0,
            max: 4,
            options: [
                {
                    id: createId("opt"),
                    name: "Extra Cheese",
                    ticketLabel: "Extra cheese",
                    priceDelta: 40,
                },
                {
                    id: createId("opt"),
                    name: "Extra Sauce",
                    ticketLabel: "Extra sauce",
                    priceDelta: 20,
                },
                {
                    id: createId("opt"),
                    name: "Double Portion",
                    ticketLabel: "Double portion",
                    priceDelta: 90,
                },
            ],
        };
        setModifierGroups(prev => [...prev, extraGroup]);
    }

    function handleDeleteItem() {
        if (!initialItem) return;
        if (confirm(`Delete "${initialItem.name}" from catalog?`)) {
            dispatch(deleteMenuItem(initialItem.id));
            onClose();
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        const finalPrice = Math.max(0, Number(price) || 0);
        const finalImage = customImageUrl.trim() || selectedImage;

        if (initialItem) {
            const updated: MenuItem = {
                ...initialItem,
                name: name.trim(),
                description:
                    description.trim() ||
                    `${name.trim()} prepared fresh to order.`,
                category:
                    category.trim() ||
                    stations.find(s => s.id === stationId)?.name ||
                    DEFAULT_STATION_META[stationId]?.label ||
                    "Kitchen",
                price: finalPrice,
                stationId,
                expectedPreparationMinutes: Math.max(
                    1,
                    expectedPrepMinutes || 5,
                ),
                available,
                image: finalImage,
                modifierGroups,
            };
            dispatch(updateMenuItem(updated));
        } else {
            const newItem: MenuItem = {
                id: createId("menu"),
                name: name.trim(),
                description:
                    description.trim() ||
                    `${name.trim()} prepared fresh to order.`,
                category:
                    category.trim() ||
                    stations.find(s => s.id === stationId)?.name ||
                    DEFAULT_STATION_META[stationId]?.label ||
                    "Kitchen",
                price: finalPrice,
                stationId,
                expectedPreparationMinutes: Math.max(
                    1,
                    expectedPrepMinutes || 5,
                ),
                available,
                image: finalImage,
                modifierGroups,
            };
            dispatch(addMenuItem(newItem));
        }
        onClose();
    }

    const matchingStation = stations.find(s => s.id === stationId);
    const stationLabel =
        matchingStation?.name ||
        DEFAULT_STATION_META[stationId]?.label ||
        "Kitchen";
    const StationIcon =
        DEFAULT_STATION_META[stationId]?.icon || CookingPot;
    const effectiveImage = customImageUrl.trim() || selectedImage;

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
                                Item name <span className="text-destructive">*</span>
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
                                    Base price (ETB) <span className="text-destructive">*</span>
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
                            {(stations.length > 0
                                ? stations
                                : DEFAULT_STATIONS
                            ).map(st => {
                                const meta = DEFAULT_STATION_META[st.id];
                                const Icon = meta?.icon || CookingPot;
                                const isSelected = stationId === st.id;
                                const label = st.name || meta?.label || "Station";
                                const prepMin =
                                    st.avgPrepMin ||
                                    meta?.defaultPrepMin ||
                                    10;

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
                                        <div
                                            className={cn(
                                                "flex size-8 items-center justify-center rounded-full border",
                                                isSelected
                                                    ? "border-brand bg-brand text-white"
                                                    : meta?.color ||
                                                          "text-amber-600 bg-amber-500/10 border-amber-500/20",
                                            )}
                                        >
                                            <Icon className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-medium text-foreground">
                                                {label}
                                            </p>
                                            <p className="text-[10px] text-slate-gray">
                                                ~{prepMin} min
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <hr className="border-hairline" />

                    {/* Image / Photography */}
                    <div className="space-y-2.5">
                        <label className="text-[13px] font-medium text-foreground">
                            Photo & presentation
                        </label>

                        {/* Selected thumbnail preview */}
                        <div className="flex items-center gap-3 rounded-[12px] border border-hairline bg-surface-ivory p-2.5">
                            <div className="size-12 shrink-0 overflow-hidden rounded-[8px] border border-hairline bg-secondary">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={effectiveImage}
                                    alt="Preview"
                                    className="size-full object-cover"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-foreground">
                                    {name || "Item name preview"}
                                </p>
                                <p className="text-[12px] font-medium text-brand">
                                    {formatEtb(Number(price) || 0)} · {stationLabel}
                                </p>
                            </div>
                        </div>

                        {/* Preset gallery */}
                        <div className="grid grid-cols-5 gap-1.5">
                            {PRESET_DISH_IMAGES.map(img => (
                                <button
                                    key={img.key}
                                    type="button"
                                    onClick={() => {
                                        setSelectedImage(img.url);
                                        setCustomImageUrl("");
                                    }}
                                    className={cn(
                                        "group relative overflow-hidden rounded-[8px] border p-1 transition-all",
                                        selectedImage === img.url && !customImageUrl
                                            ? "border-brand ring-1 ring-brand"
                                            : "border-hairline hover:border-slate-300",
                                    )}
                                >
                                    <div className="aspect-square overflow-hidden rounded-[6px]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img.url}
                                            alt={img.label}
                                            className="size-full object-cover"
                                        />
                                    </div>
                                    <p className="mt-0.5 truncate text-center text-[10px] text-slate-gray">
                                        {img.label}
                                    </p>
                                </button>
                            ))}
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
                                Customizable options for waiters (e.g. holds, extra toppings, milk/sugar choices).
                            </p>
                        </div>

                        {/* Quick preset buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] text-slate-gray">
                                Quick presets:
                            </span>
                            <button
                                type="button"
                                onClick={applyPresetHoldGroup}
                                className="flex items-center gap-1 rounded-full border border-hairline bg-secondary px-3 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-accent"
                            >
                                <Plus className="size-3 text-brand" />
                                Hold ingredients
                            </button>
                            <button
                                type="button"
                                onClick={applyPresetExtraGroup}
                                className="flex items-center gap-1 rounded-full border border-hairline bg-secondary px-3 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-accent"
                            >
                                <Plus className="size-3 text-brand" />
                                Extra toppings (+ETB)
                            </button>
                        </div>

                        {/* Configured modifier groups */}
                        {modifierGroups.length > 0 ? (
                            <div className="space-y-2.5">
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

                                        {/* Options chips */}
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {group.options.map(opt => (
                                                <span
                                                    key={opt.id}
                                                    className="flex items-center gap-1.5 rounded-full border border-hairline bg-card px-2.5 py-0.5 text-[11px]"
                                                >
                                                    <span>{opt.name}</span>
                                                    {opt.priceDelta > 0 ? (
                                                        <span className="font-semibold text-brand">
                                                            +ETB {opt.priceDelta}
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

                                        {/* Add option to group */}
                                        <div className="mt-2.5 flex items-center gap-2 border-t border-hairline pt-2">
                                            <Input
                                                placeholder="Option name (e.g. Extra Sauce, No Onions)"
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

                        {/* Add custom group */}
                        <div className="rounded-[12px] border border-dashed border-hairline bg-secondary/30 p-2.5">
                            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                                <Input
                                    placeholder="Group name (e.g. Cooking Temp, Milk Choice)"
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
                                            e.target
                                                .value as ModifierGroupKind,
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
                            disabled={!name.trim()}
                            className="h-9 flex items-center gap-1.5 rounded-full bg-brand px-5 text-[13px] text-white hover:bg-brand-deep"
                        >
                            {initialItem ? (
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
            </div>
        </div>
    );
}
