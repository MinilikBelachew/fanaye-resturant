"use client";

import { useMemo, useState } from "react";
import {
    Boxes,
    Check,
    Coffee,
    Filter,
    Layers,
    Loader2,
    Package,
    Plus,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Trash2,
    Utensils,
    Wine,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    useCreateInventoryMaterialMutation,
    useDeleteInventoryMaterialMutation,
    useListInventoryMaterialsQuery,
    useUpdateInventoryMaterialMutation,
    useUpsertMaterialBalanceMutation,
    type InventoryMaterial,
} from "@/context/services/inventoryApi";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: "", label: "All Items" },
    { id: "CUTLERY", label: "Cutlery", icon: Utensils },
    { id: "CROCKERY", label: "Crockery & Plates", icon: Layers },
    { id: "GLASSWARE", label: "Glassware", icon: Wine },
    { id: "TRAYS", label: "Trays", icon: Boxes },
    { id: "WARMERS_CARRIERS", label: "Warmers & Carriers", icon: Coffee },
    { id: "CONTAINERS", label: "Containers & Crates", icon: Package },
] as const;

const PRESET_IMAGES = [
    { label: "Dinner Plate", url: "/images/materials/dinner-plate.jpg" },
    { label: "Side Plate", url: "/images/materials/side-plate.jpg" },
    { label: "Pasta Bowl", url: "/images/materials/pasta-bowl.jpg" },
    { label: "Soup Bowl", url: "/images/materials/soup-bowl.jpg" },
    { label: "Salad Bowl", url: "/images/materials/salad-bowl.jpg" },
    { label: "Oval Platter", url: "/images/materials/oval-platter.jpg" },
    { label: "Square Plate", url: "/images/materials/square-plate.jpg" },
    { label: "Ramekin / Dip", url: "/images/materials/ramekin.jpg" },
    { label: "Coffee Cup", url: "/images/materials/coffee-cup.jpg" },
    { label: "Mug", url: "/images/materials/mug.jpg" },
    { label: "Espresso Cup", url: "/images/materials/espresso-cup.jpg" },
    { label: "Teapot", url: "/images/materials/teapot.jpg" },
    { label: "Clay Desta Pot", url: "/images/materials/clay-desta.jpg" },
    { label: "Water Goblet", url: "/images/materials/water-goblet.jpg" },
    { label: "Wine Glass", url: "/images/materials/red-wine-glass.jpg" },
    { label: "White Wine", url: "/images/materials/white-wine-glass.jpg" },
    { label: "Champagne Flute", url: "/images/materials/champagne-flute.jpg" },
    { label: "Highball Glass", url: "/images/materials/highball-glass.jpg" },
    { label: "Whiskey Tumbler", url: "/images/materials/whiskey-glass.jpg" },
    { label: "Beer Mug", url: "/images/materials/beer-mug.jpg" },
    { label: "Cocktail Glass", url: "/images/materials/cocktail-glass.jpg" },
    { label: "Shot Glass", url: "/images/materials/shot-glass.jpg" },
    { label: "Glass Carafe", url: "/images/materials/glass-carafe.jpg" },
    { label: "Ice Bucket", url: "/images/materials/ice-bucket.jpg" },
    { label: "Cocktail Shaker", url: "/images/materials/cocktail-shaker.jpg" },
    { label: "Waiter Tray", url: "/images/materials/waiter-tray.jpg" },
    { label: "Oval Tray", url: "/images/materials/oval-tray.jpg" },
    {
        label: "Room Service Tray",
        url: "/images/materials/room-service-tray.jpg",
    },
    {
        label: "Stainless Platter",
        url: "/images/materials/stainless-platter.jpg",
    },
    { label: "Pizza Board", url: "/images/materials/wooden-pizza-board.jpg" },
    { label: "Cheese Board", url: "/images/materials/cheese-board.jpg" },
    { label: "Bread Basket", url: "/images/materials/bread-basket.jpg" },
    { label: "Bill Folder", url: "/images/materials/bill-folder.jpg" },
    { label: "Fork", url: "/images/materials/fork.jpg" },
    { label: "Knife", url: "/images/materials/knife.jpg" },
    { label: "Spoon", url: "/images/materials/spoon.jpg" },
    { label: "Teaspoon", url: "/images/materials/teaspoon.jpg" },
    { label: "Cutlery Set", url: "/images/materials/cutlery-set.jpg" },
    { label: "Chopsticks", url: "/images/materials/chopsticks.jpg" },
    {
        label: "Delivery Backpack",
        url: "/images/materials/thermal-backpack.jpg",
    },
    { label: "Insulated Box", url: "/images/materials/insulated-box.jpg" },
    { label: "Pizza Bag", url: "/images/materials/pizza-delivery-bag.jpg" },
    { label: "Chafing Dish", url: "/images/materials/chafing-dish.jpg" },
    { label: "Soup Kettle", url: "/images/materials/soup-kettle.jpg" },
    {
        label: "Beverage Dispenser",
        url: "/images/materials/beverage-dispenser.jpg",
    },
    { label: "Thermal Carafe", url: "/images/materials/thermal-carafe.jpg" },
    { label: "GN Food Pan", url: "/images/materials/gn-food-pan.jpg" },
    {
        label: "Glass Rack Crate",
        url: "/images/materials/glass-rack-crate.jpg",
    },
    { label: "Bussing Tub", url: "/images/materials/bussing-tub.jpg" },
    { label: "Squeeze Bottle", url: "/images/materials/squeeze-bottle.jpg" },
    { label: "Salt & Pepper", url: "/images/materials/salt-pepper.jpg" },
];

export function InventoryMaterialsPanel() {
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] =
        useState<InventoryMaterial | null>(null);
    const [adjustingMaterial, setAdjustingMaterial] =
        useState<InventoryMaterial | null>(null);

    const queryArgs = useMemo(
        () => ({
            category: selectedCategory || undefined,
            q: searchQuery.trim() || undefined,
            limit: 100,
        }),
        [selectedCategory, searchQuery],
    );

    const { data, isLoading, isFetching, refetch } =
        useListInventoryMaterialsQuery(queryArgs);
    const [deleteMaterial] = useDeleteInventoryMaterialMutation();

    const materials = data?.data ?? [];

    const stats = useMemo(() => {
        const totalItems = materials.length;
        let totalOnHand = 0;
        let totalIssued = 0;
        let totalLost = 0;
        for (const m of materials) {
            totalOnHand += Number(m.onHandQty) || 0;
            totalIssued += Number(m.issuedQty) || 0;
            totalLost += Number(m.lostQty) || 0;
        }
        return { totalItems, totalOnHand, totalIssued, totalLost };
    }, [materials]);

    return (
        <div className="space-y-4">
            {/* Header KPI Strip (Clean & Minimal, 0 shadows) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Catalog items
                    </p>
                    <p className="mt-1 text-xl font-medium tracking-tight tabular-nums text-foreground">
                        {stats.totalItems}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Registered materials
                    </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Available on hand
                    </p>
                    <p className="mt-1 text-xl font-medium tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                        {stats.totalOnHand}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Ready for outside issue
                    </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Currently out
                    </p>
                    <p className="mt-1 text-xl font-medium tracking-tight tabular-nums text-sky-600 dark:text-sky-400">
                        {stats.totalIssued}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Issued to waiters/outside
                    </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/30 p-3.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Recorded loss
                    </p>
                    <p className="mt-1 text-xl font-medium tracking-tight tabular-nums text-rose-600 dark:text-rose-400">
                        {stats.totalLost}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Shortfalls &amp; damaged
                    </p>
                </div>
            </div>

            {/* Controls Bar: Category filter pills & Search */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {CATEGORIES.map(cat => {
                        const Icon = "icon" in cat ? cat.icon : null;
                        const active = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                                    active
                                        ? "bg-primary text-primary-foreground"
                                        : "border border-border/60 bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                                )}
                            >
                                {Icon && <Icon className="size-3.5" />}
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-60">
                        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search materials..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-8 w-full rounded-lg border border-border/60 bg-background pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3" />
                            </button>
                        )}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void refetch()}
                        className="h-8 gap-1.5 border-border/60 text-xs font-medium"
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                isFetching && "animate-spin",
                            )}
                        />
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => setIsAddOpen(true)}
                        className="h-8 gap-1.5 px-3 text-xs font-medium"
                    >
                        <Plus className="size-3.5" />
                        <span>Add Material</span>
                    </Button>
                </div>
            </div>

            {/* Materials Table / List */}
            {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/20 py-16 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading restaurant materials catalog…
                </div>
            ) : materials.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-card/20 py-14 text-center">
                    <Boxes className="size-8 text-muted-foreground/40" />
                    <p className="text-xs font-medium text-foreground">
                        No materials found
                    </p>
                    <p className="max-w-xs text-[11px] text-muted-foreground">
                        {searchQuery || selectedCategory
                            ? "Try adjusting your search or category filter."
                            : "Get started by adding returnable trays, plates, or cutlery for outside orders."}
                    </p>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddOpen(true)}
                        className="mt-2 h-7.5 gap-1.5 text-xs font-medium"
                    >
                        <Plus className="size-3.5" />
                        <span>Add First Material</span>
                    </Button>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/20">
                    <table className="w-full min-w-[760px] text-xs">
                        <thead className="border-b border-border/50 bg-muted/20 text-[10px] text-muted-foreground">
                            <tr>
                                <th className="px-3.5 py-2.5 text-left font-medium">
                                    Material
                                </th>
                                <th className="px-3 py-2.5 text-left font-medium">
                                    Category
                                </th>
                                <th className="px-3 py-2.5 text-center font-medium">
                                    Type
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Available
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Issued (Out)
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Lost
                                </th>
                                <th className="px-3.5 py-2.5 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {materials.map((item: InventoryMaterial) => (
                                <tr
                                    key={item.id}
                                    className="transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-3.5 py-2.5">
                                        <div className="flex items-center gap-3">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="size-9 shrink-0 rounded-lg border border-border/50 object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
                                                    <Boxes className="size-4" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-foreground leading-snug">
                                                    {item.name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    <span className="font-mono text-muted-foreground/80">
                                                        {item.code}
                                                    </span>
                                                    {item.amharicName && (
                                                        <span>
                                                            {" "}
                                                            · {item.amharicName}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-foreground">
                                            {item.category.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                        <span
                                            className={cn(
                                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium",
                                                item.isReusable
                                                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                                                    : "border-border/60 bg-muted/30 text-muted-foreground",
                                            )}
                                        >
                                            {item.isReusable
                                                ? "Returnable"
                                                : "Disposable"}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        <span className="font-mono text-xs font-medium text-foreground">
                                            {item.onHandQty}
                                        </span>
                                        <span className="ml-1 text-[10px] text-muted-foreground">
                                            {item.unit}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        <span
                                            className={cn(
                                                "font-mono text-xs font-medium",
                                                Number(item.issuedQty) > 0
                                                    ? "text-sky-600 dark:text-sky-400"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {item.issuedQty}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        <span
                                            className={cn(
                                                "font-mono text-xs font-medium",
                                                Number(item.lostQty) > 0
                                                    ? "text-rose-600 dark:text-rose-400"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {item.lostQty}
                                        </span>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setAdjustingMaterial(item)
                                                }
                                                className="h-7 border-border/60 px-2 text-[11px] font-medium"
                                                title="Adjust stock balance"
                                            >
                                                <SlidersHorizontal className="size-3 mr-1" />
                                                Stock
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setEditingMaterial(item)
                                                }
                                                className="h-7 border-border/60 px-2 text-[11px] font-medium"
                                            >
                                                Edit
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (
                                                        confirm(
                                                            `Archive "${item.name}" from active materials?`,
                                                        )
                                                    ) {
                                                        await deleteMaterial(
                                                            item.id,
                                                        );
                                                    }
                                                }}
                                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                                                title="Archive material"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Material Modal */}
            {isAddOpen && (
                <MaterialFormModal
                    isOpen={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
                />
            )}

            {/* Edit Material Modal */}
            {editingMaterial && (
                <MaterialFormModal
                    isOpen={Boolean(editingMaterial)}
                    material={editingMaterial}
                    onClose={() => setEditingMaterial(null)}
                />
            )}

            {/* Adjust Stock Balance Modal */}
            {adjustingMaterial && (
                <AdjustBalanceModal
                    material={adjustingMaterial}
                    onClose={() => setAdjustingMaterial(null)}
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Add / Edit Modal with Image Picker
// ---------------------------------------------------------------------------

function MaterialFormModal({
    isOpen,
    material,
    onClose,
}: {
    isOpen: boolean;
    material?: InventoryMaterial | null;
    onClose: () => void;
}) {
    const isEdit = Boolean(material);
    const [createMaterial, { isLoading: creating }] =
        useCreateInventoryMaterialMutation();
    const [updateMaterial, { isLoading: updating }] =
        useUpdateInventoryMaterialMutation();
    const [upsertBalance] = useUpsertMaterialBalanceMutation();

    const [name, setName] = useState(material?.name ?? "");
    const [amharicName, setAmharicName] = useState(material?.amharicName ?? "");
    const [code, setCode] = useState(material?.code ?? "");
    const [category, setCategory] = useState(material?.category ?? "CUTLERY");
    const [unit, setUnit] = useState(material?.unit ?? "pcs");
    const [isReusable, setIsReusable] = useState(material?.isReusable ?? true);
    const [imageUrl, setImageUrl] = useState(
        material?.imageUrl ?? "/images/materials/dinner-plate.jpg",
    );
    const [description, setDescription] = useState(material?.description ?? "");
    const [initialStock, setInitialStock] = useState("50");
    const [customImageInput, setCustomImageInput] = useState("");
    const [showCustomImage, setShowCustomImage] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            const finalImage =
                (showCustomImage ? customImageInput.trim() : imageUrl) ||
                undefined;

            if (isEdit && material) {
                await updateMaterial({
                    id: material.id,
                    body: {
                        name: name.trim(),
                        amharicName: amharicName.trim() || undefined,
                        code: code.trim() || undefined,
                        category,
                        unit: unit.trim() || "pcs",
                        isReusable,
                        imageUrl: finalImage,
                        description: description.trim() || undefined,
                    },
                }).unwrap();
            } else {
                const res = await createMaterial({
                    name: name.trim(),
                    amharicName: amharicName.trim() || undefined,
                    code: code.trim() || undefined,
                    category,
                    unit: unit.trim() || "pcs",
                    isReusable,
                    imageUrl: finalImage,
                    description: description.trim() || undefined,
                }).unwrap();

                // Set initial opening stock if provided
                const stockQty = Number(initialStock);
                if (stockQty > 0 && res?.data?.id) {
                    await upsertBalance({
                        materialId: res.data.id,
                        setOnHand: stockQty,
                    }).unwrap();
                }
            }
            onClose();
        } catch (err: any) {
            alert(err?.data?.message || "Failed to save material.");
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-border/80 bg-background p-5 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                        <Boxes className="size-4 text-foreground" />
                        <h3 className="text-sm font-medium text-foreground">
                            {isEdit
                                ? "Edit Material"
                                : "Register Returnable Material"}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                    {/* Image selector */}
                    <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">
                            Material Image
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {PRESET_IMAGES.map(preset => {
                                const active =
                                    !showCustomImage && imageUrl === preset.url;
                                return (
                                    <button
                                        key={preset.url}
                                        type="button"
                                        onClick={() => {
                                            setImageUrl(preset.url);
                                            setShowCustomImage(false);
                                        }}
                                        className={cn(
                                            "group relative flex flex-col items-center gap-1 rounded-lg border p-1 text-center transition-all",
                                            active
                                                ? "border-primary bg-primary/5"
                                                : "border-border/60 hover:border-border",
                                        )}
                                    >
                                        <img
                                            src={preset.url}
                                            alt={preset.label}
                                            className="size-11 rounded-md object-cover"
                                        />
                                        <span className="text-[9px] font-medium text-foreground truncate max-w-full">
                                            {preset.label}
                                        </span>
                                        {active && (
                                            <span className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                                                <Check className="size-2.5" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowCustomImage(!showCustomImage)
                                }
                                className="text-[11px] text-primary hover:underline"
                            >
                                {showCustomImage
                                    ? "Choose from presets"
                                    : "Or enter custom image URL"}
                            </button>
                        </div>
                        {showCustomImage && (
                            <input
                                type="text"
                                placeholder="https://... or /images/..."
                                value={customImageInput}
                                onChange={e =>
                                    setCustomImageInput(e.target.value)
                                }
                                className="mt-1.5 h-8 w-full rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none"
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                Name (English) *
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Stainless Serving Tray"
                                className="h-8 w-full rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                Name (Amharic)
                            </label>
                            <input
                                type="text"
                                value={amharicName}
                                onChange={e => setAmharicName(e.target.value)}
                                placeholder="e.g. የአስተናጋጅ ትሪ"
                                className="h-8 w-full rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                        <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                Item Code
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="Auto if blank"
                                className="h-8 w-full rounded-lg border border-border/60 bg-background px-2.5 font-mono text-xs text-foreground focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs text-foreground focus:outline-none"
                            >
                                <option value="CUTLERY">Cutlery</option>
                                <option value="CROCKERY">Crockery</option>
                                <option value="GLASSWARE">Glassware</option>
                                <option value="TRAYS">Trays</option>
                                <option value="WARMERS_CARRIERS">
                                    Warmers &amp; Carriers
                                </option>
                                <option value="CONTAINERS">Containers</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                Unit
                            </label>
                            <input
                                type="text"
                                value={unit}
                                onChange={e => setUnit(e.target.value)}
                                placeholder="pcs, set, box"
                                className="h-8 w-full rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none"
                            />
                        </div>
                    </div>

                    {!isEdit && (
                        <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                Opening Available Stock (On Hand)
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={initialStock}
                                onChange={e => setInitialStock(e.target.value)}
                                className="h-8 w-32 rounded-lg border border-border/60 bg-background px-2.5 font-mono text-xs text-foreground focus:outline-none"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                            Description / Specification
                        </label>
                        <textarea
                            rows={2}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g. 16-inch fiberglass non-slip black tray for outside delivery"
                            className="w-full rounded-lg border border-border/60 bg-background p-2 text-xs text-foreground focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="reusableCheck"
                            checked={isReusable}
                            onChange={e => setIsReusable(e.target.checked)}
                            className="size-3.5 rounded border-border"
                        />
                        <label
                            htmlFor="reusableCheck"
                            className="text-xs text-foreground cursor-pointer"
                        >
                            Returnable asset (mandatory return checklist on
                            outside orders)
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={onClose}
                            className="h-8 px-3 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={creating || updating || !name.trim()}
                            className="h-8 gap-1.5 px-4 text-xs font-medium"
                        >
                            {(creating || updating) && (
                                <Loader2 className="size-3 animate-spin" />
                            )}
                            <span>
                                {isEdit ? "Update Material" : "Save Material"}
                            </span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Adjust Balance Modal
// ---------------------------------------------------------------------------

function AdjustBalanceModal({
    material,
    onClose,
}: {
    material: InventoryMaterial;
    onClose: () => void;
}) {
    const [upsertBalance, { isLoading }] = useUpsertMaterialBalanceMutation();
    const [onHand, setOnHand] = useState(String(material.onHandQty ?? 0));
    const [issued, setIssued] = useState(String(material.issuedQty ?? 0));
    const [lost, setLost] = useState(String(material.lostQty ?? 0));

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        try {
            await upsertBalance({
                materialId: material.id,
                setOnHand: Number(onHand) || 0,
                setIssued: Number(issued) || 0,
                setLost: Number(lost) || 0,
            }).unwrap();
            onClose();
        } catch (err: any) {
            alert(err?.data?.message || "Failed to adjust balance.");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-xl border border-border/80 bg-background p-5 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="size-4 text-foreground" />
                        <h3 className="text-sm font-medium text-foreground">
                            Adjust Stock: {material.name}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="mt-4 space-y-3">
                    <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                            Available On Hand ({material.unit})
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={onHand}
                            onChange={e => setOnHand(e.target.value)}
                            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2.5 font-mono text-xs text-foreground focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                            Currently Issued Out ({material.unit})
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={issued}
                            onChange={e => setIssued(e.target.value)}
                            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2.5 font-mono text-xs text-foreground focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                            Recorded Lost / Damaged ({material.unit})
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={lost}
                            onChange={e => setLost(e.target.value)}
                            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2.5 font-mono text-xs text-foreground focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={onClose}
                            className="h-8 px-3 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isLoading}
                            className="h-8 gap-1.5 px-4 text-xs font-medium"
                        >
                            {isLoading && (
                                <Loader2 className="size-3 animate-spin" />
                            )}
                            <span>Update Balance</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default InventoryMaterialsPanel;
