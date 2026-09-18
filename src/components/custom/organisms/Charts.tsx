"use client";

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

// 1. Gross Sales vs Net Revenue vs Collections Multi-Wave Area Chart
export function RevenueVsCollectionsChart({
    data = [],
}: {
    data?: RevenueVsCollectionsPoint[];
}) {
    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-[15px] font-semibold text-foreground">
                            Gross sales vs net revenue vs collections
                        </h3>
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            Trailing operational history · ETB
                        </p>
                    </div>
                </div>

                <div className="mt-6 h-[250px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            No sales history recorded yet for this branch
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data}
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
                                    name="Gross Sales"
                                    type="monotone"
                                    stroke="#e85d04"
                                    strokeWidth={2.5}
                                    fill="url(#revGrad)"
                                />
                                <Area
                                    dataKey="collections"
                                    name="Collections"
                                    type="monotone"
                                    stroke="#0068f9"
                                    strokeWidth={2.2}
                                    fill="url(#collGrad)"
                                />
                                <Area
                                    dataKey="netRevenue"
                                    name="Net Revenue"
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
                    <span>Gross Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#0068f9]" />
                    <span>Collections</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#c2410c]" />
                    <span>Net Revenue</span>
                </div>
            </div>
        </div>
    );
}

// 2. Payment Channels Breakdown
export function PaymentChannelsBreakdown({
    channels = [],
}: {
    channels?: PaymentChannelBreakdownItem[];
}) {
    const totalShare = channels.reduce((sum, c) => sum + c.sharePercentage, 0);

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    Payment channels
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    Share of collections today
                </p>

                {channels.length === 0 || totalShare === 0 ? (
                    <div className="mt-12 flex items-center justify-center text-[13px] text-slate-gray">
                        No payments collected today yet
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
                                            className="size-2.5 rounded-full shrink-0"
                                            style={{
                                                backgroundColor: ch.color,
                                            }}
                                        />
                                        <span className="font-medium text-foreground">
                                            {ch.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-gray font-mono text-[12px]">
                                            {ch.amountFormatted}
                                        </span>
                                        <span className="font-semibold text-foreground w-10 text-right">
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

// 3. Prep Duration / Ticket Aging Buckets
export function PrepDurationBucketsChart({
    buckets = [],
    avgSpeed,
}: {
    buckets?: PrepDurationBucket[];
    avgSpeed?: string;
}) {
    const totalTickets = buckets.reduce((sum, b) => sum + b.tickets, 0);

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    Prep duration distribution
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    Ticket completion by time bracket
                </p>

                <div className="mt-6 h-[200px] w-full">
                    {totalTickets === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            No tickets processed yet today
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
                                    name="Tickets"
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
                Average fulfillment speed:{" "}
                <span className="font-semibold text-foreground">
                    {avgSpeed ?? "0.0 min"}
                </span>
            </div>
        </div>
    );
}

// 4. Weekly Cash Movement Chart
export function WeeklyCashMovementChart({
    movement = [],
}: {
    movement?: WeeklyCashMovementPoint[];
}) {
    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    Weekly cash movement
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    Digital inflows vs cash drops · ETB thousands
                </p>

                <div className="mt-6 h-[200px] w-full">
                    {movement.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            No cash movement records yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={movement}
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
                                    name="Digital Transfer"
                                    type="monotone"
                                    stroke="#e85d04"
                                    strokeWidth={2.2}
                                    fill="url(#inflowGrad)"
                                />
                                <Area
                                    dataKey="cashDrop"
                                    name="Cash Drops"
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
                    <span>Digital (TinaVerify)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full border border-dashed border-[#fb923c] bg-[#fb923c]" />
                    <span>Cash drops</span>
                </div>
            </div>
        </div>
    );
}

// 5. Top Selling Dishes Leaderboard
export function TopDishesLeaderboard({
    dishes = [],
}: {
    dishes?: TopSellingDish[];
}) {
    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    Top revenue items
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    Highest grossing menu items today
                </p>

                <div className="mt-5 space-y-4">
                    {dishes.length === 0 ? (
                        <div className="py-8 text-center text-[13px] text-slate-gray">
                            No menu items ordered yet today
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

// 6. Hourly billed vs collected today
export function HourlySalesChart({ data = [] }: { data?: HourlySalesPoint[] }) {
    const hasData = data.some(d => d.billed > 0 || d.collected > 0);

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    Hourly sales today
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    Billed vs collected by hour · ETB
                </p>

                <div className="mt-6 h-[220px] w-full">
                    {!hasData ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            No hourly activity recorded yet today
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
                                    name="Billed"
                                    fill="#fdba74"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="collected"
                                    name="Collected"
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
                    <span>Billed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#e85d04]" />
                    <span>Collected</span>
                </div>
            </div>
        </div>
    );
}

// 7. Station throughput stacked bars
export function StationThroughputChart({
    data = [],
}: {
    data?: StationThroughputPoint[];
}) {
    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    Station throughput
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    Ticket states by prep station today
                </p>

                <div className="mt-6 h-[220px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            No station tickets yet today
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
                                    name="Queued"
                                    stackId="a"
                                    fill="#fdba74"
                                />
                                <Bar
                                    dataKey="inPrep"
                                    name="In prep"
                                    stackId="a"
                                    fill="#f97316"
                                />
                                <Bar
                                    dataKey="ready"
                                    name="Ready"
                                    stackId="a"
                                    fill="#e85d04"
                                />
                                <Bar
                                    dataKey="served"
                                    name="Served"
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

// 8. Orders & covers trailing week
export function OrderVolumeChart({ data = [] }: { data?: OrderVolumePoint[] }) {
    const hasData = data.some(d => d.orders > 0 || d.covers > 0);

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6">
            <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    Orders & covers
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    Trailing 7-day volume
                </p>

                <div className="mt-6 h-[220px] w-full">
                    {!hasData ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            No orders recorded in the last 7 days
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data}
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
                                    name="Orders"
                                    type="monotone"
                                    stroke="#e85d04"
                                    strokeWidth={2.2}
                                    fill="url(#ordersGrad)"
                                />
                                <Area
                                    dataKey="covers"
                                    name="Covers"
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
                    <span>Orders</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#046645]" />
                    <span>Covers</span>
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
    const data = channels.filter(ch => ch.amountValue > 0);
    return (
        <div className="flex h-full flex-col rounded-[16px] border border-hairline bg-card p-5">
            <div>
                <h3 className="text-[14px] font-medium tracking-tight text-foreground">
                    Payment mix
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    Share of logged collections
                </p>
            </div>
            <div className="mt-4 min-h-[220px] flex-1">
                {data.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center text-[13px] text-slate-gray">
                        No payments logged yet
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
    const hasSignal = data.some(row => row.value > 0);
    return (
        <div className="flex h-full flex-col rounded-[16px] border border-hairline bg-card p-5">
            <div>
                <h3 className="text-[14px] font-medium tracking-tight text-foreground">
                    Desk balance
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    Relative cash vs digital vs queues
                </p>
            </div>
            <div className="mt-2 min-h-[240px] flex-1">
                {!hasSignal ? (
                    <div className="flex h-[240px] items-center justify-center text-[13px] text-slate-gray">
                        Waiting for cashier activity
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
                                name="Mix"
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

// Legacy wrappers
export function WeeklySalesChart() {
    return <RevenueVsCollectionsChart />;
}

export function PaymentMixChart() {
    return <PaymentChannelsBreakdown />;
}

export function PlatformGrowthChart() {
    return <RevenueVsCollectionsChart />;
}
