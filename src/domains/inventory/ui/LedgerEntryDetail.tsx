"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { useGetInventoryLedgerEntryQuery } from "@/context/services/inventoryApi";
import { Link } from "@/i18n/navigation";
import { formatEtb, formatQty } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LedgerEntryDetail({
    params,
    backHref,
}: {
    params: Promise<{ id: string }>;
    backHref: string;
}) {
    const { id } = use(params);
    const t = useTranslations("inventory");
    const { data, isLoading, isError } = useGetInventoryLedgerEntryQuery(id);
    const entry = data?.data;

    function typeLabel(type: string) {
        const key = `ledgerTypes.${type}`;
        return t.has(key) ? t(key) : type;
    }

    function typeHint(type: string) {
        const key = `ledgerTypeHints.${type}`;
        return t.has(key) ? t(key) : null;
    }

    const unitCost = entry
        ? (entry.unitCost ?? entry.unitCostSnapshot ?? 0)
        : 0;
    const lineValue = entry
        ? (entry.lineValue ?? entry.quantityDelta * unitCost)
        : 0;

    return (
        <DashboardFrame>
            <div className="mb-4">
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-1.5 text-[13px] text-slate-gray hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    {t("backToLedger")}
                </Link>
            </div>
            <PageHeader
                compact
                title={
                    entry ? typeLabel(entry.entryType) : t("ledgerDetailTitle")
                }
                description={
                    entry
                        ? (typeHint(entry.entryType) ?? t("ledgerDetailHint"))
                        : t("ledgerDetailHint")
                }
            />

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="size-6 animate-spin text-slate-gray" />
                </div>
            ) : isError || !entry ? (
                <p className="rounded-2xl border border-hairline px-4 py-10 text-center text-[13px] text-slate-gray">
                    {t("ledgerDetailMissing")}
                </p>
            ) : (
                <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                    <section className="space-y-4 rounded-2xl border border-hairline bg-card p-5">
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <Detail
                                label={t("colWhen")}
                                value={new Date(
                                    entry.createdAt,
                                ).toLocaleString()}
                            />
                            <Detail
                                label={t("colType")}
                                value={typeLabel(entry.entryType)}
                            />
                            <Detail
                                label={t("colIngredient")}
                                value={`${entry.ingredient.name} (${entry.ingredient.unit})`}
                            />
                            <Detail
                                label={t("colDelta")}
                                value={`${entry.quantityDelta > 0 ? "+" : ""}${formatQty(entry.quantityDelta)} ${entry.ingredient.unit}`}
                                mono
                            />
                            <Detail
                                label={t("colCost")}
                                value={formatEtb(unitCost)}
                                mono
                            />
                            <Detail
                                label={t("lineValue")}
                                value={formatEtb(lineValue)}
                                mono
                                className={
                                    lineValue < 0
                                        ? "text-destructive"
                                        : undefined
                                }
                            />
                            <Detail
                                label={t("colStore")}
                                value={
                                    entry.location
                                        ? `${entry.location.name}${
                                              entry.location.branchName
                                                  ? ` · ${entry.location.branchName}`
                                                  : ""
                                          }`
                                        : "—"
                                }
                            />
                            <Detail
                                label={t("colRecordedBy")}
                                value={entry.createdByName || "—"}
                            />
                        </dl>

                        {(entry.note ||
                            entry.supplierNote ||
                            entry.invoiceRef) && (
                            <div className="space-y-3 border-t border-hairline pt-4">
                                {entry.note ? (
                                    <Detail
                                        label={t("colNote")}
                                        value={entry.note}
                                    />
                                ) : null}
                                {entry.supplierNote ? (
                                    <Detail
                                        label={t("fieldSupplierNote")}
                                        value={entry.supplierNote}
                                    />
                                ) : null}
                                {entry.invoiceRef ? (
                                    <Detail
                                        label={t("fieldInvoiceRef")}
                                        value={entry.invoiceRef}
                                    />
                                ) : null}
                            </div>
                        )}
                    </section>

                    <aside className="space-y-3 rounded-2xl border border-hairline bg-card p-5">
                        <p className="text-[12px] font-medium text-slate-gray">
                            {t("ledgerRefsTitle")}
                        </p>
                        <ul className="space-y-2 text-[12px]">
                            <RefRow
                                label={t("refProduction")}
                                value={entry.productionBatchId}
                            />
                            <RefRow
                                label={t("refTransfer")}
                                value={entry.transferId}
                            />
                            <RefRow
                                label={t("refCount")}
                                value={entry.countSessionId}
                            />
                            <RefRow
                                label={t("refOrderItem")}
                                value={entry.orderItemId}
                            />
                        </ul>
                    </aside>
                </div>
            )}
        </DashboardFrame>
    );
}

function Detail({
    label,
    value,
    mono,
    className,
}: {
    label: string;
    value: string;
    mono?: boolean;
    className?: string;
}) {
    return (
        <div>
            <dt className="text-[11px] uppercase tracking-wide text-slate-gray">
                {label}
            </dt>
            <dd
                className={cn(
                    "mt-0.5 text-[14px] font-medium text-foreground",
                    mono && "tabular-nums",
                    className,
                )}
            >
                {value}
            </dd>
        </div>
    );
}

function RefRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <li className="flex items-start justify-between gap-2">
            <span className="text-slate-gray">{label}</span>
            <span className="max-w-[60%] break-all text-right font-medium text-foreground">
                {value || "—"}
            </span>
        </li>
    );
}
