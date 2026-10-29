"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, AlertTriangle, X, Loader2, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useReturnMaterialsMutation,
    type OrderMaterialIssue,
    type MaterialCondition,
} from "@/context/services/outsideOrdersApi";
import { toast } from "@/lib/toast";
import { useTranslations } from "next-intl";

function parseQty(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (typeof val === "string") return parseFloat(val) || 0;
    if (typeof val === "object" && "s" in val && "e" in val && "d" in val) {
        const sign = val.s < 0 ? -1 : 1;
        const digits = (val.d || []).join("");
        const exp = typeof val.e === "number" ? val.e : 0;
        if (!digits) return 0;
        if (exp >= digits.length - 1) {
            return (
                sign * parseFloat(digits + "0".repeat(exp - digits.length + 1))
            );
        }
        return (
            sign *
            parseFloat(digits.slice(0, exp + 1) + "." + digits.slice(exp + 1))
        );
    }
    return Number(val) || 0;
}

interface LineReturnState {
    lineId: string;
    materialName: string;
    imageUrl?: string | null;
    qtyIssued: number;
    qtyReturned: number;
    condition: MaterialCondition;
    note: string;
}

export default function ReturnMaterialsModal({
    issue,
    onClose,
    onSuccess,
}: {
    issue: OrderMaterialIssue;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const t = useTranslations("returnMaterialsModal");

    const [lines, setLines] = useState<LineReturnState[]>(() =>
        issue.lines.map(line => {
            const issued = parseQty(line.qtyIssued);
            const returned = parseQty(line.qtyReturned);
            // Default to returning all items not yet returned
            const remainingToReturn = Math.max(0, issued - returned);
            return {
                lineId: line.id,
                materialName: line.materialNameSnapshot,
                imageUrl: line.material?.imageUrl,
                qtyIssued: issued,
                qtyReturned: remainingToReturn,
                condition: line.condition || "OK",
                note: line.note || "",
            };
        }),
    );
    const [generalNote, setGeneralNote] = useState("");

    const [returnMaterials, { isLoading }] = useReturnMaterialsMutation();

    function updateLine(lineId: string, patch: Partial<LineReturnState>) {
        setLines(prev =>
            prev.map(l => (l.lineId === lineId ? { ...l, ...patch } : l)),
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            await returnMaterials({
                issueId: issue.id,
                payload: {
                    note: generalNote.trim() || undefined,
                    lines: lines.map(l => ({
                        lineId: l.lineId,
                        qtyReturned: Math.max(0, l.qtyReturned),
                        condition: l.condition,
                        note: l.note.trim() || undefined,
                    })),
                },
            }).unwrap();

            toast.success(
                "Materials marked returned. Awaiting chef verification.",
            );
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(
                err?.data?.message || "Failed to record returned materials.",
            );
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-background p-4 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto shadow-2xl text-foreground">
                <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-500" />
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                {t("title")}
                            </h3>
                            <p className="text-[11px] text-muted-foreground font-medium">
                                {t("subtitle")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                    <div className="space-y-2">
                        {lines.map(line => {
                            const shortfall = Math.max(
                                0,
                                line.qtyIssued - line.qtyReturned,
                            );
                            return (
                                <div
                                    key={line.lineId}
                                    className="p-2.5 rounded-lg border border-border/70 bg-muted/20 space-y-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {line.imageUrl ? (
                                                <div className="size-8 rounded border border-border/70 overflow-hidden relative shrink-0">
                                                    <Image
                                                        src={line.imageUrl}
                                                        alt={line.materialName}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="size-8 rounded border border-border/70 bg-muted/40 flex items-center justify-center shrink-0">
                                                    <Boxes className="size-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                                                    {line.materialName}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground font-medium">
                                                    {t("issued")}{" "}
                                                    <span className="font-semibold text-foreground">
                                                        {line.qtyIssued}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {shortfall > 0 ? (
                                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded shrink-0">
                                                {t("shortfall", {
                                                    count: shortfall,
                                                })}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded shrink-0">
                                                {t("allReturned")}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-border/40">
                                        <div>
                                            <label className="text-[10px] font-semibold text-foreground/80 block mb-1">
                                                {t("qtyReturned")}
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateLine(
                                                            line.lineId,
                                                            {
                                                                qtyReturned:
                                                                    Math.max(
                                                                        0,
                                                                        line.qtyReturned -
                                                                            1,
                                                                    ),
                                                            },
                                                        )
                                                    }
                                                    className="size-6.5 rounded border border-border flex items-center justify-center hover:bg-muted text-xs font-bold text-foreground bg-background"
                                                >
                                                    −
                                                </button>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={line.qtyIssued}
                                                    value={line.qtyReturned}
                                                    onChange={e =>
                                                        updateLine(
                                                            line.lineId,
                                                            {
                                                                qtyReturned:
                                                                    Math.min(
                                                                        line.qtyIssued,
                                                                        Math.max(
                                                                            0,
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        ),
                                                                    ),
                                                            },
                                                        )
                                                    }
                                                    className="h-6.5 text-xs font-bold text-center w-14 px-1 bg-background text-foreground border-border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateLine(
                                                            line.lineId,
                                                            {
                                                                qtyReturned:
                                                                    Math.min(
                                                                        line.qtyIssued,
                                                                        line.qtyReturned +
                                                                            1,
                                                                    ),
                                                            },
                                                        )
                                                    }
                                                    className="size-6.5 rounded border border-border flex items-center justify-center hover:bg-muted text-xs font-bold text-foreground bg-background"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-semibold text-foreground/80 block mb-1">
                                                {t("condition")}
                                            </label>
                                            <select
                                                value={line.condition}
                                                onChange={e =>
                                                    updateLine(line.lineId, {
                                                        condition: e.target
                                                            .value as MaterialCondition,
                                                    })
                                                }
                                                className="w-full h-6.5 rounded border border-border bg-background px-1.5 text-xs text-foreground font-medium"
                                            >
                                                <option value="OK">
                                                    {t("condOk")}
                                                </option>
                                                <option value="DAMAGED">
                                                    {t("condDamaged")}
                                                </option>
                                                <option value="LOST">
                                                    {t("condLost")}
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground/80">
                            {t("returnNote")}
                        </label>
                        <Input
                            placeholder={t("notePlaceholder")}
                            value={generalNote}
                            onChange={e => setGeneralNote(e.target.value)}
                            className="h-8 text-xs bg-background text-foreground border-border placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="h-7.5 px-3 text-xs text-foreground"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isLoading}
                            className="h-7.5 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                    {t("submitting")}
                                </>
                            ) : (
                                t("confirmReturn")
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
