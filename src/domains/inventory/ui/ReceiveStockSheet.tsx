"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
    ArrowDownToLine,
    Image as ImageIcon,
    Loader2,
    Phone,
    Plus,
    Receipt,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";
import {
    useCreateVendorMutation,
    useListInventoryIngredientsQuery,
    useListInventoryLocationsQuery,
    useListVendorsQuery,
    useReceiveInventoryStockBatchMutation,
} from "@/context/services/inventoryApi";
import { useUploadMenuImageMutation } from "@/context/services/menuApi";
import { InventoryNiceSelect } from "@/domains/inventory/ui/InventoryFormControls";
import { UnitPicker } from "@/domains/inventory/ui/UnitPicker";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

export interface ReceiveStockSheetProps {
    open: boolean;
    onClose: () => void;
    locationId?: string;
    stockTargetName?: string;
    ingredients?: Array<{
        id: string;
        name: string;
        unit: string;
        unitCost?: number;
        imageUrl?: string | null;
        itemKind?: string;
    }>;
    onSuccess?: () => void;
}

type ReceiveLine = {
    id: string;
    ingredientId: string;
    quantity: string;
    unit: string;
    unitCost: string;
};

function mkLine(): ReceiveLine {
    return {
        id: `${Date.now()}-${Math.random()}`,
        ingredientId: "",
        quantity: "",
        unit: "",
        unitCost: "",
    };
}

export function ReceiveStockSheet({
    open,
    onClose,
    locationId,
    stockTargetName,
    ingredients,
    onSuccess,
}: ReceiveStockSheetProps) {
    const t = useTranslations("inventory");
    const [receiveStockBatch, { isLoading: isSubmitting }] =
        useReceiveInventoryStockBatchMutation();
    const [uploadImage, { isLoading: isUploadingReceipt }] =
        useUploadMenuImageMutation();

    const { data: locationsRes } = useListInventoryLocationsQuery(undefined, {
        skip: !open || Boolean(locationId),
    });
    const targetLocationId = locationId || locationsRes?.data?.[0]?.id;

    const fallbackQuery = useListInventoryIngredientsQuery(
        { page: 1, limit: 300 },
        { skip: !open || (ingredients != null && ingredients.length > 0) },
    );
    const resolvedIngredients = useMemo(() => {
        if (ingredients && ingredients.length > 0) return ingredients;
        return (fallbackQuery.data?.data ?? []).map(i => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
            unitCost: i.unitCost,
            imageUrl: i.imageUrl,
            itemKind: i.itemKind,
        }));
    }, [ingredients, fallbackQuery.data]);

    const fileInputId = useId();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const isSubmittingRef = useRef(false);

    // Vendors
    const { data: vendorsRes } = useListVendorsQuery(
        { page: 1, limit: 100 },
        { skip: !open },
    );
    const [createVendor, { isLoading: isCreatingVendor }] =
        useCreateVendorMutation();
    const activeVendors = useMemo(
        () => (vendorsRes?.data ?? []).filter(v => v.status === "ACTIVE"),
        [vendorsRes?.data],
    );

    // Header-level state
    const [vendorId, setVendorId] = useState("");
    const [vendorFormOpen, setVendorFormOpen] = useState(false);
    const [vendorForm, setVendorForm] = useState({
        type: "FARM",
        name: "",
        phone: "",
    });
    const [invoiceRef, setInvoiceRef] = useState("");
    const [note, setNote] = useState("");
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [previewReceiptOpen, setPreviewReceiptOpen] = useState(false);
    const [triedSubmit, setTriedSubmit] = useState(false);

    // Line items state
    const [lines, setLines] = useState<ReceiveLine[]>([mkLine()]);

    const selectedVendor = useMemo(
        () => activeVendors.find(v => v.id === vendorId) ?? null,
        [activeVendors, vendorId],
    );

    // Reset form when opened
    useEffect(() => {
        if (!open) return;
        setVendorId("");
        setVendorFormOpen(false);
        setVendorForm({ type: "FARM", name: "", phone: "" });
        setInvoiceRef("");
        setNote("");
        setReceiptUrl(null);
        setTriedSubmit(false);
        setPreviewReceiptOpen(false);
        setLines([mkLine()]);
    }, [open]);

    // Handle Escape key to close
    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    // Receipt upload handler
    async function handleReceiptFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (
            !file.type.startsWith("image/") &&
            file.type !== "application/pdf"
        ) {
            toast.error("Please upload a receipt image (JPG, PNG, WEBP).");
            return;
        }
        try {
            const res = await uploadImage(file).unwrap();
            const rawPath = res?.file?.path || "";
            const normalizedPath = rawPath.replace(/\\/g, "/");
            if (normalizedPath) {
                setReceiptUrl(normalizedPath);
                toast.success("Receipt photo uploaded successfully");
            }
        } catch {
            toast.error("Could not upload receipt image. Please try again.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    // Line item helpers
    function updateLine(id: string, patch: Partial<ReceiveLine>) {
        setLines(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
    }

    function handleIngredientChange(lineId: string, ingId: string) {
        const item = resolvedIngredients.find(i => i.id === ingId);
        setLines(prev =>
            prev.map(l =>
                l.id === lineId
                    ? {
                          ...l,
                          ingredientId: ingId,
                          unit: item?.unit ?? "",
                          unitCost:
                              item?.unitCost &&
                              Number(item.unitCost) > 0 &&
                              !l.unitCost
                                  ? String(item.unitCost)
                                  : l.unitCost,
                      }
                    : l,
            ),
        );
    }

    function addLine() {
        setLines(prev => [...prev, mkLine()]);
    }

    function removeLine(id: string) {
        setLines(prev =>
            prev.length > 1 ? prev.filter(l => l.id !== id) : prev,
        );
    }

    // Totals
    const validLines = lines.filter(
        l => l.ingredientId && parseFloat(l.quantity) > 0,
    );
    const invoiceTotal = lines.reduce((sum, l) => {
        const q = parseFloat(l.quantity) || 0;
        const c = parseFloat(l.unitCost) || 0;
        return sum + q * c;
    }, 0);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setTriedSubmit(true);

        if (isSubmitting || isSubmittingRef.current) return;

        if (!vendorId) {
            toast.error(t("errPickVendor") || "Please choose a vendor");
            return;
        }
        if (validLines.length === 0) {
            toast.error(
                t("errAtLeastOneItem") ||
                    "Add at least one item with a valid quantity",
            );
            return;
        }

        isSubmittingRef.current = true;
        try {
            await receiveStockBatch({
                vendorId: vendorId || undefined,
                locationId: targetLocationId || undefined,
                invoiceRef: invoiceRef.trim() || undefined,
                note: note.trim() || undefined,
                receiptUrl: receiptUrl || undefined,
                items: validLines.map(l => ({
                    ingredientId: l.ingredientId,
                    quantity: parseFloat(l.quantity),
                    unit: l.unit || undefined,
                    unitCost:
                        parseFloat(l.unitCost) > 0
                            ? parseFloat(l.unitCost)
                            : undefined,
                })),
            }).unwrap();

            toast.success(
                t("toastStockReceived") || "Stock received successfully!",
            );
            onSuccess?.();
            onClose();
        } catch (err: unknown) {
            const errAny = err as {
                data?: { message?: unknown };
                message?: string;
            };
            const rawMsg = errAny?.data?.message || errAny?.message;
            const message = Array.isArray(rawMsg)
                ? rawMsg.join(", ")
                : typeof rawMsg === "string"
                  ? rawMsg
                  : t("errReceive") || "Failed to receive stock delivery.";
            toast.error(message);
        } finally {
            isSubmittingRef.current = false;
        }
    }

    async function handleCreateVendor(e?: React.FormEvent | React.MouseEvent) {
        if (e) e.preventDefault();
        const trimmedName = vendorForm.name.trim();
        if (!trimmedName) return;
        try {
            const res = await createVendor({
                type: vendorForm.type,
                name: trimmedName,
                phone: vendorForm.phone.trim() || undefined,
            }).unwrap();
            const created = res?.data ?? res;
            if (created?.id) {
                setVendorId(created.id);
            }
            setVendorFormOpen(false);
            setVendorForm({ type: "FARM", name: "", phone: "" });
            toast.success(t("vendorsToastCreated") || "Vendor created");
        } catch (err) {
            toast.fromUnknown(
                err,
                t("vendorsErrSave") || "Could not save vendor.",
            );
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            {/* Backdrop click to dismiss */}
            <div className="flex-1" onClick={onClose} />

            {/* Slide-over Sheet Panel */}
            <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-hairline bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-hairline px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                            <ArrowDownToLine className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
                                {t("receiveSheetTitle")}
                            </h2>
                            <p className="text-[12px] text-slate-gray">
                                {stockTargetName
                                    ? t("receiveSummarySub", {
                                          name: stockTargetName,
                                      })
                                    : t("receiveSheetSubtitle")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-gray transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Form Content */}
                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="app-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
                        {/* ── SECTION: Vendor ── */}
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-foreground">
                                {t("fieldVendor")}{" "}
                                <span className="text-rose-500">*</span>
                            </label>
                            <InventoryNiceSelect
                                value={vendorId}
                                placeholder={t("chooseVendor")}
                                options={activeVendors.map(v => ({
                                    value: v.id,
                                    label: v.name,
                                    hint:
                                        v.type === "FARM"
                                            ? t("vendorsTypeFarm")
                                            : v.type === "NEGADE"
                                              ? t("vendorsTypeNegade")
                                              : t("vendorsTypeOther"),
                                }))}
                                onChange={setVendorId}
                                error={
                                    triedSubmit && !vendorId
                                        ? t("errPickVendor")
                                        : undefined
                                }
                            />
                            {selectedVendor ? (
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-gray">
                                    <span
                                        className={cn(
                                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                            selectedVendor.type === "FARM"
                                                ? "bg-emerald-500/10 text-emerald-600"
                                                : selectedVendor.type ===
                                                    "NEGADE"
                                                  ? "bg-blue-500/10 text-blue-600"
                                                  : "bg-slate-gray/10 text-slate-gray",
                                        )}
                                    >
                                        {selectedVendor.type === "FARM"
                                            ? t("vendorsTypeFarm")
                                            : selectedVendor.type === "NEGADE"
                                              ? t("vendorsTypeNegade")
                                              : t("vendorsTypeOther")}
                                    </span>
                                    {selectedVendor.phone ? (
                                        <span className="flex items-center gap-1">
                                            <Phone className="size-3" />
                                            {selectedVendor.phone}
                                        </span>
                                    ) : null}
                                </div>
                            ) : null}

                            {vendorFormOpen ? (
                                <div
                                    onKeyDown={e => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleCreateVendor();
                                        }
                                    }}
                                    className="space-y-2.5 rounded-xl border border-hairline bg-card/50 p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-semibold">
                                            {t("vendorQuickCreate")}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setVendorFormOpen(false)
                                            }
                                            className="text-[11px] text-slate-gray hover:text-foreground"
                                        >
                                            {t("cancelConfirm")}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1 text-[11px]">
                                            <span className="font-medium text-slate-gray">
                                                {t("vendorsFieldType")}
                                            </span>
                                            <InventoryNiceSelect
                                                value={vendorForm.type}
                                                placeholder=""
                                                options={[
                                                    {
                                                        value: "FARM",
                                                        label: t(
                                                            "vendorsTypeFarm",
                                                        ),
                                                    },
                                                    {
                                                        value: "NEGADE",
                                                        label: t(
                                                            "vendorsTypeNegade",
                                                        ),
                                                    },
                                                    {
                                                        value: "OTHER",
                                                        label: t(
                                                            "vendorsTypeOther",
                                                        ),
                                                    },
                                                ]}
                                                onChange={v =>
                                                    setVendorForm(f => ({
                                                        ...f,
                                                        type: v,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-1 text-[11px]">
                                            <span className="font-medium text-slate-gray">
                                                {t("vendorsFieldName")} *
                                            </span>
                                            <input
                                                type="text"
                                                value={vendorForm.name}
                                                onChange={e =>
                                                    setVendorForm(f => ({
                                                        ...f,
                                                        name: e.target.value,
                                                    }))
                                                }
                                                placeholder={t(
                                                    "vendorsNamePlaceholder",
                                                )}
                                                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1 text-[11px]">
                                            <span className="font-medium text-slate-gray">
                                                {t("vendorsFieldPhone")}
                                            </span>
                                            <input
                                                type="tel"
                                                value={vendorForm.phone}
                                                onChange={e =>
                                                    setVendorForm(f => ({
                                                        ...f,
                                                        phone: e.target.value,
                                                    }))
                                                }
                                                placeholder="+251 9..."
                                                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleCreateVendor}
                                            disabled={
                                                isCreatingVendor ||
                                                !vendorForm.name.trim()
                                            }
                                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            {isCreatingVendor ? (
                                                <Loader2 className="size-3.5 animate-spin" />
                                            ) : (
                                                <Plus className="size-3.5" />
                                            )}
                                            {t("vendorCreate")}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setVendorFormOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-hairline px-3 py-2 text-[12px] font-medium text-emerald-600 hover:border-emerald-400 hover:bg-emerald-500/5 transition-all"
                                >
                                    <Plus className="size-3.5" />
                                    {t("vendorAddNew")}
                                </button>
                            )}
                        </div>

                        {/* ── SECTION: Invoice ref & note (compact row) ── */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-foreground">
                                    {t("fieldInvoiceRef")}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t(
                                        "fieldInvoiceRefPlaceholder",
                                    )}
                                    value={invoiceRef}
                                    onChange={e =>
                                        setInvoiceRef(e.target.value)
                                    }
                                    maxLength={80}
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-foreground">
                                    {t("fieldInternalNote")}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t(
                                        "fieldInternalNotePlaceholder",
                                    )}
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    maxLength={200}
                                    className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* ── SECTION: Receipt photo ── */}
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
                                <Receipt className="size-3.5 text-slate-gray" />
                                <span>{t("fieldReceiptPhoto")}</span>
                            </label>

                            <input
                                id={fileInputId}
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleReceiptFile}
                            />

                            {receiptUrl ? (
                                <div className="flex items-center gap-3 rounded-xl border border-hairline bg-secondary/30 p-3">
                                    <img
                                        src={receiptUrl}
                                        alt="Receipt attachment"
                                        onClick={() =>
                                            setPreviewReceiptOpen(true)
                                        }
                                        className="size-14 rounded-lg object-cover border border-hairline cursor-pointer hover:opacity-90"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12px] font-medium text-foreground truncate">
                                            {t("receiptPreview")}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPreviewReceiptOpen(true)
                                            }
                                            className="text-[11px] font-medium text-emerald-600 hover:underline"
                                        >
                                            {t("receiptViewFull")}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            disabled={isUploadingReceipt}
                                            className="rounded-lg border border-hairline bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-secondary"
                                        >
                                            {t("receiptUploadPrompt")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReceiptUrl(null)}
                                            className="rounded-lg p-1.5 text-slate-gray hover:bg-rose-500/10 hover:text-rose-600"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-hairline bg-card/60 px-4 py-3 transition-colors hover:border-emerald-500/40 hover:bg-card"
                                >
                                    {isUploadingReceipt ? (
                                        <Loader2 className="size-4 animate-spin text-emerald-600" />
                                    ) : (
                                        <UploadCloud className="size-4 text-slate-gray" />
                                    )}
                                    <span className="text-[12px] text-slate-gray">
                                        {isUploadingReceipt
                                            ? t("receiptUploading")
                                            : t("receiptUploadPrompt")}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* ── SECTION: Line Items ── */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] font-semibold text-foreground">
                                    {t("fieldIngredient")}{" "}
                                    <span className="text-rose-500">*</span>
                                </span>
                                <span className="text-[11px] text-slate-gray">
                                    {validLines.length} / {lines.length}{" "}
                                    {t("receiveItemsLabel") || "items"}
                                </span>
                            </div>

                            {lines.map((line, idx) => {
                                const selectedIng =
                                    resolvedIngredients.find(
                                        i => i.id === line.ingredientId,
                                    ) ?? null;
                                const numQty = parseFloat(line.quantity) || 0;
                                const numCost = parseFloat(line.unitCost) || 0;
                                const lineTotal =
                                    numQty > 0 && numCost > 0
                                        ? numQty * numCost
                                        : 0;

                                return (
                                    <div
                                        key={line.id}
                                        className="rounded-xl border border-hairline bg-card/40 p-3 space-y-2.5"
                                    >
                                        {/* Row header: index + remove */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-slate-gray">
                                                #{idx + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeLine(line.id)
                                                }
                                                disabled={lines.length === 1}
                                                className="rounded-lg p-1 text-slate-gray hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-30"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>

                                        {/* Ingredient picker */}
                                        <InventoryNiceSelect
                                            value={line.ingredientId}
                                            placeholder={t("chooseIngredient")}
                                            options={resolvedIngredients.map(
                                                i => ({
                                                    value: i.id,
                                                    label: `${i.name} (${i.unit})`,
                                                    hint: i.unitCost
                                                        ? `${Number(i.unitCost).toFixed(2)} ETB`
                                                        : undefined,
                                                }),
                                            )}
                                            onChange={id =>
                                                handleIngredientChange(
                                                    line.id,
                                                    id,
                                                )
                                            }
                                            error={
                                                triedSubmit &&
                                                !line.ingredientId
                                                    ? t("errPickIngredient")
                                                    : undefined
                                            }
                                        />

                                        {/* Selected ingredient preview */}
                                        {selectedIng ? (
                                            <div className="flex items-center gap-2 rounded-lg border border-hairline bg-secondary/20 px-2.5 py-1.5 text-[11px]">
                                                {selectedIng.imageUrl ? (
                                                    <img
                                                        src={
                                                            selectedIng.imageUrl
                                                        }
                                                        alt={selectedIng.name}
                                                        className="size-7 rounded object-cover border border-hairline"
                                                    />
                                                ) : (
                                                    <div className="flex size-7 items-center justify-center rounded bg-secondary text-slate-gray">
                                                        <ImageIcon className="size-3.5" />
                                                    </div>
                                                )}
                                                <span className="font-medium text-foreground truncate">
                                                    {selectedIng.name}
                                                </span>
                                                <span className="ml-auto text-slate-gray font-mono">
                                                    {selectedIng.unit}
                                                </span>
                                                {selectedIng.itemKind ? (
                                                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase font-mono">
                                                        {selectedIng.itemKind}
                                                    </span>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        {/* Qty + Unit Cost */}
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-semibold text-foreground">
                                                    {t("fieldQuantity")}{" "}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        min="0.0001"
                                                        placeholder="0.00"
                                                        value={line.quantity}
                                                        onChange={e =>
                                                            updateLine(
                                                                line.id,
                                                                {
                                                                    quantity:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        className={cn(
                                                            "h-10 min-w-0 flex-1 rounded-xl border border-hairline bg-background px-3 text-[13px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                                                            triedSubmit &&
                                                                line.ingredientId &&
                                                                numQty <= 0 &&
                                                                "border-rose-500",
                                                        )}
                                                    />
                                                    <div className="w-24 shrink-0">
                                                        <UnitPicker
                                                            compact
                                                            className="h-10 w-full rounded-xl"
                                                            baseUnit={
                                                                selectedIng?.unit ??
                                                                ""
                                                            }
                                                            value={
                                                                line.unit ||
                                                                selectedIng?.unit ||
                                                                ""
                                                            }
                                                            onChange={u =>
                                                                updateLine(
                                                                    line.id,
                                                                    { unit: u },
                                                                )
                                                            }
                                                            disabled={
                                                                !selectedIng
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-[11px] font-semibold text-foreground">
                                                    {t("fieldUnitCostOptional")}
                                                </span>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        min="0"
                                                        placeholder="0.00"
                                                        value={line.unitCost}
                                                        onChange={e =>
                                                            updateLine(
                                                                line.id,
                                                                {
                                                                    unitCost:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 pr-12 text-[13px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-slate-gray">
                                                        ETB
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Line subtotal */}
                                        {lineTotal > 0 ? (
                                            <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[11px]">
                                                <span className="text-slate-gray">
                                                    {numQty}{" "}
                                                    {line.unit ||
                                                        selectedIng?.unit}{" "}
                                                    × {numCost.toFixed(2)} ETB
                                                </span>
                                                <span className="font-mono font-semibold text-foreground">
                                                    {lineTotal.toLocaleString(
                                                        "en-US",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        },
                                                    )}{" "}
                                                    ETB
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}

                            {/* Add another item */}
                            <button
                                type="button"
                                onClick={addLine}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-hairline py-3 text-[12px] font-medium text-emerald-600 hover:border-emerald-400 hover:bg-emerald-500/5 transition-all"
                            >
                                <Plus className="size-4" />
                                {t("receiveAddItem") || "+ Add another item"}
                            </button>
                        </div>

                        {/* ── SUMMARY BANNER ── */}
                        {invoiceTotal > 0 ? (
                            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-[12px]">
                                <div>
                                    <span className="font-semibold text-foreground">
                                        {validLines.length}{" "}
                                        {t("receiveItemsLabel") || "items"}
                                    </span>
                                    <span className="ml-1 text-slate-gray">
                                        {t("receiveLineTotal") || "total"}
                                    </span>
                                </div>
                                <span className="font-mono text-[15px] font-bold text-foreground">
                                    {invoiceTotal.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{" "}
                                    ETB
                                </span>
                            </div>
                        ) : null}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-3 border-t border-hairline px-6 py-4 bg-background">
                        <span className="text-[11px] text-slate-gray">
                            {validLines.length > 0
                                ? `${validLines.length} ${t("receiveItemsLabel") || "items"} ready`
                                : ""}
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="h-10 rounded-xl border border-hairline px-4 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground"
                            >
                                {t("cancelConfirm")}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || isUploadingReceipt}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <ArrowDownToLine className="size-4" />
                                )}
                                {isSubmitting
                                    ? t("receivingAction")
                                    : validLines.length > 1
                                      ? `${t("receiveStock")} (${validLines.length})`
                                      : t("receiveStock")}
                            </button>
                        </div>
                    </div>
                </form>
            </aside>

            {/* Receipt Image Preview Modal */}
            {previewReceiptOpen && receiptUrl ? (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setPreviewReceiptOpen(false)}
                >
                    <div
                        className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-background border border-hairline p-2 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
                            <span className="text-[13px] font-semibold text-foreground">
                                {t("receiptPhotoModalTitle")}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreviewReceiptOpen(false)}
                                className="rounded-full p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <img
                            src={receiptUrl}
                            alt="Receipt preview"
                            className="max-h-[82vh] w-full rounded-xl object-contain"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

/**
 * Utility to parse structured receive metadata from supplierNote and note.
 */
export function parseReceiveDetails(
    supplierNote?: string | null,
    note?: string | null,
) {
    let source: "FARM" | "NEGADE" | "OTHER" = "OTHER";
    let cleanSupplier = supplierNote || "";

    if (supplierNote?.startsWith("[FARM]")) {
        source = "FARM";
        cleanSupplier = supplierNote.replace("[FARM]", "").trim();
    } else if (supplierNote?.startsWith("[NEGADE]")) {
        source = "NEGADE";
        cleanSupplier = supplierNote.replace("[NEGADE]", "").trim();
    }

    let receiptUrl: string | null = null;
    let cleanNote = note || "";
    const match = note?.match(/\[receipt:\s*([^\]\s]+)\]/i);
    if (match) {
        receiptUrl = match[1].replace(/\\/g, "/");
        cleanNote = note?.replace(match[0], "").trim() || "";
    }

    return { source, cleanSupplier, receiptUrl, cleanNote };
}
