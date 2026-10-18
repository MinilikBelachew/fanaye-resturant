"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useGetInventoryMovementSeriesQuery } from "@/context/services/inventoryApi";
import { formatEtb } from "@/lib/money";
import { Loader2 } from "lucide-react";

export default function InventoryMovementChart({
    from,
    to,
}: {
    from?: string;
    to?: string;
}) {
    const t = useTranslations("inventory");
    const { data, isLoading, isError } = useGetInventoryMovementSeriesQuery({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
    });

    const series = data?.data?.series ?? [];
    const totals = data?.data?.totals;

    const chartData = useMemo(
        () =>
            series.map(row => ({
                ...row,
                label: new Date(row.date + "T12:00:00").toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric" },
                ),
            })),
        [series],
    );

    const hasData = chartData.some(
        row =>
            row.receive > 0 ||
            row.waste > 0 ||
            row.produceOut > 0 ||
            row.produceUse > 0 ||
            row.sales > 0,
    );

    return (
        <section className="rounded-2xl border border-hairline bg-card p-5">
            <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 className="text-[15px] font-semibold text-foreground">
                        {t("movementChartTitle")}
                    </h3>
                    <p className="mt-0.5 text-[12px] text-slate-gray">
                        {t("movementChartHint")}
                    </p>
                </div>
                {totals ? (
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-gray">
                        <span>
                            {t("movementReceive")}:{" "}
                            <strong className="text-foreground">
                                {formatEtb(totals.receive)}
                            </strong>
                        </span>
                        <span>
                            {t("movementWaste")}:{" "}
                            <strong className="text-foreground">
                                {formatEtb(totals.waste)}
                            </strong>
                        </span>
                        <span>
                            {t("movementProduceOut")}:{" "}
                            <strong className="text-foreground">
                                {formatEtb(totals.produceOut)}
                            </strong>
                        </span>
                    </div>
                ) : null}
            </div>

            <div className="mt-4 h-[260px] w-full">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center text-slate-gray">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                ) : isError ? (
                    <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                        {t("movementChartError")}
                    </div>
                ) : !hasData ? (
                    <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                        {t("movementChartEmpty")}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient
                                    id="invReceive"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#0d9488"
                                        stopOpacity={0.28}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#0d9488"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="invWaste"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#e11d48"
                                        stopOpacity={0.22}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#e11d48"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="invProduce"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#e85d04"
                                        stopOpacity={0.25}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#e85d04"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f0f0f2"
                            />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#777c86", fontSize: 11 }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#777c86", fontSize: 11 }}
                                tickFormatter={v =>
                                    Number(v) >= 1000
                                        ? `${Math.round(Number(v) / 1000)}k`
                                        : String(v)
                                }
                            />
                            <Tooltip
                                formatter={value =>
                                    formatEtb(Number(value ?? 0))
                                }
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #efefef",
                                    fontSize: "12px",
                                }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="receive"
                                name={t("movementReceive")}
                                stroke="#0d9488"
                                strokeWidth={2}
                                fill="url(#invReceive)"
                            />
                            <Area
                                type="monotone"
                                dataKey="produceOut"
                                name={t("movementProduceOut")}
                                stroke="#e85d04"
                                strokeWidth={2}
                                fill="url(#invProduce)"
                            />
                            <Area
                                type="monotone"
                                dataKey="produceUse"
                                name={t("movementProduceUse")}
                                stroke="#c2410c"
                                strokeWidth={1.6}
                                fill="none"
                            />
                            <Area
                                type="monotone"
                                dataKey="waste"
                                name={t("movementWaste")}
                                stroke="#e11d48"
                                strokeWidth={2}
                                fill="url(#invWaste)"
                            />
                            <Area
                                type="monotone"
                                dataKey="sales"
                                name={t("movementSales")}
                                stroke="#0068f9"
                                strokeWidth={1.6}
                                fill="none"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    );
}
