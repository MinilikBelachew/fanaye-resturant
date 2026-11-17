"use client";

import { useState } from "react";
import {
    useListSuperAdminMarketingCampaignsQuery,
    useUpdateSuperAdminMarketingCampaignMutation,
    type MarketingCampaign,
    type MarketingCampaignStatus,
} from "@/context/services/marketingApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import { Link, useRouter } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import {
    ArrowUpRight,
    Building2,
    CheckCircle2,
    Clock3,
    Eye,
    MapPin,
    Megaphone,
    Search,
    Users,
    UtensilsCrossed,
    Wallet,
} from "lucide-react";
import {
    ALLOWED_ADMIN_STATUS_TRANSITIONS,
    MarketingPagination,
    MarketingStatusBadge,
    MarketingStatusTabs,
    STATUS_META,
} from "./MarketingStatusBadge";

export default function SuperAdminMarketingBoard() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [status, setStatus] = useState<"ALL" | MarketingCampaignStatus>(
        "ALL",
    );
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const { data, isLoading, isFetching } =
        useListSuperAdminMarketingCampaignsQuery({
            page,
            limit,
            status: status === "ALL" ? undefined : status,
            search: search.trim() || undefined,
        });

    const [updateCampaign] = useUpdateSuperAdminMarketingCampaignMutation();

    const campaigns = data?.items ?? [];
    const counts = data?.counts;

    const handleStatusChange = async (
        campaign: MarketingCampaign,
        nextStatus: MarketingCampaignStatus,
    ) => {
        if (nextStatus === campaign.status) return;

        if (nextStatus === "DONE" && campaign.amountDue === null) {
            toast.info("Enter delivered views & amount due to mark Done.");
            router.push(`/super-admin/marketing/${campaign.id}`);
            return;
        }

        setUpdatingId(campaign.id);
        try {
            await updateCampaign({
                id: campaign.id,
                status: nextStatus,
            }).unwrap();
            toast.success(
                `Status updated to ${STATUS_META[nextStatus].label}.`,
            );
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to update status.";
            toast.error(msg);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="space-y-5">
            {/* KPI Strip */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Pending Confirmation</span>
                        <Clock3 className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                        {counts?.PENDING ?? 0}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Confirmed</span>
                        <CheckCircle2 className="h-4 w-4 text-sky-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                        {counts?.CONFIRMED ?? 0}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Currently Promoting</span>
                        <Megaphone className="h-4 w-4 text-indigo-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                        {counts?.PROMOTING ?? 0}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Awaiting Payment</span>
                        <Wallet className="h-4 w-4 text-orange-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                        {(counts?.DONE ?? 0) + (counts?.PAYMENT_SUBMITTED ?? 0)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search restaurant, dish, or location..."
                        className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none focus:border-primary"
                    />
                </div>

                <MarketingStatusTabs
                    value={status}
                    counts={counts}
                    onChange={next => {
                        setStatus(next);
                        setPage(1);
                    }}
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    Restaurant & Dish
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Target Audience
                                </th>
                                <th className="px-4 py-3 font-medium">Views</th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Amount Due
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        Loading promotion queue...
                                    </td>
                                </tr>
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        No promotion requests match the current
                                        filter.
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map(c => {
                                    const nextLegal =
                                        ALLOWED_ADMIN_STATUS_TRANSITIONS[
                                            c.status
                                        ] ?? [];
                                    const isRowUpdating = updatingId === c.id;
                                    return (
                                        <tr
                                            key={c.id}
                                            className={`transition hover:bg-muted/30 ${
                                                isFetching ? "opacity-75" : ""
                                            }`}
                                        >
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/super-admin/marketing/${c.id}`}
                                                    className="group flex items-center gap-3"
                                                >
                                                    {c.menuItemImage ? (
                                                        <img
                                                            src={
                                                                filePublicUrl(
                                                                    c.menuItemImage,
                                                                ) ??
                                                                c.menuItemImage
                                                            }
                                                            alt={c.menuItemName}
                                                            className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                                                            <UtensilsCrossed className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            <span>
                                                                {c.tenantName ??
                                                                    "Tenant"}
                                                            </span>
                                                        </div>
                                                        <div className="mt-0.5 font-medium text-foreground group-hover:text-primary">
                                                            {c.menuItemName}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-foreground">
                                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>
                                                        {c.targetLocation}
                                                    </span>
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Users className="h-3 w-3" />
                                                    <span>
                                                        Ages {c.targetAgeMin}–
                                                        {c.targetAgeMax}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>
                                                        {c.deliveredViews.toLocaleString()}{" "}
                                                        /{" "}
                                                        {c.targetViews.toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {nextLegal.length > 0 ? (
                                                    <select
                                                        aria-label={`Change status for ${c.menuItemName}`}
                                                        value={c.status}
                                                        disabled={isRowUpdating}
                                                        onChange={e =>
                                                            handleStatusChange(
                                                                c,
                                                                e.target
                                                                    .value as MarketingCampaignStatus,
                                                            )
                                                        }
                                                        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary disabled:opacity-50"
                                                    >
                                                        <option
                                                            value={c.status}
                                                        >
                                                            {
                                                                STATUS_META[
                                                                    c.status
                                                                ].label
                                                            }
                                                        </option>
                                                        {nextLegal.map(st => (
                                                            <option
                                                                key={st}
                                                                value={st}
                                                            >
                                                                →{" "}
                                                                {
                                                                    STATUS_META[
                                                                        st
                                                                    ].label
                                                                }
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <MarketingStatusBadge
                                                        status={c.status}
                                                    />
                                                )}
                                                {c.paymentReference ? (
                                                    <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-300">
                                                        Ref:{" "}
                                                        {c.paymentReference}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {c.amountDue !== null
                                                    ? `${c.amountDue.toLocaleString()} ${c.currencyCode}`
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/super-admin/marketing/${c.id}`}
                                                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                                                >
                                                    <span>View</span>
                                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <MarketingPagination
                    page={data?.page ?? page}
                    limit={data?.limit ?? limit}
                    total={data?.total ?? 0}
                    totalPages={data?.totalPages ?? 1}
                    onPageChange={setPage}
                    onLimitChange={nextLimit => {
                        setLimit(nextLimit);
                        setPage(1);
                    }}
                />
            </div>
        </div>
    );
}
