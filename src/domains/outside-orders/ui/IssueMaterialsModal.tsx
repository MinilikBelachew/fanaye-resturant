"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
    Boxes,
    X,
    Loader2,
    Check,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListInventoryMaterialsQuery } from "@/context/services/inventoryApi";
import {
    useIssueMaterialsMutation,
    useGetOutsideOrderQuery,
} from "@/context/services/outsideOrdersApi";
import { toast } from "@/lib/toast";
import { useTranslations } from "next-intl";

const ITEMS_PER_PAGE = 20;

function parseMaterialQuantity(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (typeof val === "string") return parseFloat(val) || 0;
    if (typeof val === "object") {
        if ("s" in val && "e" in val && "d" in val) {
            const sign = val.s < 0 ? -1 : 1;
            const digits = (val.d || []).join("");
            const exp = typeof val.e === "number" ? val.e : 0;
            if (!digits) return 0;
            if (exp >= digits.length - 1) {
                return (
                    sign *
                    parseFloat(digits + "0".repeat(exp - digits.length + 1))
                );
            }
            return (
                sign *
                parseFloat(
                    digits.slice(0, exp + 1) + "." + digits.slice(exp + 1),
                )
            );
        }
    }
    return Number(val) || 0;
}

export default function IssueMaterialsModal({
    outsideOrderId,
    orderId,
    destinationName,
    onClose,
    onSuccess,
}: {
    outsideOrderId?: string | null;
    orderId?: string | null;
    destinationName: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const t = useTranslations("materialsModal");

    const { data: materialsRes, isLoading: loadingMaterials } =
        useListInventoryMaterialsQuery({ isReusable: "true" });
    const materials = useMemo(
        () => materialsRes?.data ?? [],
        [materialsRes?.data],
    );

    // Fetch existing outside order data if outsideOrderId is available to display already assigned items
    const { data: orderRes } = useGetOutsideOrderQuery(outsideOrderId ?? "", {
        skip: !outsideOrderId,
    });

    const alreadyAssigned = useMemo(() => {
        if (!orderRes?.data?.materialIssues) return [];
        const map = new Map<
            string,
            { materialName: string; qty: number; imageUrl?: string | null }
        >();
        for (const issue of orderRes.data.materialIssues) {
            for (const line of issue.lines) {
                const qty = parseMaterialQuantity(line.qtyIssued);
                const existing = map.get(line.materialId);
                if (existing) {
                    existing.qty += qty;
                } else {
                    map.set(line.materialId, {
                        materialName: line.materialNameSnapshot,
                        qty,
                        imageUrl: line.material?.imageUrl,
                    });
                }
            }
        }
        return Array.from(map.entries())
            .filter(([_, data]) => data.qty > 0)
            .map(([materialId, data]) => ({
                materialId,
                ...data,
            }));
    }, [orderRes?.data?.materialIssues]);

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [page, setPage] = useState(1);

    const [selected, setSelected] = useState<Map<string, number>>(new Map());
    const [note, setNote] = useState("");

    const [issueMaterials, { isLoading }] = useIssueMaterialsMutation();

    // Unique categories from materials
    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const m of materials) {
            if (m.category) set.add(m.category);
        }
        return ["ALL", ...Array.from(set)];
    }, [materials]);

    // Filtered materials
    const filteredMaterials = useMemo(() => {
        return materials.filter(m => {
            if (selectedCategory !== "ALL" && m.category !== selectedCategory) {
                return false;
            }
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                m.name.toLowerCase().includes(q) ||
                (m.code && m.code.toLowerCase().includes(q)) ||
                (m.category && m.category.toLowerCase().includes(q))
            );
        });
    }, [materials, selectedCategory, search]);

    // Pagination
    const totalPages = Math.max(
        1,
        Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE),
    );
    const paginatedMaterials = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredMaterials.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredMaterials, page]);

    function toggleMaterial(materialId: string) {
        setSelected(prev => {
            const next = new Map(prev);
            if (next.has(materialId)) {
                next.delete(materialId);
            } else {
                next.set(materialId, 1);
            }
            return next;
        });
    }

    function updateQuantity(materialId: string, delta: number) {
        setSelected(prev => {
            const next = new Map(prev);
            const current = next.get(materialId) || 0;
            const newQty = current + delta;
            if (newQty <= 0) {
                next.delete(materialId);
            } else {
                next.set(materialId, newQty);
            }
            return next;
        });
    }

    async function handleSubmit() {
        if (selected.size === 0) {
            toast.error("Please select at least one material.");
            return;
        }

        try {
            const lines = Array.from(selected.entries()).map(
                ([materialId, quantity]) => ({
                    materialId,
                    quantity,
                }),
            );

            await issueMaterials({
                outsideOrderId: outsideOrderId || undefined,
                orderId: orderId || undefined,
                note: note.trim() || undefined,
                lines,
            }).unwrap();

            toast.success("Materials assigned successfully.");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to assign materials.");
        }
    }

    const totalSelectedUnits = Array.from(selected.values()).reduce(
        (sum, qty) => sum + qty,
        0,
    );
    const totalAssignedPcs = alreadyAssigned.reduce((s, i) => s + i.qty, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-4xl rounded-xl border border-border bg-background shadow-2xl animate-in fade-in-50 zoom-in-95 max-h-[92vh] flex flex-col text-foreground">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
                    <div className="flex items-center gap-2.5">
                        <Boxes className="size-5 text-amber-600 dark:text-amber-500" />
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                {t("assignMaterials")}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">
                                {destinationName}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Already Assigned Banner */}
                {alreadyAssigned.length > 0 && (
                    <div className="bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-500/30 px-5 py-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                <CheckCircle2 className="size-3.5 text-amber-600 dark:text-amber-400" />
                                {t("alreadyAssigned")} (
                                {t("totalPieces", { count: totalAssignedPcs })})
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {alreadyAssigned.map(item => (
                                <div
                                    key={item.materialId}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-amber-500/40 text-xs text-foreground shadow-xs"
                                >
                                    <span className="font-bold text-amber-700 dark:text-amber-400">
                                        {item.qty}×
                                    </span>
                                    <span className="max-w-[160px] truncate font-medium text-foreground">
                                        {item.materialName}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search & Category Filter Toolbar */}
                <div className="p-4 border-b border-border/70 space-y-3 bg-muted/30">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder={t("searchPlaceholder")}
                                value={search}
                                onChange={e => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9 h-9 text-xs bg-background text-foreground placeholder:text-muted-foreground border-border/80 focus-visible:ring-amber-500"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setPage(1);
                                    }}
                                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-[11px] font-semibold text-foreground/80 mr-1 flex items-center gap-1 shrink-0">
                            <Filter className="size-3 text-muted-foreground" />
                            {t("category")}
                        </span>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setPage(1);
                                }}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                                    selectedCategory === cat
                                        ? "bg-amber-600 text-white shadow-xs font-semibold"
                                        : "bg-background border border-border text-foreground/80 hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                {cat === "ALL"
                                    ? t("all")
                                    : cat.replace(/_/g, " ")}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Material Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loadingMaterials ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : paginatedMaterials.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Boxes className="size-10 text-muted-foreground/50 mb-2" />
                            <p className="text-sm font-semibold text-foreground">
                                {t("noMaterialsFound")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t("adjustFilter")}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {paginatedMaterials.map(mat => {
                                const qty = selected.get(mat.id) || 0;
                                const isSelected = qty > 0;
                                const assignedCount =
                                    alreadyAssigned.find(
                                        a => a.materialId === mat.id,
                                    )?.qty || 0;

                                return (
                                    <div
                                        key={mat.id}
                                        onClick={() => toggleMaterial(mat.id)}
                                        className={`relative group cursor-pointer rounded-lg border-2 transition-all flex flex-col justify-between overflow-hidden ${
                                            isSelected
                                                ? "border-amber-600 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/40"
                                                : "border-border hover:border-amber-600/60 hover:bg-muted/40"
                                        }`}
                                    >
                                        {/* Image Container */}
                                        <div className="aspect-square relative overflow-hidden bg-muted/30">
                                            {mat.imageUrl ? (
                                                <Image
                                                    src={mat.imageUrl}
                                                    alt={mat.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Boxes className="size-10 text-muted-foreground/40" />
                                                </div>
                                            )}

                                            {/* Already Assigned Tag */}
                                            {assignedCount > 0 && (
                                                <div className="absolute top-1.5 left-1.5 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                                    {assignedCount} {t("out")}
                                                </div>
                                            )}

                                            {/* Selected Checkmark */}
                                            {isSelected && (
                                                <div className="absolute top-1.5 right-1.5 bg-amber-600 text-white rounded-full p-1 shadow-md">
                                                    <Check className="size-3.5 stroke-[3]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Material Info */}
                                        <div className="p-2.5 flex-1 flex flex-col justify-between bg-card">
                                            <div>
                                                <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">
                                                    {mat.name}
                                                </p>
                                                <p className="text-[11px] font-medium text-muted-foreground mt-1">
                                                    {t("stock")}{" "}
                                                    <span className="text-foreground font-semibold">
                                                        {mat.onHandQty ?? 0}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Quantity Controls (only show when selected) */}
                                            {isSelected && (
                                                <div
                                                    className="mt-2 flex items-center justify-between bg-background border border-border rounded-md shadow-xs p-0.5"
                                                    onClick={e =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                mat.id,
                                                                -1,
                                                            )
                                                        }
                                                        className="size-6 flex items-center justify-center hover:bg-muted rounded text-xs font-bold text-foreground"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="text-xs font-bold text-foreground px-1 text-center min-w-[20px]">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                mat.id,
                                                                1,
                                                            )
                                                        }
                                                        className="size-6 flex items-center justify-center hover:bg-muted rounded text-xs font-bold text-foreground"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/70 px-5 py-2.5 bg-muted/20 text-xs">
                        <span className="font-medium text-foreground/80">
                            {t("showingRange", {
                                start: (page - 1) * ITEMS_PER_PAGE + 1,
                                end: Math.min(
                                    page * ITEMS_PER_PAGE,
                                    filteredMaterials.length,
                                ),
                                total: filteredMaterials.length,
                            })}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="h-7 px-2.5 text-xs text-foreground font-medium"
                            >
                                <ChevronLeft className="size-3.5 mr-0.5" />
                                {t("prev")}
                            </Button>
                            <span className="px-2 font-semibold text-foreground">
                                {page} / {totalPages}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() =>
                                    setPage(p => Math.min(totalPages, p + 1))
                                }
                                className="h-7 px-2.5 text-xs text-foreground font-medium"
                            >
                                {t("next")}
                                <ChevronRight className="size-3.5 ml-0.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Optional Note */}
                {selected.size > 0 && (
                    <div className="border-t border-border/70 px-5 py-2.5 bg-muted/20">
                        <Input
                            placeholder={t("optionalNotePlaceholder")}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="text-xs h-8 bg-background text-foreground placeholder:text-muted-foreground border-border/80"
                        />
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/70 px-5 py-3 bg-card">
                    <div className="text-xs font-medium text-foreground/80">
                        {selected.size > 0 ? (
                            <span>
                                <span className="font-bold text-foreground">
                                    {totalSelectedUnits}
                                </span>{" "}
                                piece{totalSelectedUnits !== 1 ? "s" : ""} (
                                {selected.size} unique item
                                {selected.size !== 1 ? "s" : ""}) selected
                            </span>
                        ) : (
                            <span className="text-muted-foreground">
                                {t("clickToSelect")}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="h-8 text-xs text-foreground"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isLoading || selected.size === 0}
                            onClick={handleSubmit}
                            className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                    {t("assigning")}
                                </>
                            ) : (
                                t("assignAction")
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
