"use client";

import { useTranslations } from "next-intl";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { formatEtb } from "@/lib/money";
import type {
    HourlySalesPoint,
    OrderVolumePoint,
    PaymentChannelBreakdownItem,
    PrepDurationBucket,
    RevenueVsCollectionsPoint,
    StationThroughputPoint,
    TopSellingDish,
    WeeklyCashMovementPoint,
} from "@/context/services/managerDashboardApi";

const DAY_KEYS: Record<string, string> = {
    Sun: "daySun",
    Mon: "dayMon",
    Tue: "dayTue",
    Wed: "dayWed",
    Thu: "dayThu",
    Fri: "dayFri",
    Sat: "daySat",
};

function localizeDayLabel(
    t: ReturnType<typeof useTranslations>,
    value: string,
) {
    const key = DAY_KEYS[value];
    return key && t.has(key) ? t(key) : value;
}

function withLocalizedDays<T extends { period?: string; day?: string }>(
    t: ReturnType<typeof useTranslations>,
    rows: T[],
    field: "period" | "day",
): T[] {
    return rows.map(row => {
        const raw = row[field];
        if (!raw) return row;
        return { ...row, [field]: localizeDayLabel(t, raw) };
    });
}

export function RevenueVsCollectionsChart({
    data = [],
}: {
    data?: RevenueVsCollectionsPoint[];
}) {
    const t = useTranslations("dashboardCharts");
    const tCommon = useTranslations("common");
    const currency = tCommon("currency");
    const chartData = withLocalizedDays(t, data, "period");

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-[15px] font-semibold text-foreground">
                            {t("revenueTitle")}
                        </h3>
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            {t("revenueSubtitle", { currency })}
                        </p>
                    </div>
                </div>

                <div className="mt-6 h-[250px] w-full">
                    {chartData.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            {t("revenueEmpty")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="revGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#e85d04"
                                            stopOpacity="0.25"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#e85d04"
                                            stopOpacity="0.0"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="collGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#0068f9"
                                            stopOpacity="0.22"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#0068f9"
                                            stopOpacity="0.0"
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f0f0f2"
                                />
                                <XAxis
                                    dataKey="period"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 12 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "12px",
                                        border: "1px solid #efefef",
                                        boxShadow: "none",
                                        fontSize: "12px",
                                    }}
                                />
                                <Area
                                    dataKey="grossSales"
                                    name={t("grossSales")}
                                    type="monotone"
                                    stroke="#e85d04"
                                    strokeWidth={2.5}
                                    fill="url(#revGrad)"
                                />
                                <Area
                                    dataKey="collections"
                                    name={t("collections")}
                                    type="monotone"
                                    stroke="#0068f9"
                                    strokeWidth={2.2}
                                    fill="url(#collGrad)"
                                />
                                <Area
                                    dataKey="netRevenue"
                                    name={t("netRevenue")}
                                    type="monotone"
                                    stroke="#c2410c"
                                    strokeWidth={1.8}
                                    fill="none"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6 text-[12px] font-medium text-slate-gray">
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#e85d04]" />
                    <span>{t("grossSales")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#0068f9]" />
                    <span>{t("collections")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#c2410c]" />
                    <span>{t("netRevenue")}</span>
                </div>
            </div>
        </div>
    );
}

export function PaymentChannelsBreakdown({
    channels = [],
}: {
    channels?: PaymentChannelBreakdownItem[];
}) {
    const t = useTranslations("dashboardCharts");
    const totalShare = channels.reduce((sum, c) => sum + c.sharePercentage, 0);

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    {t("paymentChannelsTitle")}
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    {t("paymentChannelsSubtitle")}
                </p>

                {channels.length === 0 || totalShare === 0 ? (
                    <div className="mt-12 flex items-center justify-center text-[13px] text-slate-gray">
                        {t("paymentsEmpty")}
                    </div>
                ) : (
                    <>
                        <div className="mt-6 flex h-6 w-full overflow-hidden rounded-[8px] bg-secondary p-0.5">
                            {channels.map(ch => (
                                <div
                                    key={ch.id}
                                    style={{
                                        width: `${ch.sharePercentage}%`,
                                        backgroundColor: ch.color,
                                    }}
                                    className="h-full transition-all first:rounded-l-[6px] last:rounded-r-[6px]"
                                    title={`${ch.name}: ${ch.sharePercentage}% (${ch.amountFormatted})`}
                                />
                            ))}
                        </div>

                        <div className="mt-6 space-y-3.5">
                            {channels.map(ch => (
                                <div
                                    key={ch.id}
                                    className="flex items-center justify-between text-[13px]"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: ch.color,
                                            }}
                                        />
                                        <span className="font-medium text-foreground">
                                            {ch.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-[12px] text-slate-gray">
                                            {ch.amountFormatted}
                                        </span>
                                        <span className="w-10 text-right font-semibold text-foreground">
                                            {ch.sharePercentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export function PrepDurationBucketsChart({
    buckets = [],
    avgSpeed,
}: {
    buckets?: PrepDurationBucket[];
    avgSpeed?: string;
}) {
    const t = useTranslations("dashboardCharts");
    const totalTickets = buckets.reduce((sum, b) => sum + b.tickets, 0);

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    {t("prepTitle")}
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    {t("prepSubtitle")}
                </p>

                <div className="mt-6 h-[200px] w-full">
                    {totalTickets === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            {t("prepEmpty")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={buckets}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -25,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f0f0f2"
                                />
                                <XAxis
                                    dataKey="bucket"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 12 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "12px",
                                        border: "1px solid #efefef",
                                        boxShadow: "none",
                                        fontSize: "12px",
                                    }}
                                />
                                <Bar
                                    dataKey="tickets"
                                    name={t("tickets")}
                                    fill="#e85d04"
                                    radius={[6, 6, 0, 0]}
                                >
                                    {buckets.map((entry, idx) => (
                                        <Cell
                                            key={`cell-${entry.bucket}`}
                                            fill={
                                                idx === 0
                                                    ? "#fed7aa"
                                                    : idx === 1
                                                      ? "#fdba74"
                                                      : idx === 2
                                                        ? "#fb923c"
                                                        : idx === 3
                                                          ? "#f97316"
                                                          : "#e85d04"
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="mt-3 border-t border-hairline pt-3 text-[12px] text-slate-gray">
                {t("avgSpeed")}{" "}
                <span className="font-semibold text-foreground">
                    {avgSpeed ?? "0.0 min"}
                </span>
            </div>
        </div>
    );
}

export function WeeklyCashMovementChart({
    movement = [],
}: {
    movement?: WeeklyCashMovementPoint[];
}) {
    const t = useTranslations("dashboardCharts");
    const tCommon = useTranslations("common");
    const currency = tCommon("currency");
    const chartData = withLocalizedDays(t, movement, "day");

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    {t("cashMovementTitle")}
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    {t("cashMovementSubtitle", { currency })}
                </p>

                <div className="mt-6 h-[200px] w-full">
                    {chartData.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            {t("cashMovementEmpty")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -25,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="inflowGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#e85d04"
                                            stopOpacity="0.25"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#e85d04"
                                            stopOpacity="0.0"
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f0f0f2"
                                />
                                <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 12 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "12px",
                                        border: "1px solid #efefef",
                                        boxShadow: "none",
                                        fontSize: "12px",
                                    }}
                                />
                                <Area
                                    dataKey="digitalInflow"
                                    name={t("digitalTransfer")}
                                    type="monotone"
                                    stroke="#e85d04"
                                    strokeWidth={2.2}
                                    fill="url(#inflowGrad)"
                                />
                                <Area
                                    dataKey="cashDrop"
                                    name={t("cashDrops")}
                                    type="monotone"
                                    stroke="#fb923c"
                                    strokeDasharray="4 4"
                                    strokeWidth={2}
                                    fill="none"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-6 text-[12px] font-medium text-slate-gray">
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#e85d04]" />
                    <span>{t("digitalTina")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full border border-dashed border-[#fb923c] bg-[#fb923c]" />
                    <span>{t("cashDropsLegend")}</span>
                </div>
            </div>
        </div>
    );
}

export function TopDishesLeaderboard({
    dishes = [],
}: {
    dishes?: TopSellingDish[];
}) {
    const t = useTranslations("dashboardCharts");

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    {t("topDishesTitle")}
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    {t("topDishesSubtitle")}
                </p>

                <div className="mt-5 space-y-4">
                    {dishes.length === 0 ? (
                        <div className="py-8 text-center text-[13px] text-slate-gray">
                            {t("topDishesEmpty")}
                        </div>
                    ) : (
                        dishes.map(dish => (
                            <div key={dish.name} className="space-y-1.5">
                                <div className="flex items-center justify-between text-[13px]">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">
                                            {dish.name}
                                        </span>
                                        <span className="text-[11px] text-slate-gray">
                                            ({dish.category})
                                        </span>
                                    </div>
                                    <span className="font-semibold text-slate-gray">
                                        {formatEtb(dish.revenue)}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                        style={{ width: `${dish.percent}%` }}
                                        className="h-full rounded-full bg-primary transition-all duration-500"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export function HourlySalesChart({ data = [] }: { data?: HourlySalesPoint[] }) {
    const t = useTranslations("dashboardCharts");
    const tCommon = useTranslations("common");
    const currency = tCommon("currency");
    const hasData = data.some(d => d.billed > 0 || d.collected > 0);

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    {t("hourlyTitle")}
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    {t("hourlySubtitle", { currency })}
                </p>

                <div className="mt-6 h-[220px] w-full">
                    {!hasData ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            {t("hourlyEmpty")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f0f0f2"
                                />
                                <XAxis
                                    dataKey="hour"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 11 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 12 }}
                                />
                                <Tooltip
                                    formatter={value =>
                                        formatEtb(Number(value ?? 0))
                                    }
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "12px",
                                        border: "1px solid #efefef",
                                        boxShadow: "none",
                                        fontSize: "12px",
                                    }}
                                />
                                <Bar
                                    dataKey="billed"
                                    name={t("billed")}
                                    fill="#fdba74"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="collected"
                                    name={t("collected")}
                                    fill="#e85d04"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-6 text-[12px] font-medium text-slate-gray">
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#fdba74]" />
                    <span>{t("billed")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#e85d04]" />
                    <span>{t("collected")}</span>
                </div>
            </div>
        </div>
    );
}

export function StationThroughputChart({
    data = [],
}: {
    data?: StationThroughputPoint[];
}) {
    const t = useTranslations("dashboardCharts");

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    {t("throughputTitle")}
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    {t("throughputSubtitle")}
                </p>

                <div className="mt-6 h-[220px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            {t("throughputEmpty")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f0f0f2"
                                />
                                <XAxis
                                    dataKey="station"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 11 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 12 }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "12px",
                                        border: "1px solid #efefef",
                                        boxShadow: "none",
                                        fontSize: "12px",
                                    }}
                                />
                                <Bar
                                    dataKey="queued"
                                    name={t("queued")}
                                    stackId="a"
                                    fill="#fdba74"
                                />
                                <Bar
                                    dataKey="inPrep"
                                    name={t("inPrep")}
                                    stackId="a"
                                    fill="#f97316"
                                />
                                <Bar
                                    dataKey="ready"
                                    name={t("ready")}
                                    stackId="a"
                                    fill="#e85d04"
                                />
                                <Bar
                                    dataKey="served"
                                    name={t("served")}
                                    stackId="a"
                                    fill="#046645"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

export function OrderVolumeChart({ data = [] }: { data?: OrderVolumePoint[] }) {
    const t = useTranslations("dashboardCharts");
    const hasData = data.some(d => d.orders > 0 || d.covers > 0);
    const chartData = withLocalizedDays(t, data, "period");

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    {t("ordersTitle")}
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    {t("ordersSubtitle")}
                </p>

                <div className="mt-6 h-[220px] w-full">
                    {!hasData ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            {t("ordersEmpty")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="ordersGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#e85d04"
                                            stopOpacity="0.25"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#e85d04"
                                            stopOpacity="0.0"
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f0f0f2"
                                />
                                <XAxis
                                    dataKey="period"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 12 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#777c86", fontSize: 12 }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "12px",
                                        border: "1px solid #efefef",
                                        boxShadow: "none",
                                        fontSize: "12px",
                                    }}
                                />
                                <Area
                                    dataKey="orders"
                                    name={t("orders")}
                                    type="monotone"
                                    stroke="#e85d04"
                                    strokeWidth={2.2}
                                    fill="url(#ordersGrad)"
                                />
                                <Area
                                    dataKey="covers"
                                    name={t("covers")}
                                    type="monotone"
                                    stroke="#046645"
                                    strokeWidth={2}
                                    fill="none"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-6 text-[12px] font-medium text-slate-gray">
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#e85d04]" />
                    <span>{t("orders")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#046645]" />
                    <span>{t("covers")}</span>
                </div>
            </div>
        </div>
    );
}

export function PaymentMixPieChart({
    channels = [],
}: {
    channels?: PaymentChannelBreakdownItem[];
}) {
    const t = useTranslations("dashboardCharts");
    const data = channels.filter(ch => ch.amountValue > 0);
    return (
        <div className="flex h-full flex-col rounded-[16px] border border-hairline bg-card p-5">
            <div>
                <h3 className="text-[14px] font-medium tracking-tight text-foreground">
                    {t("paymentMixTitle")}
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    {t("paymentMixSubtitle")}
                </p>
            </div>
            <div className="mt-4 min-h-[220px] flex-1">
                {data.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center text-[13px] text-slate-gray">
                        {t("paymentMixEmpty")}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="amountValue"
                                nameKey="name"
                                innerRadius={52}
                                outerRadius={78}
                                paddingAngle={2}
                            >
                                {data.map(ch => (
                                    <Cell key={ch.id} fill={ch.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={value =>
                                    formatEtb(Number(value ?? 0))
                                }
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
            {data.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-gray">
                    {data.map(ch => (
                        <div
                            key={ch.id}
                            className="inline-flex items-center gap-1.5"
                        >
                            <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: ch.color }}
                            />
                            <span>
                                {ch.name} · {ch.sharePercentage}%
                            </span>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export function CashierMoneyRadarChart({
    data = [],
}: {
    data?: Array<{ metric: string; value: number }>;
}) {
    const t = useTranslations("dashboardCharts");
    const hasSignal = data.some(row => row.value > 0);
    return (
        <div className="flex h-full flex-col rounded-[16px] border border-hairline bg-card p-5">
            <div>
                <h3 className="text-[14px] font-medium tracking-tight text-foreground">
                    {t("deskBalanceTitle")}
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    {t("deskBalanceSubtitle")}
                </p>
            </div>
            <div className="mt-2 min-h-[240px] flex-1">
                {!hasSignal ? (
                    <div className="flex h-[240px] items-center justify-center text-[13px] text-slate-gray">
                        {t("deskBalanceEmpty")}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <RadarChart
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius="70%"
                        >
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis
                                dataKey="metric"
                                tick={{ fill: "#64748b", fontSize: 11 }}
                            />
                            <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={false}
                                axisLine={false}
                            />
                            <Radar
                                name={t("mix")}
                                dataKey="value"
                                stroke="#e85d04"
                                fill="#e85d04"
                                fillOpacity={0.2}
                            />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

export function WeeklySalesChart() {
    return <RevenueVsCollectionsChart />;
}

export function FulfillmentLatencyChart() {
    return <PrepDurationBucketsChart />;
}

export function PaymentChannelsChart() {
    return <PaymentChannelsBreakdown />;
}
