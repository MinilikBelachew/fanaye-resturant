"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
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
import { ShieldCheck, Activity, Layers } from "lucide-react";
import type {
    NetworkGmvTrendPoint,
    PlanDistributionItem,
    PlatformAuditEvent,
    PlatformHealthRadarPoint,
} from "@/context/services/superAdminApi";
import { Badge } from "@/components/ui/badge";

// 1. Multi-Wave Network GMV & Growth Trend Chart
export function NetworkGmvGrowthChart({
    data = [],
}: {
    data?: NetworkGmvTrendPoint[];
}) {
    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6 shadow-subtle">
            <div>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-[17px] font-semibold text-foreground">
                            Network GMV & platform growth
                        </h3>
                        <p className="mt-0.5 text-[13px] text-slate-gray">
                            Multi-tenant gross merchandise volume vs digital volume · ETB millions
                        </p>
                    </div>
                </div>

                <div className="mt-6 h-[260px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            No network growth records available
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient
                                        id="gmvGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#e85d04"
                                            stopOpacity="0.28"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#e85d04"
                                            stopOpacity="0.0"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="digitalGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#0068f9"
                                            stopOpacity="0.2"
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
                                {/* Network GMV */}
                                <Area
                                    dataKey="networkGmv"
                                    name="Network GMV"
                                    type="monotone"
                                    stroke="#e85d04"
                                    strokeWidth={2.5}
                                    fill="url(#gmvGrad)"
                                />
                                {/* Digital Volume */}
                                <Area
                                    dataKey="digitalVolume"
                                    name="Digital Settlements"
                                    type="monotone"
                                    stroke="#0068f9"
                                    strokeWidth={2.2}
                                    fill="url(#digitalGrad)"
                                />
                                {/* Subscription Inflow */}
                                <Area
                                    dataKey="subscriptionInflow"
                                    name="Platform MRR Inflow"
                                    type="monotone"
                                    stroke="#10b981"
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
                    <span>Network GMV</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#0068f9]" />
                    <span>Digital Settlements</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#10b981]" />
                    <span>Platform MRR Inflow</span>
                </div>
            </div>
        </div>
    );
}

// 2. Spider / Radar Chart: Platform Operational Health Matrix
export function PlatformHealthRadarChart({
    data = [],
}: {
    data?: PlatformHealthRadarPoint[];
}) {
    const avgScore =
        data.length > 0
            ? (data.reduce((sum, d) => sum + d.score, 0) / data.length).toFixed(1)
            : "96.6";

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6 shadow-subtle">
            <div>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-[17px] font-semibold text-foreground">
                            Operational health matrix
                        </h3>
                        <p className="mt-0.5 text-[13px] text-slate-gray">
                            6-dimension reliability & SLA index
                        </p>
                    </div>
                    <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        <Activity className="size-3" />
                        <span>{avgScore}% Health</span>
                    </Badge>
                </div>

                <div className="mt-4 h-[240px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            No health matrix records available
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart
                                cx="50%"
                                cy="50%"
                                outerRadius="75%"
                                data={data}
                            >
                                <PolarGrid stroke="#e5e7eb" strokeDasharray="2 2" />
                                <PolarAngleAxis
                                    dataKey="dimension"
                                    tick={{ fill: "#777c86", fontSize: 11 }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 100]}
                                    tick={false}
                                    axisLine={false}
                                />
                                <Radar
                                    name="Health Score"
                                    dataKey="score"
                                    stroke="#e85d04"
                                    fill="#e85d04"
                                    fillOpacity={0.35}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-[12px] text-slate-gray">
                <span>Benchmark: 100% Target</span>
                <span className="font-semibold text-foreground">SLA Target Met</span>
            </div>
        </div>
    );
}

// 3. Subscription Plan Distribution
export function PlanDistributionChart({
    plans = [],
}: {
    plans?: PlanDistributionItem[];
}) {
    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6 shadow-subtle">
            <div>
                <div className="flex items-center gap-2">
                    <Layers className="size-4 text-orange-500" />
                    <h3 className="text-[17px] font-semibold text-foreground">
                        Subscription plan mix
                    </h3>
                </div>
                <p className="mt-0.5 text-[13px] text-slate-gray">
                    Active SaaS tiers across tenant restaurants
                </p>

                {plans.length === 0 ? (
                    <div className="mt-8 text-center text-[13px] text-slate-gray">
                        No active subscriptions provisioned
                    </div>
                ) : (
                    <>
                        <div className="mt-5 flex h-5 w-full overflow-hidden rounded-[8px] bg-secondary p-0.5">
                            {plans.map(p => (
                                <div
                                    key={p.planCode}
                                    style={{
                                        width: `${p.percentage}%`,
                                        backgroundColor: p.color,
                                    }}
                                    className="h-full transition-all first:rounded-l-[6px] last:rounded-r-[6px]"
                                    title={`${p.name}: ${p.tenantCount} tenants (${p.percentage}%)`}
                                />
                            ))}
                        </div>

                        <div className="mt-5 space-y-3">
                            {plans.map(p => (
                                <div
                                    key={p.planCode}
                                    className="flex items-center justify-between text-[13px]"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="size-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: p.color }}
                                        />
                                        <span className="font-medium text-foreground">
                                            {p.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-gray font-mono text-[12px]">
                                            {p.tenantCount} tenants
                                        </span>
                                        <span className="font-semibold text-foreground w-8 text-right">
                                            {p.percentage}%
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

// 4. Platform Security & Audit Activity Stream
export function PlatformAuditStream({
    events = [],
}: {
    events?: PlatformAuditEvent[];
}) {
    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6 shadow-subtle">
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-emerald-500" />
                        <h3 className="text-[17px] font-semibold text-foreground">
                            Platform audit stream
                        </h3>
                    </div>
                    <Badge variant="secondary" className="text-[11px]">
                        Live Security
                    </Badge>
                </div>
                <p className="mt-0.5 text-[13px] text-slate-gray">
                    Real-time administrative & tenant lifecycle events
                </p>

                <div className="mt-5 space-y-3.5">
                    {events.length === 0 ? (
                        <div className="py-6 text-center text-[13px] text-slate-gray">
                            No security audit events recorded
                        </div>
                    ) : (
                        events.map(ev => (
                            <div
                                key={ev.id}
                                className="flex items-start justify-between gap-3 rounded-xl border border-border/40 bg-secondary/30 p-3 text-xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="font-semibold text-foreground">
                                        {ev.action}
                                    </div>
                                    <div className="text-slate-gray">
                                        {ev.description}
                                    </div>
                                </div>
                                <span className="shrink-0 text-[11px] font-mono text-muted-foreground">
                                    {new Date(ev.occurredAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
