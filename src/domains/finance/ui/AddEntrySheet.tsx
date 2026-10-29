"use client";

import { useState } from "react";
import { Loader2, ReceiptText, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListBranchesQuery } from "@/context/services/branchesApi";
import {
    useCreateFinanceEntryMutation,
    useUpdateFinanceEntryMutation,
    type CreateFinanceEntryBody,
    type FinanceAudience,
    type FinanceCategory,
    type FinanceDirection,
    type FinanceEditableEntry,
    type FinanceSettledVia,
} from "../financeApi";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const SETTLED_VIA: FinanceSettledVia[] = ["CASH", "BANK", "TELEBIRR", "OTHER"];

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

export default function AddEntrySheet({
    audience,
    branchId,
    categories,
    defaultDirection = "EXPENSE",
    entry = null,
    onClose,
    onSuccess,
}: {
    audience: FinanceAudience;
    branchId?: string;
    categories: FinanceCategory[];
    defaultDirection?: FinanceDirection;
    entry?: FinanceEditableEntry | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const t = useTranslations("financeSummary");
    const isEditing = Boolean(entry);

    const [direction, setDirection] = useState<FinanceDirection>(
        entry?.direction ?? defaultDirection,
    );
    const [label, setLabel] = useState(entry?.label ?? "");
    const [amount, setAmount] = useState(
        entry ? String(Number(entry.amount)) : "",
    );
    const [businessDate, setBusinessDate] = useState(
        entry?.businessDate ?? todayIso(),
    );
    const [categoryId, setCategoryId] = useState(entry?.categoryId ?? "");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [settledVia, setSettledVia] = useState<FinanceSettledVia | "">(
        entry?.settledVia ?? "",
    );
    const [counterparty, setCounterparty] = useState(entry?.counterparty ?? "");
    const [note, setNote] = useState(entry?.note ?? "");
    const [selectedBranch, setSelectedBranch] = useState(
        branchId && branchId !== "all" ? branchId : "",
    );

    const { data: branchesData } = useListBranchesQuery();
    const [createEntry, { isLoading: isCreating }] =
        useCreateFinanceEntryMutation();
    const [updateEntry, { isLoading: isUpdating }] =
        useUpdateFinanceEntryMutation();
    const isPending = isCreating || isUpdating;

    const directionCategories = categories.filter(
        c => c.direction === direction,
    );

    const handleDirectionChange = (next: FinanceDirection) => {
        if (isEditing) return;
        setDirection(next);
        setCategoryId("");
        setNewCategoryName("");
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!label.trim()) {
            toast.error(t("errorRequired"));
            return;
        }
        const amountValue = Number(amount);
        if (!Number.isFinite(amountValue) || amountValue <= 0) {
            toast.error(t("errorAmount"));
            return;
        }

        const body: CreateFinanceEntryBody = {
            direction,
            label: label.trim(),
            amount: amountValue,
            ...(businessDate ? { businessDate } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(!categoryId && newCategoryName.trim()
                ? { newCategoryName: newCategoryName.trim() }
                : {}),
            ...(settledVia ? { settledVia } : {}),
            ...(counterparty.trim()
                ? { counterparty: counterparty.trim() }
                : {}),
            ...(note.trim() ? { note: note.trim() } : {}),
            ...(audience === "owner" && selectedBranch
                ? { branchId: selectedBranch }
                : {}),
        };

        try {
            if (entry) {
                await updateEntry({
                    audience,
                    id: entry.id,
                    body: { ...body, version: entry.version },
                }).unwrap();
                toast.success(t("updated"));
            } else {
                await createEntry({ audience, body }).unwrap();
                toast.success(t("created"));
            }
            onSuccess();
            onClose();
        } catch (err) {
            const message = (err as { data?: { message?: string } })?.data
                ?.message;
            toast.error(message || t("saveFailed"));
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-background shadow-2xl animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                            <ReceiptText className="size-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                {isEditing
                                    ? t("editEntry")
                                    : direction === "INCOME"
                                      ? t("addIncome")
                                      : t("addExpense")}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {t("eyebrow")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        title={t("close")}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t("fieldDirection")}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                disabled={isEditing}
                                onClick={() => handleDirectionChange("EXPENSE")}
                                className={cn(
                                    "rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all disabled:opacity-60",
                                    direction === "EXPENSE"
                                        ? "border-destructive bg-destructive/5 text-destructive"
                                        : "border-border text-foreground hover:bg-muted/30",
                                )}
                            >
                                {t("addExpense")}
                            </button>
                            <button
                                type="button"
                                disabled={isEditing}
                                onClick={() => handleDirectionChange("INCOME")}
                                className={cn(
                                    "rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all disabled:opacity-60",
                                    direction === "INCOME"
                                        ? "border-emerald-600 bg-emerald-600/5 text-emerald-700"
                                        : "border-border text-foreground hover:bg-muted/30",
                                )}
                            >
                                {t("addIncome")}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t("fieldLabel")}{" "}
                            <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            value={label}
                            maxLength={180}
                            placeholder={t("fieldLabelPlaceholder")}
                            onChange={e => setLabel(e.target.value)}
                            className="h-10"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                {t("fieldAmount")}{" "}
                                <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={amount}
                                placeholder="0.00"
                                onChange={e => setAmount(e.target.value)}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                {t("fieldDate")}
                            </label>
                            <Input
                                type="date"
                                value={businessDate}
                                onChange={e => setBusinessDate(e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                {t("fieldCategory")}
                            </label>
                            <select
                                value={categoryId}
                                onChange={e => {
                                    const value = e.target.value;
                                    setCategoryId(value);
                                    if (value) setNewCategoryName("");
                                }}
                                className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none"
                            >
                                <option value="">{t("uncategorised")}</option>
                                {directionCategories.map(category => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                {t("fieldNewCategory")}
                            </label>
                            <Input
                                value={newCategoryName}
                                maxLength={80}
                                placeholder={t("fieldNewCategoryPlaceholder")}
                                onChange={e => {
                                    const value = e.target.value;
                                    setNewCategoryName(value);
                                    if (value.trim()) setCategoryId("");
                                }}
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                {t("fieldSettledVia")}
                            </label>
                            <select
                                value={settledVia}
                                onChange={e =>
                                    setSettledVia(
                                        e.target.value as
                                            | FinanceSettledVia
                                            | "",
                                    )
                                }
                                className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none"
                            >
                                <option value="">—</option>
                                {SETTLED_VIA.map(item => (
                                    <option key={item} value={item}>
                                        {item === "CASH"
                                            ? t("settledCash")
                                            : item === "BANK"
                                              ? t("settledBank")
                                              : item === "TELEBIRR"
                                                ? t("settledTelebirr")
                                                : t("settledOther")}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                {t("fieldCounterparty")}
                            </label>
                            <Input
                                value={counterparty}
                                maxLength={160}
                                onChange={e => setCounterparty(e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    {audience === "owner" ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                {t("fieldBranch")}
                            </label>
                            <select
                                value={selectedBranch}
                                onChange={e =>
                                    setSelectedBranch(e.target.value)
                                }
                                className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none"
                            >
                                <option value="">—</option>
                                {(branchesData?.data ?? []).map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t("fieldNote")}
                        </label>
                        <textarea
                            value={note}
                            maxLength={500}
                            rows={3}
                            onChange={e => setNote(e.target.value)}
                            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-10"
                            onClick={onClose}
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-10 px-6"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    {t("saving")}
                                </>
                            ) : (
                                t("save")
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
