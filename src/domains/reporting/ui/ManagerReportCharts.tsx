"use client";

import { useMemo, type ReactNode } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { formatEtb } from "@/lib/money";

const BRAND = "var(--brand, #e85d04)";
const MUTED = "var(--slate-gray, #94a3b8)";
const SUCCESS = "#059669";
const DANGER = "#dc2626";
const WARNING = "#d97706";
const SOFT = ["#e85d04", "#0d9488", "#2563eb", "#ca8a04", "#db2777", "#64748b"];

function ChartShell({
    title,
    subtitle,
    children,
    empty,
    isEmpty,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    empty: string;
    isEmpty?: boolean;
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-card">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand/[0.06] to-transparent"
            />
            <div className="relative p-4 sm:p-5">
                <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                    {title}
                </h3>
                {subtitle ? (
                    <p className="mt-0.5 text-[12px] text-slate-gray">
                        {subtitle}
                    </p>
                ) : null}
                <div className="mt-4 h-[220px] w-full">
                    {isEmpty ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            {empty}
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </div>
        </div>
    );
}

function MoneyTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value?: number; name?: string; color?: string }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-hairline bg-card px-3 py-2 shadow-sm">
            {label ? (
                <p className="mb-1 text-[11px] font-medium text-foreground">
                    {label}
                </p>
            ) : null}
            {payload.map(entry => (
                <p
                    key={entry.name}
                    className="text-[12px] tabular-nums text-slate-gray"
                >
                    <span style={{ color: entry.color }}>{entry.name}</span>
                    {": "}
                    <span className="font-medium text-foreground">
                        {formatEtb(Number(entry.value ?? 0))}
                    </span>
                </p>
            ))}
        </div>
    );
}

export function WaiterSalesBarChart({
    rows,
    title,
    subtitle,
    empty,
    salesLabel,
}: {
    rows: Array<{ waiterName: string; netAttributedSales: string }>;
    title: string;
    subtitle: string;
    empty: string;
    salesLabel: string;
}) {
    const data = useMemo(
        () =>
            rows.slice(0, 8).map(r => ({
                name:
                    r.waiterName.length > 12
                        ? `${r.waiterName.slice(0, 11)}…`
                        : r.waiterName,
                sales: Number(r.netAttributedSales) || 0,
            })),
        [rows],
    );

    return (
        <ChartShell
            title={title}
            subtitle={subtitle}
            empty={empty}
            isEmpty={data.length === 0 || data.every(d => d.sales === 0)}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="var(--hairline, #e2e8f0)"
                    />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: MUTED }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v =>
                            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                        }
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{ fontSize: 11, fill: MUTED }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<MoneyTooltip />} />
                    <Bar
                        dataKey="sales"
                        name={salesLabel}
                        fill={BRAND}
                        radius={[0, 8, 8, 0]}
                        maxBarSize={22}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartShell>
    );
}

export function ApprovalDecisionDonut({
    approved,
    rejected,
    pending,
    title,
    subtitle,
    empty,
    labels,
}: {
    approved: number;
    rejected: number;
    pending: number;
    title: string;
    subtitle: string;
    empty: string;
    labels: { approved: string; rejected: string; pending: string };
}) {
    const data = useMemo(
        () =>
            [
                {
                    name: labels.approved,
                    value: approved,
                    color: SUCCESS,
                },
                {
                    name: labels.rejected,
                    value: rejected,
                    color: DANGER,
                },
                {
                    name: labels.pending,
                    value: pending,
                    color: WARNING,
                },
            ].filter(d => d.value > 0),
        [approved, rejected, pending, labels],
    );
    const total = approved + rejected + pending;

    return (
        <ChartShell
            title={title}
            subtitle={subtitle}
            empty={empty}
            isEmpty={total === 0}
        >
            <div className="flex h-full items-center gap-4">
                <div className="h-full min-w-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                                strokeWidth={0}
                            >
                                {data.map(entry => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={value => [Number(value ?? 0), ""]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <ul className="w-[120px] shrink-0 space-y-2 text-[12px]">
                    {data.map(entry => (
                        <li
                            key={entry.name}
                            className="flex items-center justify-between gap-2"
                        >
                            <span className="flex items-center gap-1.5 text-slate-gray">
                                <span
                                    className="size-2 rounded-full"
                                    style={{ background: entry.color }}
                                />
                                {entry.name}
                            </span>
                            <span className="font-semibold tabular-nums text-foreground">
                                {entry.value}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </ChartShell>
    );
}

export function CancelledItemsBarChart({
    items,
    title,
    subtitle,
    empty,
    countLabel,
}: {
    items: Array<{ itemName: string; count: number; value: string }>;
    title: string;
    subtitle: string;
    empty: string;
    countLabel: string;
}) {
    const data = useMemo(
        () =>
            items.slice(0, 6).map(item => ({
                name:
                    item.itemName.length > 14
                        ? `${item.itemName.slice(0, 13)}…`
                        : item.itemName,
                count: item.count,
                value: Number(item.value) || 0,
            })),
        [items],
    );

    return (
        <ChartShell
            title={title}
            subtitle={subtitle}
            empty={empty}
            isEmpty={data.length === 0}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, left: 0, bottom: 28 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--hairline, #e2e8f0)"
                    />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: MUTED }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={50}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: MUTED }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        formatter={value => [Number(value ?? 0), countLabel]}
                    />
                    <Bar
                        dataKey="count"
                        name={countLabel}
                        radius={[8, 8, 0, 0]}
                        maxBarSize={36}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={SOFT[i % SOFT.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartShell>
    );
}

export function InventoryWasteBarChart({
    items,
    title,
    subtitle,
    empty,
    valueLabel,
}: {
    items: Array<{ name: string; value: string; qty: number }>;
    title: string;
    subtitle: string;
    empty: string;
    valueLabel: string;
}) {
    const data = useMemo(
        () =>
            items.slice(0, 6).map(item => ({
                name:
                    item.name.length > 12
                        ? `${item.name.slice(0, 11)}…`
                        : item.name,
                value: Number(item.value) || 0,
            })),
        [items],
    );

    return (
        <ChartShell
            title={title}
            subtitle={subtitle}
            empty={empty}
            isEmpty={data.length === 0}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--hairline, #e2e8f0)"
                    />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: MUTED }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: MUTED }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v =>
                            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                        }
                    />
                    <Tooltip content={<MoneyTooltip />} />
                    <Bar
                        dataKey="value"
                        name={valueLabel}
                        fill={WARNING}
                        radius={[8, 8, 0, 0]}
                        maxBarSize={40}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartShell>
    );
}

export function InventoryMixDonut({
    stockValue,
    wasteValue,
    receiveValue,
    title,
    subtitle,
    empty,
    labels,
}: {
    stockValue: number;
    wasteValue: number;
    receiveValue: number;
    title: string;
    subtitle: string;
    empty: string;
    labels: { stock: string; waste: string; receive: string };
}) {
    const data = useMemo(
        () =>
            [
                { name: labels.stock, value: stockValue, color: BRAND },
                { name: labels.waste, value: wasteValue, color: WARNING },
                { name: labels.receive, value: receiveValue, color: SUCCESS },
            ].filter(d => d.value > 0),
        [stockValue, wasteValue, receiveValue, labels],
    );

    return (
        <ChartShell
            title={title}
            subtitle={subtitle}
            empty={empty}
            isEmpty={data.length === 0}
        >
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={2}
                        strokeWidth={0}
                    >
                        {data.map(entry => (
                            <Cell key={entry.name} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<MoneyTooltip />} />
                </PieChart>
            </ResponsiveContainer>
        </ChartShell>
    );
}

export function CashByWaiterChart({
    rows,
    title,
    subtitle,
    empty,
    labels,
}: {
    rows: Array<{
        waiterName: string;
        dropped: string;
        undropped: string;
    }>;
    title: string;
    subtitle: string;
    empty: string;
    labels: { dropped: string; undropped: string };
}) {
    const data = useMemo(
        () =>
            rows.slice(0, 8).map(r => ({
                name:
                    r.waiterName.length > 10
                        ? `${r.waiterName.slice(0, 9)}…`
                        : r.waiterName,
                dropped: Number(r.dropped) || 0,
                undropped: Number(r.undropped) || 0,
            })),
        [rows],
    );

    return (
        <ChartShell
            title={title}
            subtitle={subtitle}
            empty={empty}
            isEmpty={
                data.length === 0 ||
                data.every(d => d.dropped === 0 && d.undropped === 0)
            }
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--hairline, #e2e8f0)"
                    />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: MUTED }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: MUTED }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v =>
                            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                        }
                    />
                    <Tooltip content={<MoneyTooltip />} />
                    <Bar
                        dataKey="dropped"
                        name={labels.dropped}
                        fill={SUCCESS}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                    />
                    <Bar
                        dataKey="undropped"
                        name={labels.undropped}
                        fill={WARNING}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartShell>
    );
}

export function StationPrepBarChart({
    rows,
    title,
    subtitle,
    empty,
    labels,
}: {
    rows: Array<{
        stationName: string;
        avgPrepMinutes: number;
        delayedRate: number;
        ticketsCompleted: number;
    }>;
    title: string;
    subtitle: string;
    empty: string;
    labels: { prep: string; delayed: string };
}) {
    const data = useMemo(
        () =>
            rows.map(r => ({
                name:
                    r.stationName.length > 10
                        ? `${r.stationName.slice(0, 9)}…`
                        : r.stationName,
                prep: r.avgPrepMinutes,
                delayed: r.delayedRate,
            })),
        [rows],
    );

    return (
        <ChartShell
            title={title}
            subtitle={subtitle}
            empty={empty}
            isEmpty={data.length === 0 || data.every(d => d.prep === 0)}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--hairline, #e2e8f0)"
                    />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: MUTED }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: MUTED }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip />
                    <Bar
                        dataKey="prep"
                        name={labels.prep}
                        fill={BRAND}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                    />
                    <Bar
                        dataKey="delayed"
                        name={labels.delayed}
                        fill={DANGER}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartShell>
    );
}
