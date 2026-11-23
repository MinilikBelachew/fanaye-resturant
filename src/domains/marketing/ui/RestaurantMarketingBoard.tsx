"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    useCancelMarketingCampaignMutation,
    useCreateMarketingCampaignMutation,
    useListMarketingCampaignsQuery,
    useSubmitMarketingPaymentMutation,
    type MarketingCampaign,
    type MarketingCampaignStatus,
} from "@/context/services/marketingApi";
import { useAdminMenuItemsQuery } from "@/context/services/menuApi";
import {
    adminMenuItemToCatalog,
    filePublicUrl,
} from "@/domains/catalog/application/mapAdminMenu";
import { toast } from "@/lib/toast";
import {
    CheckCircle2,
    ChevronDown,
    Eye,
    MapPin,
    Megaphone,
    Plus,
    Search,
    Users,
    UtensilsCrossed,
    Wallet,
    X,
} from "lucide-react";
import {
    MarketingPagination,
    MarketingStatusBadge,
    MarketingStatusTabs,
} from "./MarketingStatusBadge";

const LOCATION_PRESETS = ["Bole", "Kazanchis", "Piassa", "Sarbet", "CMC"];
const VIEW_PRESETS = [5000, 10000, 25000, 50000];

export default function RestaurantMarketingBoard() {
    const t = useTranslations("marketing");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [status, setStatus] = useState<"ALL" | MarketingCampaignStatus>(
        "ALL",
    );
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [dishMenuOpen, setDishMenuOpen] = useState(false);
    const [dishSearch, setDishSearch] = useState("");
    const [payTarget, setPayTarget] = useState<MarketingCampaign | null>(null);

    // Create form state (no channel, no price)
    const [menuItemId, setMenuItemId] = useState("");
    const [targetLocation, setTargetLocation] = useState("Bole");
    const [targetAgeMin, setTargetAgeMin] = useState(18);
    const [targetAgeMax, setTargetAgeMax] = useState(35);
    const [targetViews, setTargetViews] = useState(10000);
    const [notes, setNotes] = useState("");

    // Payment form state
    const [paymentReference, setPaymentReference] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");

    const { data, isLoading, isFetching } = useListMarketingCampaignsQuery({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        search: search.trim() || undefined,
    });
    const { data: menuData } = useAdminMenuItemsQuery();
    const [createCampaign, { isLoading: isCreating }] =
        useCreateMarketingCampaignMutation();
    const [cancelCampaign, { isLoading: isCancelling }] =
        useCancelMarketingCampaignMutation();
    const [submitPayment, { isLoading: isPaying }] =
        useSubmitMarketingPaymentMutation();

    const menuItems = (menuData?.data ?? []).filter(
        item => item.status === "ACTIVE",
    );
    const getDishImage = (item: (typeof menuItems)[number]) => {
        const mapped = adminMenuItemToCatalog(item);
        return (
            mapped.image ||
            filePublicUrl(item.imageUrl) ||
            item.imageUrl ||
            null
        );
    };
    const selectedDish = menuItems.find(item => item.id === menuItemId) ?? null;
    const filteredDishes = menuItems.filter(item =>
        item.name.toLowerCase().includes(dishSearch.trim().toLowerCase()),
    );
    const campaigns = data?.items ?? [];
    const counts = data?.counts;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!menuItemId) {
            toast.error(t("selectDishRequired"));
            return;
        }
        if (!targetLocation.trim()) {
            toast.error(t("locationRequired"));
            return;
        }
        if (targetAgeMin > targetAgeMax) {
            toast.error("Minimum age cannot be greater than maximum age.");
            return;
        }

        try {
            await createCampaign({
                menuItemId,
                targetLocation: targetLocation.trim(),
                targetAgeMin: Number(targetAgeMin),
                targetAgeMax: Number(targetAgeMax),
                targetViews: Number(targetViews),
                notes: notes.trim() || undefined,
            }).unwrap();
            toast.success(t("broadcastSuccess"));
            setCreateOpen(false);
            setMenuItemId("");
            setNotes("");
            setPage(1);
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to send promotion request.";
            toast.error(msg);
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await cancelCampaign(id).unwrap();
            toast.success("Promotion request cancelled.");
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Could not cancel request.";
            toast.error(msg);
        }
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payTarget) return;
        if (!paymentReference.trim()) {
            toast.error("Please enter a payment reference or receipt number.");
            return;
        }

        try {
            await submitPayment({
                id: payTarget.id,
                paymentReference: paymentReference.trim(),
                paymentNotes: paymentNotes.trim() || undefined,
            }).unwrap();
            toast.success("Payment submitted for verification.");
            setPayTarget(null);
            setPaymentReference("");
            setPaymentNotes("");
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to submit payment.";
            toast.error(msg);
        }
    };

    return (
        <div className="space-y-5">
            {/* KPI Strip */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Total Requests</span>
                        <Megaphone className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                        {counts?.ALL ?? 0}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Currently Promoting</span>
                        <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                        {counts?.PROMOTING ?? 0}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Delivered Views</span>
                        <Eye className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                        {(data?.totalDeliveredViews ?? 0).toLocaleString()}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Amount Due</span>
                        <Wallet className="h-4 w-4 text-orange-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                        {(data?.totalAmountDue ?? 0).toLocaleString()}{" "}
                        <span className="text-xs font-medium text-muted-foreground">
                            ETB
                        </span>
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search dish or location..."
                            className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        New Promotion Request
                    </button>
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
                                <th className="px-4 py-3 font-medium">Dish</th>
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
                                    Action
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
                                        Loading promotion requests...
                                    </td>
                                </tr>
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        No promotion requests found. Click{" "}
                                        <strong>New Promotion Request</strong>{" "}
                                        to promote a dish.
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map(c => {
                                    const pct = Math.min(
                                        100,
                                        Math.round(
                                            (c.deliveredViews /
                                                Math.max(1, c.targetViews)) *
                                                100,
                                        ),
                                    );
                                    return (
                                        <tr
                                            key={c.id}
                                            className={`transition hover:bg-muted/30 ${
                                                isFetching ? "opacity-75" : ""
                                            }`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
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
                                                        <div className="font-medium text-foreground">
                                                            {c.menuItemName}
                                                        </div>
                                                        {c.notes ? (
                                                            <div className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">
                                                                {c.notes}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
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
                                                <div className="text-xs font-medium text-foreground">
                                                    {c.deliveredViews.toLocaleString()}{" "}
                                                    /{" "}
                                                    {c.targetViews.toLocaleString()}
                                                </div>
                                                <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <MarketingStatusBadge
                                                    status={c.status}
                                                />
                                                {c.adminNotes ? (
                                                    <div className="mt-1 max-w-[180px] truncate text-[11px] text-muted-foreground">
                                                        {c.adminNotes}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {c.amountDue !== null
                                                    ? `${c.amountDue.toLocaleString()} ${c.currencyCode}`
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    {c.status === "DONE" ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPayTarget(c)
                                                            }
                                                            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                                                        >
                                                            Pay Now
                                                        </button>
                                                    ) : null}
                                                    {(c.status === "PENDING" ||
                                                        c.status ===
                                                            "CONFIRMED") && (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isCancelling
                                                            }
                                                            onClick={() =>
                                                                handleCancel(
                                                                    c.id,
                                                                )
                                                            }
                                                            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/10"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {c.status ===
                                                        "PAYMENT_SUBMITTED" && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Ref:{" "}
                                                            {c.paymentReference}
                                                        </span>
                                                    )}
                                                </div>
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

            {/* New Promotion Request Side Sheet */}
            {createOpen ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
                    <div
                        className="fixed inset-0"
                        onClick={() => setCreateOpen(false)}
                    />
                    <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
                        <div className="flex items-start justify-between border-b border-border px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    New Promotion Request
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Choose the dish, audience, and target views.
                                    Our team will confirm and promote it.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCreateOpen(false)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreate}
                            className="flex flex-1 flex-col overflow-y-auto px-6 py-5"
                        >
                            <div className="flex-1 space-y-4">
                                <div className="relative">
                                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                                        Dish to Promote
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDishMenuOpen(prev => !prev)
                                        }
                                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition hover:border-primary/60 focus:border-primary focus:outline-none"
                                    >
                                        {selectedDish ? (
                                            <div className="flex min-w-0 items-center gap-3">
                                                {getDishImage(selectedDish) ? (
                                                    <img
                                                        src={
                                                            getDishImage(
                                                                selectedDish,
                                                            ) ?? undefined
                                                        }
                                                        alt={selectedDish.name}
                                                        className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                                                        <UtensilsCrossed className="h-4 w-4" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium text-foreground">
                                                        {selectedDish.name}
                                                    </div>
                                                    {selectedDish.categoryName ? (
                                                        <div className="truncate text-xs text-muted-foreground">
                                                            {
                                                                selectedDish.categoryName
                                                            }
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Select a dish...
                                            </span>
                                        )}
                                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </button>

                                    {dishMenuOpen ? (
                                        <div className="absolute right-0 left-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                                            <div className="border-b border-border p-2">
                                                <div className="relative">
                                                    <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        value={dishSearch}
                                                        onChange={e =>
                                                            setDishSearch(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Search dishes..."
                                                        className="w-full rounded-lg border border-border bg-background py-1.5 pr-2.5 pl-8 text-xs text-foreground outline-none focus:border-primary"
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto p-1.5">
                                                {filteredDishes.length === 0 ? (
                                                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                                        No dishes match your
                                                        search.
                                                    </div>
                                                ) : (
                                                    filteredDishes.map(item => {
                                                        const img =
                                                            getDishImage(item);
                                                        const active =
                                                            item.id ===
                                                            menuItemId;
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setMenuItemId(
                                                                        item.id,
                                                                    );
                                                                    setDishMenuOpen(
                                                                        false,
                                                                    );
                                                                }}
                                                                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                                                                    active
                                                                        ? "bg-primary-soft text-primary"
                                                                        : "hover:bg-muted"
                                                                }`}
                                                            >
                                                                {img ? (
                                                                    <img
                                                                        src={
                                                                            img
                                                                        }
                                                                        alt={
                                                                            item.name
                                                                        }
                                                                        className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                                                                        <UtensilsCrossed className="h-4 w-4" />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="truncate font-medium text-foreground">
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </div>
                                                                    {item.categoryName ? (
                                                                        <div className="truncate text-xs text-muted-foreground">
                                                                            {
                                                                                item.categoryName
                                                                            }
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Target Location
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={targetLocation}
                                        onChange={e =>
                                            setTargetLocation(e.target.value)
                                        }
                                        placeholder="e.g. Bole"
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                    />
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {LOCATION_PRESETS.map(loc => (
                                            <button
                                                key={loc}
                                                type="button"
                                                onClick={() =>
                                                    setTargetLocation(loc)
                                                }
                                                className={`rounded-md border px-2 py-0.5 text-xs ${
                                                    targetLocation === loc
                                                        ? "border-primary bg-primary-soft text-primary"
                                                        : "border-border text-muted-foreground hover:bg-muted"
                                                }`}
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Min Age
                                        </label>
                                        <input
                                            type="number"
                                            min={13}
                                            max={99}
                                            required
                                            value={targetAgeMin}
                                            onChange={e =>
                                                setTargetAgeMin(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Max Age
                                        </label>
                                        <input
                                            type="number"
                                            min={13}
                                            max={99}
                                            required
                                            value={targetAgeMax}
                                            onChange={e =>
                                                setTargetAgeMax(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Target Views
                                    </label>
                                    <input
                                        type="number"
                                        min={100}
                                        step={100}
                                        required
                                        value={targetViews}
                                        onChange={e =>
                                            setTargetViews(
                                                Number(e.target.value),
                                            )
                                        }
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                    />
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {VIEW_PRESETS.map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() =>
                                                    setTargetViews(v)
                                                }
                                                className={`rounded-md border px-2 py-0.5 text-xs ${
                                                    targetViews === v
                                                        ? "border-primary bg-primary-soft text-primary"
                                                        : "border-border text-muted-foreground hover:bg-muted"
                                                }`}
                                            >
                                                {v.toLocaleString()} views
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Any special offer or message for the promotion..."
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                                <button
                                    type="button"
                                    onClick={() => setCreateOpen(false)}
                                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                >
                                    {isCreating ? "Sending..." : "Send Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {/* Payment Side Sheet */}
            {payTarget ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
                    <div
                        className="fixed inset-0"
                        onClick={() => setPayTarget(null)}
                    />
                    <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">
                                Pay for Promotion
                            </h2>
                            <button
                                type="button"
                                onClick={() => setPayTarget(null)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Dish:
                                </span>
                                <span className="font-medium text-foreground">
                                    {payTarget.menuItemName}
                                </span>
                            </div>
                            <div className="mt-1 flex justify-between">
                                <span className="text-muted-foreground">
                                    Delivered Views:
                                </span>
                                <span className="font-medium text-foreground">
                                    {payTarget.deliveredViews.toLocaleString()}
                                </span>
                            </div>
                            <div className="mt-1 flex justify-between">
                                <span className="text-muted-foreground">
                                    Amount Due:
                                </span>
                                <span className="font-bold text-primary">
                                    {(
                                        payTarget.amountDue ?? 0
                                    ).toLocaleString()}{" "}
                                    {payTarget.currencyCode}
                                </span>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmitPayment}
                            className="mt-4 space-y-3"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-medium text-foreground">
                                    Payment Reference / Receipt #
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={paymentReference}
                                    onChange={e =>
                                        setPaymentReference(e.target.value)
                                    }
                                    placeholder="e.g. TXN-123456"
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-foreground">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={paymentNotes}
                                    onChange={e =>
                                        setPaymentNotes(e.target.value)
                                    }
                                    placeholder="Paid via Telebirr / Bank Transfer..."
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPayTarget(null)}
                                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPaying}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                >
                                    {isPaying
                                        ? "Submitting..."
                                        : "Submit Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
