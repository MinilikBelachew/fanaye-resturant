"use client";

import { useState } from "react";
import { Loader2, Plus, Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useCreateFinanceCategoryMutation,
    useUpdateFinanceCategoryMutation,
    type FinanceAudience,
    type FinanceCategory,
    type FinanceDirection,
    type FinanceCategoryStatus,
} from "../financeApi";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const DIRECTIONS: FinanceDirection[] = ["INCOME", "EXPENSE"];

export default function FinanceCategoryManager({
    audience,
    categories,
    onClose,
}: {
    audience: FinanceAudience;
    categories: FinanceCategory[];
    onClose: () => void;
}) {
    const t = useTranslations("financeSummary");

    const [newDirection, setNewDirection] =
        useState<FinanceDirection>("INCOME");
    const [newName, setNewName] = useState("");
    const [newAmharicName, setNewAmharicName] = useState("");
    const [newSortOrder, setNewSortOrder] = useState("");

    const [nameEdits, setNameEdits] = useState<Record<string, string>>({});
    const [savingId, setSavingId] = useState<string | null>(null);

    const [createCategory, { isLoading: isCreating }] =
        useCreateFinanceCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] =
        useUpdateFinanceCategoryMutation();

    const directionLabel = (value: FinanceDirection) =>
        value === "INCOME" ? t("categoryIncome") : t("categoryExpense");

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) {
            toast.error(t("errorRequired"));
            return;
        }
        const sortOrderValue = Number(newSortOrder);

        try {
            await createCategory({
                audience,
                body: {
                    direction: newDirection,
                    name: newName.trim(),
                    ...(newAmharicName.trim()
                        ? { amharicName: newAmharicName.trim() }
                        : {}),
                    ...(Number.isFinite(sortOrderValue) && newSortOrder !== ""
                        ? { sortOrder: sortOrderValue }
                        : {}),
                },
            }).unwrap();
            toast.success(t("categoryCreated"));
            setNewName("");
            setNewAmharicName("");
            setNewSortOrder("");
        } catch (err) {
            const message = (err as { data?: { message?: string } })?.data
                ?.message;
            toast.error(message || t("saveFailed"));
        }
    }

    async function handleRename(category: FinanceCategory) {
        const nextName = (nameEdits[category.id] ?? category.name).trim();
        if (!nextName) {
            toast.error(t("errorRequired"));
            return;
        }
        if (nextName === category.name) return;

        setSavingId(category.id);
        try {
            await updateCategory({
                audience,
                id: category.id,
                body: { name: nextName },
            }).unwrap();
            toast.success(t("categoryUpdated"));
            setNameEdits(prev => {
                const next = { ...prev };
                delete next[category.id];
                return next;
            });
        } catch (err) {
            const message = (err as { data?: { message?: string } })?.data
                ?.message;
            toast.error(message || t("saveFailed"));
        } finally {
            setSavingId(null);
        }
    }

    async function handleToggleStatus(category: FinanceCategory) {
        const nextStatus: FinanceCategoryStatus =
            category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

        setSavingId(category.id);
        try {
            await updateCategory({
                audience,
                id: category.id,
                body: { status: nextStatus },
            }).unwrap();
            toast.success(t("categoryUpdated"));
        } catch (err) {
            const message = (err as { data?: { message?: string } })?.data
                ?.message;
            toast.error(message || t("saveFailed"));
        } finally {
            setSavingId(null);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-background shadow-2xl animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                            <Tag className="size-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                {t("manageCategories")}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {t("category")}
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

                <form
                    onSubmit={handleAdd}
                    className="grid grid-cols-1 gap-3 border-b px-6 py-4 sm:grid-cols-12"
                >
                    <div className="space-y-1 sm:col-span-3">
                        <label className="text-xs font-medium text-foreground">
                            {t("fieldDirection")}
                        </label>
                        <select
                            value={newDirection}
                            onChange={e =>
                                setNewDirection(
                                    e.target.value as FinanceDirection,
                                )
                            }
                            className="h-9 w-full rounded-lg border border-border/60 bg-background px-2.5 text-sm text-foreground focus:outline-none"
                        >
                            {DIRECTIONS.map(item => (
                                <option key={item} value={item}>
                                    {directionLabel(item)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1 sm:col-span-4">
                        <label className="text-xs font-medium text-foreground">
                            {t("fieldName")}
                        </label>
                        <Input
                            value={newName}
                            maxLength={80}
                            onChange={e => setNewName(e.target.value)}
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1 sm:col-span-3">
                        <label className="text-xs font-medium text-foreground">
                            {t("fieldAmharicName")}
                        </label>
                        <Input
                            value={newAmharicName}
                            maxLength={80}
                            onChange={e => setNewAmharicName(e.target.value)}
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-medium text-foreground">
                            {t("fieldSortOrder")}
                        </label>
                        <Input
                            type="number"
                            value={newSortOrder}
                            onChange={e => setNewSortOrder(e.target.value)}
                            className="h-9"
                        />
                    </div>
                    <div className="sm:col-span-12">
                        <Button
                            type="submit"
                            size="sm"
                            className="h-9 rounded-full text-[12px]"
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Plus className="size-3.5" />
                            )}
                            {t("addCategory")}
                        </Button>
                    </div>
                </form>

                <div className="space-y-5 p-6">
                    {DIRECTIONS.map(direction => {
                        const group = categories.filter(
                            c => c.direction === direction,
                        );
                        return (
                            <div key={direction} className="space-y-2">
                                <h4 className="text-[12px] font-medium uppercase tracking-[0.07em] text-slate-gray">
                                    {directionLabel(direction)}
                                </h4>
                                {group.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-[13px] text-slate-gray">
                                        {t("empty")}
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-hairline rounded-xl border border-hairline">
                                        {group.map(category => {
                                            const draft =
                                                nameEdits[category.id] ??
                                                category.name;
                                            const isActive =
                                                category.status === "ACTIVE";
                                            const isSaving =
                                                savingId === category.id;
                                            return (
                                                <li
                                                    key={category.id}
                                                    className="flex items-center gap-2 px-3 py-2.5"
                                                >
                                                    <Input
                                                        value={draft}
                                                        maxLength={80}
                                                        onChange={e =>
                                                            setNameEdits(
                                                                prev => ({
                                                                    ...prev,
                                                                    [category.id]:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        className="h-8 flex-1 text-[13px]"
                                                    />
                                                    <Badge
                                                        variant={
                                                            isActive
                                                                ? "success"
                                                                : "secondary"
                                                        }
                                                        className="rounded-full"
                                                    >
                                                        {isActive
                                                            ? t("statusActive")
                                                            : t(
                                                                  "statusInactive",
                                                              )}
                                                    </Badge>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 rounded-full text-[12px]"
                                                        disabled={
                                                            isSaving ||
                                                            isUpdating
                                                        }
                                                        onClick={() =>
                                                            handleRename(
                                                                category,
                                                            )
                                                        }
                                                    >
                                                        {isSaving ? (
                                                            <Loader2 className="size-3.5 animate-spin" />
                                                        ) : null}
                                                        {t("save")}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 rounded-full text-[12px]",
                                                            isActive &&
                                                                "text-destructive",
                                                        )}
                                                        disabled={
                                                            isSaving ||
                                                            isUpdating
                                                        }
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                category,
                                                            )
                                                        }
                                                    >
                                                        {isActive
                                                            ? t(
                                                                  "statusInactive",
                                                              )
                                                            : t("statusActive")}
                                                    </Button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
