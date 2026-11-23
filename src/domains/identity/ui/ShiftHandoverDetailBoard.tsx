"use client";

import React from "react";
import {
    ArrowLeft,
    ArrowRight,
    Banknote,
    CheckCircle2,
    Clock,
    CreditCard,
    Table2,
    UtensilsCrossed,
    AlertTriangle,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useManagerHandoverDetailQuery } from "@/context/services/shiftsApi";
import { formatEtb } from "@/lib/money";

interface ShiftHandoverDetailBoardProps {
    handoverId: string;
    basePath?: string;
}

export default function ShiftHandoverDetailBoard({
    handoverId,
    basePath = "/manager/staff",
}: ShiftHandoverDetailBoardProps) {
    const isAm = useLocale() === "am";
    const { data, isLoading, isError } =
        useManagerHandoverDetailQuery(handoverId);

    const varianceNum = Number(data?.money.varianceAmount ?? 0);
    const hasVariance =
        data?.kind === "CASHIER" && Math.abs(varianceNum) > 0.01;

    return (
        <DashboardFrame>
            <div className="space-y-6">
                <Link
                    href={`${basePath}/handovers`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-gray hover:text-foreground transition-colors w-fit"
                >
                    <ArrowLeft className="size-3.5" />
                    {isAm ? "ወደ ፈረቃ ርክክቦች ተመለስ" : "Back to Shift Handovers"}
                </Link>

                {isLoading ? (
                    <div className="rounded-[20px] border border-hairline bg-card p-12 text-center text-xs text-slate-gray">
                        {isAm
                            ? "የርክክብ ዝርዝር በመጫን ላይ..."
                            : "Loading handover details..."}
                    </div>
                ) : isError || !data ? (
                    <div className="rounded-[20px] border border-destructive-border bg-destructive-soft p-8 text-center text-xs text-destructive">
                        {isAm
                            ? "ይህንን የፈረቃ ርክክብ መረጃ መጫን አልተቻለም።"
                            : "Could not load this shift handover record."}
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                            <PageHeader
                                compact
                                eyebrow={
                                    data.kind === "CASHIER"
                                        ? isAm
                                            ? "የካሸር ካዝና (መቀበያ) ርክክብ"
                                            : "Cashier Drawer Handover"
                                        : isAm
                                          ? "የአስተናጋጅ ጠረጴዛ እና ገንዘብ ርክክብ"
                                          : "Waiter Table & Cash Handover"
                                }
                                title={`${data.outgoingName} → ${data.incomingName}`}
                                description={
                                    isAm
                                        ? `የተጠናቀቀበት፡ ${new Date(data.handedOverAt).toLocaleString()}`
                                        : `Completed on ${new Date(data.handedOverAt).toLocaleString()}`
                                }
                            />
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <Badge
                                    variant={
                                        data.kind === "CASHIER"
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {data.kind === "CASHIER"
                                        ? isAm
                                            ? "የካሸር ርክክብ"
                                            : "Cashier Handover"
                                        : isAm
                                          ? "የአስተናጋጅ ርክክብ"
                                          : "Waiter Handover"}
                                </Badge>
                                {data.kind === "CASHIER" && (
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            hasVariance
                                                ? "bg-destructive-soft text-destructive"
                                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                        }`}
                                    >
                                        {hasVariance ? (
                                            <AlertTriangle className="size-3" />
                                        ) : (
                                            <CheckCircle2 className="size-3" />
                                        )}
                                        {hasVariance
                                            ? `${isAm ? "ልዩነት" : "Variance"}: ${varianceNum > 0 ? "+" : ""}${formatEtb(varianceNum)}`
                                            : isAm
                                              ? "ካዝናው ትክክል ነው"
                                              : "Drawer Balanced"}
                                    </span>
                                )}
                            </div>
                        </div>

                        {data.notes ? (
                            <div className="rounded-[16px] border border-hairline bg-secondary/30 px-4 py-3 text-xs text-foreground">
                                <span className="font-semibold text-slate-gray mr-1.5">
                                    {isAm ? "የርክክብ ማስታወሻ:" : "Handover Note:"}
                                </span>
                                {data.notes}
                            </div>
                        ) : null}

                        {/* Money Summary Grid */}
                        <div className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Banknote className="size-4 text-brand" />
                                <span>
                                    {isAm
                                        ? "የገንዘብ እና የርክክብ ዝርዝር መግለጫ"
                                        : "Money & Custody Breakdown"}
                                </span>
                            </div>

                            {data.kind === "CASHIER" ? (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                    <StatBox
                                        label={
                                            isAm ? "የመነሻ ተቀማጭ" : "Opening Float"
                                        }
                                        value={formatEtb(
                                            Number(
                                                data.money.openingFloat ?? 0,
                                            ),
                                        )}
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "የተሰበሰበ ጥሬ ገንዘብ"
                                                : "Cash Collected"
                                        }
                                        value={formatEtb(
                                            Number(data.money.cashCollected),
                                        )}
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "ከአስተናጋጆች የተቀበለው ገንዘብ"
                                                : "Waiter Drops Received"
                                        }
                                        value={formatEtb(
                                            Number(
                                                data.money.cashDropsReceived ??
                                                    0,
                                            ),
                                        )}
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "ጥሬ ያልሆነ (ቴሌብር/ባንክ)"
                                                : "Non-Cash (Transfer/Card)"
                                        }
                                        value={formatEtb(
                                            Number(data.money.nonCashCollected),
                                        )}
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "በካዝናው የሚጠበቅ ገንዘብ"
                                                : "Expected Drawer Cash"
                                        }
                                        value={formatEtb(
                                            Number(
                                                data.money.expectedCash ?? 0,
                                            ),
                                        )}
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "በእጅ የተቆጠረ ገንዘብ"
                                                : "Physical Counted"
                                        }
                                        value={formatEtb(
                                            Number(
                                                data.money.countedAmount ?? 0,
                                            ),
                                        )}
                                        highlight
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "ለሚቀጥለው ካሸር የተላለፈ"
                                                : "Float to Next Cashier"
                                        }
                                        value={formatEtb(
                                            Number(
                                                data.money
                                                    .floatForNextCashier ?? 0,
                                            ),
                                        )}
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "ወደ ዋናው ካዝና የገባ"
                                                : "Safe Drop Deposited"
                                        }
                                        value={formatEtb(
                                            Number(
                                                data.money.safeDropAmount ?? 0,
                                            ),
                                        )}
                                    />
                                    <StatBox
                                        label={isAm ? "ልዩነት" : "Variance"}
                                        value={`${varianceNum > 0 ? "+" : ""}${formatEtb(varianceNum)}`}
                                        danger={hasVariance}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                    <StatBox
                                        label={
                                            isAm
                                                ? "የተረከበው ጥሬ ገንዘብ"
                                                : "Cash Handed Over"
                                        }
                                        value={formatEtb(
                                            Number(
                                                data.money
                                                    .transferredCashAmount ?? 0,
                                            ),
                                        )}
                                        highlight
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "ያልተዘጉ ጠረጴዛዎች ዋጋ"
                                                : "Open Tables Value"
                                        }
                                        value={formatEtb(
                                            Number(
                                                data.money
                                                    .openTablesTotalValue ?? 0,
                                            ),
                                        )}
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "በፈረቃው የተሰበሰበ ጥሬ"
                                                : "Cash Collected in Shift"
                                        }
                                        value={formatEtb(
                                            Number(data.money.cashCollected),
                                        )}
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "የተሰበሰበ ጥሬ ያልሆነ"
                                                : "Non-Cash Collected"
                                        }
                                        value={formatEtb(
                                            Number(data.money.nonCashCollected),
                                        )}
                                    />
                                    <StatBox
                                        label={
                                            isAm
                                                ? "ለካሸር የተረከበ ጥሬ"
                                                : "Cash Dropped to Cashier"
                                        }
                                        value={formatEtb(
                                            Number(
                                                data.money.cashDropsGiven ?? 0,
                                            ),
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Food / Beverage / Station Breakdown & Payment Methods */}
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {/* Station / Food & Beverage Breakdown */}
                            <div className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <UtensilsCrossed className="size-4 text-brand" />
                                        <span>
                                            {isAm
                                                ? "የምግብ፣ መጠጥ እና ማብሰያ ክፍል ዝርዝር"
                                                : "Food, Beverage & Station Breakdown"}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-gray">
                                        {data.stationBreakdown.reduce(
                                            (s, b) => s + b.itemCount,
                                            0,
                                        )}{" "}
                                        {isAm ? "እቃዎች" : "items"}
                                    </span>
                                </div>

                                {data.stationBreakdown.length === 0 ? (
                                    <p className="py-4 text-xs text-slate-gray">
                                        No items recorded in this handover
                                        scope.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-hairline">
                                        {data.stationBreakdown.map(st => (
                                            <div
                                                key={st.stationName}
                                                className="flex items-center justify-between py-2.5 text-xs"
                                            >
                                                <div>
                                                    <span className="font-semibold text-foreground">
                                                        {st.stationName}
                                                    </span>
                                                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-slate-gray">
                                                        {st.itemCount}{" "}
                                                        {st.itemCount === 1
                                                            ? "item"
                                                            : "items"}
                                                    </span>
                                                </div>
                                                <span className="font-mono font-semibold text-foreground">
                                                    {formatEtb(
                                                        Number(st.totalAmount),
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Payment Methods */}
                            <div className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <CreditCard className="size-4 text-brand" />
                                    <span>
                                        {isAm
                                            ? "በፈረቃው የተሰበሰቡ ክፍያዎች"
                                            : "Payments Collected in Shift"}
                                    </span>
                                </div>

                                {data.paymentMethods.length === 0 ? (
                                    <p className="py-4 text-xs text-slate-gray">
                                        No payments recorded during this
                                        outgoing shift.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-hairline">
                                        {data.paymentMethods.map(pm => (
                                            <div
                                                key={pm.method}
                                                className="flex items-center justify-between py-2.5 text-xs"
                                            >
                                                <div>
                                                    <span className="font-semibold text-foreground">
                                                        {pm.method}
                                                    </span>
                                                    <span className="ml-2 text-slate-gray">
                                                        ({pm.count}{" "}
                                                        {pm.count === 1
                                                            ? "payment"
                                                            : "payments"}
                                                        )
                                                    </span>
                                                </div>
                                                <span className="font-mono font-semibold text-foreground">
                                                    {formatEtb(
                                                        Number(pm.totalAmount),
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Waiter Cash Drops (for Cashier Handover) */}
                        {data.kind === "CASHIER" &&
                        data.cashDrops.length > 0 ? (
                            <div className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Clock className="size-4 text-brand" />
                                    <span>
                                        {isAm
                                            ? `ከአስተናጋጆች የተረከበ ጥሬ ገንዘብ (${data.cashDrops.length})`
                                            : `Waiter Cash Drops Received (${data.cashDrops.length})`}
                                    </span>
                                </div>
                                <div className="divide-y divide-hairline">
                                    {data.cashDrops.map(d => (
                                        <div
                                            key={d.id}
                                            className="flex items-center justify-between py-2.5 text-xs"
                                        >
                                            <div>
                                                <span className="font-semibold text-foreground">
                                                    {d.waiterName}
                                                </span>
                                                {d.receivedAt ? (
                                                    <span className="ml-2 text-slate-gray font-mono">
                                                        {new Date(
                                                            d.receivedAt,
                                                        ).toLocaleTimeString()}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <span className="font-mono font-semibold text-foreground">
                                                {formatEtb(Number(d.amount))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Transferred Tables & Orders (for Waiter Handover) */}
                        {data.kind === "WAITER" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Table2 className="size-4 text-brand" />
                                        <span>
                                            {isAm
                                                ? `የተላለፉ ጠረጴዛዎች እና ትዕዛዞች (${data.tables.length})`
                                                : `Transferred Tables & Orders (${data.tables.length})`}
                                        </span>
                                    </div>
                                </div>

                                {data.tables.length === 0 ? (
                                    <div className="rounded-[20px] border border-hairline bg-card p-8 text-center text-xs text-slate-gray">
                                        No open tables were active at the time
                                        of this handover.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {data.tables.map(tbl => (
                                            <div
                                                key={tbl.tableSessionId}
                                                className="overflow-hidden rounded-[20px] border border-hairline bg-card shadow-subtle"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-secondary/30 px-5 py-3.5">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-sm font-bold text-foreground">
                                                                {tbl.tableName}
                                                            </h3>
                                                            {tbl.locationName ? (
                                                                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-slate-gray">
                                                                    {
                                                                        tbl.locationName
                                                                    }
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <p className="mt-0.5 text-[11px] text-slate-gray">
                                                            {tbl.ordersCount}{" "}
                                                            {tbl.ordersCount ===
                                                            1
                                                                ? "order"
                                                                : "orders"}{" "}
                                                            · {tbl.itemsCount}{" "}
                                                            {tbl.itemsCount ===
                                                            1
                                                                ? "item"
                                                                : "items"}
                                                            {tbl.guestCount !=
                                                            null
                                                                ? ` · ${tbl.guestCount} guests`
                                                                : ""}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[11px] text-slate-gray block">
                                                            {isAm
                                                                ? "የጠረጴዛው ጠቅላላ"
                                                                : "Table Total"}
                                                        </span>
                                                        <span className="font-mono text-sm font-bold text-brand">
                                                            {formatEtb(
                                                                Number(
                                                                    tbl.totalAmount,
                                                                ),
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="border-b border-hairline/60 bg-secondary/15 text-[10.5px] font-semibold uppercase tracking-wider text-slate-gray">
                                                            <tr>
                                                                <th className="px-5 py-2">
                                                                    {isAm
                                                                        ? "እቃ / ምግብ"
                                                                        : "Item"}
                                                                </th>
                                                                <th className="px-3 py-2">
                                                                    {isAm
                                                                        ? "ማብሰያ ክፍል"
                                                                        : "Station"}
                                                                </th>
                                                                <th className="px-3 py-2 text-center">
                                                                    {isAm
                                                                        ? "ብዛት"
                                                                        : "Qty"}
                                                                </th>
                                                                <th className="px-3 py-2 text-right">
                                                                    {isAm
                                                                        ? "ነጠላ ዋጋ"
                                                                        : "Unit Price"}
                                                                </th>
                                                                <th className="px-3 py-2 text-right">
                                                                    {isAm
                                                                        ? "ጠቅላላ"
                                                                        : "Total"}
                                                                </th>
                                                                <th className="px-5 py-2 text-right">
                                                                    {isAm
                                                                        ? "ሁኔታ"
                                                                        : "Status"}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-hairline/50">
                                                            {tbl.items.map(
                                                                item => (
                                                                    <tr
                                                                        key={
                                                                            item.id
                                                                        }
                                                                    >
                                                                        <td className="px-5 py-2.5 font-medium text-foreground">
                                                                            {
                                                                                item.itemName
                                                                            }
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-slate-gray">
                                                                            {
                                                                                item.stationName
                                                                            }
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center font-mono">
                                                                            {
                                                                                item.quantity
                                                                            }
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-right font-mono text-slate-gray">
                                                                            {formatEtb(
                                                                                Number(
                                                                                    item.unitPrice,
                                                                                ),
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">
                                                                            {formatEtb(
                                                                                Number(
                                                                                    item.totalPrice,
                                                                                ),
                                                                            )}
                                                                        </td>
                                                                        <td className="px-5 py-2.5 text-right">
                                                                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-slate-gray">
                                                                                {
                                                                                    item.state
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardFrame>
    );
}

function StatBox({
    label,
    value,
    highlight,
    danger,
}: {
    label: string;
    value: string;
    highlight?: boolean;
    danger?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border p-3 ${
                danger
                    ? "border-destructive-border bg-destructive-soft"
                    : highlight
                      ? "border-brand-border bg-brand-soft"
                      : "border-hairline bg-secondary/20"
            }`}
        >
            <div className="text-[11px] font-medium text-slate-gray">
                {label}
            </div>
            <div
                className={`mt-1 font-mono text-sm font-bold ${
                    danger
                        ? "text-destructive"
                        : highlight
                          ? "text-brand"
                          : "text-foreground"
                }`}
            >
                {value}
            </div>
        </div>
    );
}
