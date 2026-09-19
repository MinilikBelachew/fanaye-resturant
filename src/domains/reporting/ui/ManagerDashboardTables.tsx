"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import type {
    PaymentChannelBreakdownItem,
    RevenueVsCollectionsPoint,
    TopSellingDish,
} from "@/context/services/managerDashboardApi";
import type { AuditEventRow } from "@/context/services/auditApi";
import { cn } from "@/lib/utils";

function Panel({
    title,
    subtitle,
    action,
    children,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-full flex-col rounded-[16px] border border-hairline bg-card">
            <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
                <div>
                    <h3 className="text-[15px] font-semibold tracking-tight">
                        {title}
                    </h3>
                    {subtitle ? (
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
                {action}
            </div>
            <div className="min-h-0 flex-1 overflow-x-auto">{children}</div>
        </div>
    );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-5 py-10 text-center text-[13px] text-slate-gray"
            >
                {label}
            </td>
        </tr>
    );
}

export function SalesTrendTable({
    data = [],
}: {
    data?: RevenueVsCollectionsPoint[];
}) {
    return (
        <Panel
            title="7-day sales ledger"
            subtitle="Gross · net · collections by day"
        >
            <table className="w-full min-w-[480px] text-left text-[13px]">
                <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide text-slate-gray">
                    <tr>
                        <th className="px-5 py-2.5 font-medium">Day</th>
                        <th className="px-3 py-2.5 font-medium">Gross</th>
                        <th className="px-3 py-2.5 font-medium">Net</th>
                        <th className="px-5 py-2.5 font-medium">Collected</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <EmptyRow
                            colSpan={4}
                            label="No sales recorded in the last 7 days."
                        />
                    ) : (
                        data.map(row => (
                            <tr
                                key={row.period}
                                className="border-t border-hairline"
                            >
                                <td className="px-5 py-2.5 font-medium">
                                    {row.period}
                                </td>
                                <td className="px-3 py-2.5 tabular-nums">
                                    {formatEtb(row.grossSales)}
                                </td>
                                <td className="px-3 py-2.5 tabular-nums">
                                    {formatEtb(row.netRevenue)}
                                </td>
                                <td className="px-5 py-2.5 tabular-nums text-emerald-700 dark:text-emerald-400">
                                    {formatEtb(row.collections)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </Panel>
    );
}

export function PaymentChannelsTable({
    channels = [],
}: {
    channels?: PaymentChannelBreakdownItem[];
}) {
    const t = useTranslations("dashboardCharts");

    return (
        <Panel
            title={t("paymentMixTitle")}
            subtitle={t("paymentMixTableSubtitle")}
        >
            <table className="w-full min-w-[360px] text-left text-[13px]">
                <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide text-slate-gray">
                    <tr>
                        <th className="px-5 py-2.5 font-medium">
                            {t("channel")}
                        </th>
                        <th className="px-3 py-2.5 font-medium">
                            {t("share")}
                        </th>
                        <th className="px-5 py-2.5 font-medium">
                            {t("amount")}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {channels.length === 0 ? (
                        <EmptyRow colSpan={3} label={t("paymentsEmpty")} />
                    ) : (
                        channels.map(row => (
                            <tr
                                key={row.id}
                                className="border-t border-hairline"
                            >
                                <td className="px-5 py-2.5">
                                    <span className="inline-flex items-center gap-2">
                                        <span
                                            className="size-2.5 rounded-full"
                                            style={{ background: row.color }}
                                        />
                                        {row.name}
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 tabular-nums">
                                    {row.sharePercentage.toFixed(1)}%
                                </td>
                                <td className="px-5 py-2.5 font-medium tabular-nums">
                                    {row.amountFormatted}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </Panel>
    );
}

export function TopDishesTable({ dishes = [] }: { dishes?: TopSellingDish[] }) {
    return (
        <Panel title="Top dishes" subtitle="By revenue today">
            <table className="w-full min-w-[420px] text-left text-[13px]">
                <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide text-slate-gray">
                    <tr>
                        <th className="px-5 py-2.5 font-medium">Dish</th>
                        <th className="px-3 py-2.5 font-medium">Orders</th>
                        <th className="px-3 py-2.5 font-medium">Share</th>
                        <th className="px-5 py-2.5 font-medium">Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    {dishes.length === 0 ? (
                        <EmptyRow
                            colSpan={4}
                            label="No dish sales recorded for this date."
                        />
                    ) : (
                        dishes.map((row, index) => (
                            <tr
                                key={`${row.name}-${index}`}
                                className="border-t border-hairline"
                            >
                                <td className="px-5 py-2.5">
                                    <p className="font-medium">{row.name}</p>
                                    <p className="text-[11px] text-slate-gray">
                                        {row.category}
                                    </p>
                                </td>
                                <td className="px-3 py-2.5 tabular-nums">
                                    {row.orders}
                                </td>
                                <td className="px-3 py-2.5 tabular-nums">
                                    {row.percent.toFixed(0)}%
                                </td>
                                <td className="px-5 py-2.5 font-medium tabular-nums">
                                    {formatEtb(row.revenue)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </Panel>
    );
}

export function RecentAuditTable({
    events = [],
}: {
    events?: AuditEventRow[];
}) {
    return (
        <Panel
            title="Recent branch activity"
            subtitle="Tenant-scoped audit trail"
            action={
                <Link
                    href="/manager/audit"
                    className="text-[12px] font-medium text-brand hover:underline"
                >
                    Open audit
                </Link>
            }
        >
            <table className="w-full min-w-[520px] text-left text-[13px]">
                <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide text-slate-gray">
                    <tr>
                        <th className="px-5 py-2.5 font-medium">When</th>
                        <th className="px-3 py-2.5 font-medium">Action</th>
                        <th className="px-3 py-2.5 font-medium">Staff</th>
                        <th className="px-5 py-2.5 font-medium">Domain</th>
                    </tr>
                </thead>
                <tbody>
                    {events.length === 0 ? (
                        <EmptyRow
                            colSpan={4}
                            label="No recent audit events for this restaurant."
                        />
                    ) : (
                        events.map(row => (
                            <tr
                                key={row.id}
                                className="border-t border-hairline"
                            >
                                <td className="px-5 py-2.5 text-slate-gray">
                                    {row.timestampLabel}
                                </td>
                                <td className="px-3 py-2.5 font-medium">
                                    {row.actionLabel || row.action}
                                </td>
                                <td className="px-3 py-2.5">
                                    <p>{row.actorName}</p>
                                    <p className="text-[11px] text-slate-gray">
                                        {row.actorRole}
                                    </p>
                                </td>
                                <td className="px-5 py-2.5">
                                    <span
                                        className={cn(
                                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                                            row.badgeVariant === "success" &&
                                                "bg-emerald-500/10 text-emerald-700",
                                            row.badgeVariant === "warning" &&
                                                "bg-amber-500/10 text-amber-700",
                                            row.badgeVariant === "secondary" &&
                                                "bg-secondary text-slate-gray",
                                            row.badgeVariant === "default" &&
                                                "bg-brand/10 text-brand",
                                        )}
                                    >
                                        {row.badgeLabel || row.category}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </Panel>
    );
}

export function FloorSnapshotTable({
    tables = [],
}: {
    tables?: Array<{
        tableId: string;
        displayName?: string | null;
        displayNumber?: string | null;
        locationName?: string | null;
        waiterName?: string | null;
        cookingItemCount?: number;
        readyItemCount?: number;
        tableSessionId?: string | null;
    }>;
}) {
    const open = tables.filter(t => Boolean(t.tableSessionId)).slice(0, 8);

    return (
        <Panel
            title="Open floor"
            subtitle="Active table sessions right now"
            action={
                <Link
                    href="/manager/live"
                    className="text-[12px] font-medium text-brand hover:underline"
                >
                    Live ops
                </Link>
            }
        >
            <table className="w-full min-w-[420px] text-left text-[13px]">
                <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide text-slate-gray">
                    <tr>
                        <th className="px-5 py-2.5 font-medium">Table</th>
                        <th className="px-3 py-2.5 font-medium">Waiter</th>
                        <th className="px-3 py-2.5 font-medium">Cooking</th>
                        <th className="px-5 py-2.5 font-medium">Ready</th>
                    </tr>
                </thead>
                <tbody>
                    {open.length === 0 ? (
                        <EmptyRow
                            colSpan={4}
                            label="All tables free — no open sessions."
                        />
                    ) : (
                        open.map(row => (
                            <tr
                                key={row.tableId}
                                className="border-t border-hairline"
                            >
                                <td className="px-5 py-2.5">
                                    <p className="font-medium">
                                        {row.displayNumber ??
                                            row.displayName ??
                                            "Table"}
                                    </p>
                                    <p className="text-[11px] text-slate-gray">
                                        {row.locationName ?? "Floor"}
                                    </p>
                                </td>
                                <td className="px-3 py-2.5">
                                    {row.waiterName ?? "—"}
                                </td>
                                <td className="px-3 py-2.5 tabular-nums">
                                    {row.cookingItemCount ?? 0}
                                </td>
                                <td className="px-5 py-2.5 tabular-nums text-brand">
                                    {row.readyItemCount ?? 0}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </Panel>
    );
}
