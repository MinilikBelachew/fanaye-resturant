"use client";

import { useEffect, useState } from "react";
import {
    useGetSuperAdminMarketingCampaignQuery,
    useUpdateSuperAdminMarketingCampaignMutation,
    type MarketingCampaignStatus,
} from "@/context/services/marketingApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import { Link } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import {
    ArrowLeft,
    Building2,
    Calendar,
    Eye,
    MapPin,
    Receipt,
    Users,
    UtensilsCrossed,
} from "lucide-react";
import {
    ALLOWED_ADMIN_STATUS_TRANSITIONS,
    MarketingStatusBadge,
    STATUS_META,
} from "./MarketingStatusBadge";

function formatDateTime(iso: string | null) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function SuperAdminMarketingDetail({ id }: { id: string }) {
    const {
        data: campaign,
        isLoading,
        isError,
    } = useGetSuperAdminMarketingCampaignQuery(id);

    const [updateCampaign, { isLoading: isUpdating }] =
        useUpdateSuperAdminMarketingCampaignMutation();

    const [nextStatus, setNextStatus] =
        useState<MarketingCampaignStatus>("PENDING");
    const [deliveredViews, setDeliveredViews] = useState<number>(0);
    const [amountDue, setAmountDue] = useState<string>("");
    const [adminNotes, setAdminNotes] = useState<string>("");

    useEffect(() => {
        if (!campaign) return;
        setNextStatus(campaign.status);
        setDeliveredViews(campaign.deliveredViews);
        setAmountDue(
            campaign.amountDue !== null ? String(campaign.amountDue) : "",
        );
        setAdminNotes(campaign.adminNotes ?? "");
    }, [campaign]);

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                Loading promotion request details...
            </div>
        );
    }

    if (isError || !campaign) {
        return (
            <div className="space-y-4 rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Promotion request not found.
                </p>
                <Link
                    href="/super-admin/marketing"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Marketing Requests
                </Link>
            </div>
        );
    }

    const nextLegal = ALLOWED_ADMIN_STATUS_TRANSITIONS[campaign.status] ?? [];
    const pct = Math.min(
        100,
        Math.round(
            (campaign.deliveredViews / Math.max(1, campaign.targetViews)) * 100,
        ),
    );
    const isTerminal = nextLegal.length === 0;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nextStatus === "DONE" && (!amountDue || Number(amountDue) < 0)) {
            toast.error(
                "Please enter the amount due based on delivered views.",
            );
            return;
        }

        try {
            await updateCampaign({
                id: campaign.id,
                status: nextStatus,
                deliveredViews: Number(deliveredViews) || 0,
                ...(amountDue !== "" ? { amountDue: Number(amountDue) } : {}),
                adminNotes: adminNotes.trim() || undefined,
            }).unwrap();
            toast.success("Promotion request updated.");
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to update promotion request.";
            toast.error(msg);
        }
    };

    const timeline = [
        { label: "Requested", at: campaign.createdAt },
        { label: "Confirmed", at: campaign.confirmedAt },
        { label: "Promoting Started", at: campaign.promotedAt },
        { label: "Marked Done", at: campaign.doneAt },
        { label: "Payment Submitted", at: campaign.paymentSubmittedAt },
        { label: "Paid", at: campaign.paidAt },
        { label: "Cancelled", at: campaign.cancelledAt },
    ].filter(item => item.at !== null);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <Link
                    href="/super-admin/marketing"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Marketing Requests
                </Link>
                <MarketingStatusBadge status={campaign.status} />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Left: Dish & Request Info */}
                <div className="space-y-5 lg:col-span-2">
                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            {campaign.menuItemImage ? (
                                <img
                                    src={
                                        filePublicUrl(campaign.menuItemImage) ??
                                        campaign.menuItemImage
                                    }
                                    alt={campaign.menuItemName}
                                    className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover"
                                />
                            ) : (
                                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                                    <UtensilsCrossed className="h-8 w-8" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>
                                        {campaign.tenantName ?? "Restaurant"}
                                    </span>
                                    {campaign.branchName ? (
                                        <span>• {campaign.branchName}</span>
                                    ) : null}
                                </div>
                                <h2 className="text-xl font-bold text-foreground">
                                    {campaign.menuItemName}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Requested by{" "}
                                    <strong className="text-foreground">
                                        {campaign.requestedByName ?? "Manager"}
                                    </strong>{" "}
                                    on {formatDateTime(campaign.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>Target Location</span>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                    {campaign.targetLocation}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>Age Group</span>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                    Ages {campaign.targetAgeMin}–
                                    {campaign.targetAgeMax}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Views Progress</span>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                    {campaign.deliveredViews.toLocaleString()} /{" "}
                                    {campaign.targetViews.toLocaleString()} (
                                    {pct}%)
                                </p>
                                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {campaign.notes ? (
                            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3 text-xs">
                                <span className="font-medium text-foreground">
                                    Restaurant Notes:
                                </span>{" "}
                                <span className="text-muted-foreground">
                                    {campaign.notes}
                                </span>
                            </div>
                        ) : null}

                        {campaign.paymentReference ? (
                            <div className="mt-3 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-xs">
                                <div className="flex items-center gap-1.5 font-medium text-purple-700 dark:text-purple-300">
                                    <Receipt className="h-3.5 w-3.5" />
                                    <span>
                                        Payment Reference:{" "}
                                        {campaign.paymentReference}
                                    </span>
                                </div>
                                {campaign.paymentNotes ? (
                                    <p className="mt-1 text-purple-700/80 dark:text-purple-300/80">
                                        {campaign.paymentNotes}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    {/* Timeline */}
                    <div className="rounded-xl border border-border bg-card p-5">
                        <h3 className="text-sm font-semibold text-foreground">
                            Timeline
                        </h3>
                        <div className="mt-3 space-y-2.5">
                            {timeline.map(step => (
                                <div
                                    key={step.label}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-2 font-medium text-foreground">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{step.label}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {formatDateTime(step.at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Status & Billing Update */}
                <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-base font-semibold text-foreground">
                        Status & Billing
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Select the next legal status and update views or amount
                        due.
                    </p>

                    <form onSubmit={handleSave} className="mt-4 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                Status
                            </label>
                            <select
                                disabled={isTerminal}
                                value={nextStatus}
                                onChange={e =>
                                    setNextStatus(
                                        e.target
                                            .value as MarketingCampaignStatus,
                                    )
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                            >
                                <option value={campaign.status}>
                                    {STATUS_META[campaign.status].label}{" "}
                                    (Current)
                                </option>
                                {nextLegal.map(st => (
                                    <option key={st} value={st}>
                                        {STATUS_META[st].label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                Delivered Views
                            </label>
                            <input
                                type="number"
                                min={0}
                                disabled={isTerminal}
                                value={deliveredViews}
                                onChange={e =>
                                    setDeliveredViews(Number(e.target.value))
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                Amount Due ({campaign.currencyCode})
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                disabled={isTerminal}
                                value={amountDue}
                                onChange={e => setAmountDue(e.target.value)}
                                placeholder="e.g. 1500"
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                Admin Notes (Optional)
                            </label>
                            <textarea
                                rows={3}
                                disabled={isTerminal}
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                                placeholder="Notes for the restaurant..."
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                            />
                        </div>

                        {!isTerminal ? (
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                            >
                                {isUpdating ? "Saving..." : "Update Request"}
                            </button>
                        ) : (
                            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                                This request is{" "}
                                {STATUS_META[campaign.status].label} and cannot
                                be changed further.
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
