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
import { useTranslations } from "next-intl";
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
    const t = useTranslations("superAdmin");

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6 shadow-subtle">
            <div>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-[17px] font-semibold text-foreground">
                            {t("charts.networkGmvTitle")}
                        </h3>
                        <p className="mt-0.5 text-[13px] text-slate-gray">
                            {t("charts.networkGmvSubtitle")}
                        </p>
                    </div>
                </div>

                <div className="mt-6 h-[260px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            {t("charts.networkGmvEmpty")}
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
                                        id="gmvGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#171717"
                                            stopOpacity="0.22"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#171717"
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
                                <Area
                                    dataKey="networkGmv"
                                    name={t("charts.seriesNetworkGmv")}
                                    type="monotone"
                                    stroke="#171717"
                                    strokeWidth={2.5}
                                    fill="url(#gmvGrad)"
                                />
                                <Area
                                    dataKey="digitalVolume"
                                    name={t("charts.seriesDigitalSettlements")}
                                    type="monotone"
                                    stroke="#0068f9"
                                    strokeWidth={2.2}
                                    fill="url(#digitalGrad)"
                                />
                                <Area
                                    dataKey="subscriptionInflow"
                                    name={t("charts.seriesPlatformMrrInflow")}
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
                    <span className="size-2.5 rounded-full bg-[#171717]" />
                    <span>{t("charts.seriesNetworkGmv")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#0068f9]" />
                    <span>{t("charts.seriesDigitalSettlements")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#10b981]" />
                    <span>{t("charts.seriesPlatformMrrInflow")}</span>
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
    const t = useTranslations("superAdmin");
    const avgScore =
        data.length > 0
            ? (data.reduce((sum, d) => sum + d.score, 0) / data.length).toFixed(
                  1,
              )
            : "0";

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6 shadow-subtle">
            <div>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-[17px] font-semibold text-foreground">
                            {t("charts.healthMatrixTitle")}
                        </h3>
                        <p className="mt-0.5 text-[13px] text-slate-gray">
                            {t("charts.healthMatrixSubtitle")}
                        </p>
                    </div>
                    <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    >
                        <Activity className="size-3" />
                        <span>
                            {t("charts.healthBadge", { score: avgScore })}
                        </span>
                    </Badge>
                </div>

                <div className="mt-4 h-[240px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            {t("charts.healthMatrixEmpty")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart
                                cx="50%"
                                cy="50%"
                                outerRadius="75%"
                                data={data}
                            >
                                <PolarGrid
                                    stroke="#e5e7eb"
                                    strokeDasharray="2 2"
                                />
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
                                    name={t("charts.healthScoreSeries")}
                                    dataKey="score"
                                    stroke="#171717"
                                    fill="#171717"
                                    fillOpacity={0.35}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-[12px] text-slate-gray">
                <span>{t("charts.healthDerivedFooter")}</span>
                <span className="font-semibold text-foreground">
                    {t("charts.healthTarget")}
                </span>
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
    const t = useTranslations("superAdmin");

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6 shadow-subtle">
            <div>
                <div className="flex items-center gap-2">
                    <Layers className="size-4 text-foreground" />
                    <h3 className="text-[17px] font-semibold text-foreground">
                        {t("charts.planMixTitle")}
                    </h3>
                </div>
                <p className="mt-0.5 text-[13px] text-slate-gray">
                    {t("charts.planMixSubtitle")}
                </p>

                {plans.length === 0 ? (
                    <div className="mt-8 text-center text-[13px] text-slate-gray">
                        {t("charts.planMixEmpty")}
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
                                    title={t("charts.planBarTitle", {
                                        name: p.name,
                                        count: p.tenantCount,
                                        percentage: p.percentage,
                                    })}
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
                                            {t("charts.planTenantCount", {
                                                count: p.tenantCount,
                                            })}
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
    const t = useTranslations("superAdmin");

    return (
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-hairline bg-card p-6 shadow-subtle">
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-foreground" />
                        <h3 className="text-[17px] font-semibold text-foreground">
                            {t("charts.auditStreamTitle")}
                        </h3>
                    </div>
                    <Badge variant="secondary" className="text-[11px]">
                        {t("charts.auditStreamBadge")}
                    </Badge>
                </div>
                <p className="mt-0.5 text-[13px] text-slate-gray">
                    {t("charts.auditStreamSubtitle")}
                </p>

                <div className="mt-5 space-y-3.5">
                    {events.length === 0 ? (
                        <div className="py-6 text-center text-[13px] text-slate-gray">
                            {t("charts.auditStreamEmpty")}
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
                                    {new Date(ev.occurredAt).toLocaleTimeString(
                                        [],
                                        {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        },
                                    )}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
