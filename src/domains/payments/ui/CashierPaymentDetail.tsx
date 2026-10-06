"use client";

import { useState } from "react";
import { ArrowLeft, ImageOff, Loader2, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCashierPaymentDetailQuery } from "@/context/services/billingApi";
import { filePublicUrl } from "@/domains/catalog/application/menuImages";
import { CashierReceiptModal } from "@/domains/payments/ui/CashierReceiptModal";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/money";
import { useAppSelector } from "@/context/hooks";

export default function CashierPaymentDetail({
    paymentId,
    backHref = "/cashier/payments",
}: {
    paymentId: string;
    backHref?: string;
}) {
    const t = useTranslations("cashier");
    const tCommon = useTranslations("common");
    const isBakery =
        useAppSelector(state => state.identity.session?.serviceMode) ===
        "BAKERY";
    const { data, isLoading, isError } =
        useCashierPaymentDetailQuery(paymentId);
    const [showBillReceipt, setShowBillReceipt] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 rounded-[14px] border border-hairline bg-card p-6 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin" />
                {tCommon("loading")}
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="space-y-3">
                <BackLink href={backHref} />
                <p className="rounded-[14px] border border-hairline bg-card p-5 text-[13px] text-red-600">
                    {t("paymentDetailLoadError")}
                </p>
            </div>
        );
    }

    const { payment, bill } = data;
    const isDigital = payment.method === "TRANSFER";
    const method =
        payment.method === "CASH"
            ? t("cash")
            : payment.transferChannel === "TELEBIRR"
              ? t("telebirr")
              : t("transfer");
    const slipUrl = filePublicUrl(payment.receiptImagePath);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <BackLink href={backHref} />
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12px] text-slate-gray">
                        {payment.billNumber}
                    </p>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5"
                        onClick={() => setShowBillReceipt(true)}
                    >
                        <Receipt className="size-3.5" />
                        {t("billReceipt")}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="space-y-4 rounded-[16px] border border-hairline bg-card p-5">
                    <div>
                        <p className="text-[11px] tracking-[0.08em] text-steel-gray uppercase">
                            {t("paymentDetail")}
                        </p>
                        <p className="mt-1 text-[24px] font-semibold tabular-nums">
                            {formatEtb(Number(payment.amount))}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            {method}
                            {payment.verifiedAt
                                ? ` · ${t("verifiedDigital")}`
                                : ""}
                        </p>
                    </div>

                    <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
                        {isBakery ? null : (
                            <>
                                <Detail
                                    label={tCommon("table")}
                                    value={payment.tableDisplayName}
                                />
                                <Detail
                                    label={tCommon("waiter")}
                                    value={payment.waiterName}
                                />
                            </>
                        )}
                        <Detail
                            label={tCommon("bill")}
                            value={payment.billNumber}
                        />
                        {isBakery ? null : (
                            <Detail
                                label={tCommon("status")}
                                value={
                                    payment.tableClosed
                                        ? t("tableClosed")
                                        : t("tableOpen")
                                }
                            />
                        )}
                        <Detail
                            label={t("collectedAt")}
                            value={
                                payment.collectedAt
                                    ? new Date(
                                          payment.collectedAt,
                                      ).toLocaleString()
                                    : "—"
                            }
                        />
                        <Detail
                            label={t("verifiedAt")}
                            value={
                                payment.verifiedAt
                                    ? new Date(
                                          payment.verifiedAt,
                                      ).toLocaleString()
                                    : "—"
                            }
                        />
                    </dl>

                    <div className="border-t border-hairline pt-4">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-medium text-steel-gray uppercase tracking-[0.06em]">
                                {t("billReceipt")}
                            </p>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1.5 px-2"
                                onClick={() => setShowBillReceipt(true)}
                            >
                                <Receipt className="size-3.5" />
                                {t("openBillReceipt")}
                            </Button>
                        </div>
                        <ul className="mt-2 space-y-1.5">
                            {bill.lines.map(line => (
                                <li
                                    key={line.billLineId}
                                    className="flex items-baseline justify-between gap-3 text-[13px]"
                                >
                                    <span className="text-slate-gray">
                                        {line.quantity}× {line.itemName}
                                    </span>
                                    <span className="tabular-nums">
                                        {formatEtb(Number(line.lineTotal))}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2 text-[13px] font-medium">
                            <span>{tCommon("total")}</span>
                            <span className="tabular-nums">
                                {formatEtb(Number(bill.total))}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="rounded-[16px] border border-hairline bg-card p-5">
                    <p className="text-[12px] font-medium text-steel-gray uppercase tracking-[0.06em]">
                        {isDigital
                            ? t("waiterSlipPhoto")
                            : t("cashNoSlipPhoto")}
                    </p>
                    {isDigital && slipUrl ? (
                        <div className="mt-3 overflow-hidden rounded-[12px] border border-hairline bg-black/5">
                            <img
                                src={slipUrl}
                                alt={t("waiterSlipPhoto")}
                                className="max-h-[70vh] w-full object-contain"
                            />
                        </div>
                    ) : isDigital ? (
                        <div className="mt-3 flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-hairline text-[13px] text-slate-gray">
                            <ImageOff className="size-6 opacity-60" />
                            {t("noSlipOnFile")}
                        </div>
                    ) : (
                        <p className="mt-3 text-[13px] text-slate-gray">
                            {t("cashPaymentNoPhotoHint")}
                        </p>
                    )}
                    {payment.receiptCapturedAt ? (
                        <p className="mt-2 text-[12px] text-slate-gray">
                            {t("slipCapturedAt", {
                                time: new Date(
                                    payment.receiptCapturedAt,
                                ).toLocaleString(),
                            })}
                        </p>
                    ) : null}
                </section>
            </div>

            <CashierReceiptModal
                open={showBillReceipt}
                onOpenChange={setShowBillReceipt}
                bill={bill}
                tableDisplayName={
                    isBakery ? undefined : payment.tableDisplayName
                }
                waiterName={isBakery ? undefined : payment.waiterName}
                showSendToWaiter={!isBakery}
                hideTable={isBakery}
            />
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[11px] text-slate-gray">{label}</dt>
            <dd className="mt-0.5 font-medium">{value}</dd>
        </div>
    );
}

function BackLink({ href }: { href: string }) {
    const t = useTranslations("cashier");
    const label = href.includes("/closed")
        ? t("backToClosedBills")
        : t("backToPayments");
    return (
        <Button asChild variant="ghost" className="h-9 gap-1.5 px-2">
            <Link href={href}>
                <ArrowLeft className="size-4" />
                {label}
            </Link>
        </Button>
    );
}
