"use client";

import { useEffect, useMemo, useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import {
    Calendar,
    CheckCircle2,
    Clock3,
    Globe,
    HardDriveDownload,
    Save,
    Settings,
    Truck,
    SlidersHorizontal,
    Package,
    Warehouse,
    Send,
    Bot,
    Building2,
    Wifi,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    useGetTenantSiteQuery,
    useUpdateTenantSiteMutation,
} from "@/context/services/siteApi";
import { useGetManagerDashboardQuery } from "@/context/services/managerDashboardApi";
import { useAppSelector } from "@/context/hooks";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import { ImageUploadField } from "@/domains/site/puck/ImageUploadField";
import {
    type CalendarMode,
    getEthiopianDateDetails,
    getSavedCalendarMode,
    setSavedCalendarMode,
} from "@/lib/ethiopian-calendar";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import OwnerBackupSection from "@/domains/identity/ui/OwnerBackupSection";
import TerminalConnectSection from "@/domains/identity/ui/TerminalConnectSection";
import CloudSyncSection from "@/domains/identity/ui/CloudSyncSection";

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

type SettingsTab = "general" | "terminals" | "sync" | "features" | "backup";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "general", label: "General", icon: Settings },
    { id: "terminals", label: "Connect Staff & Devices", icon: Wifi },
    { id: "sync", label: "Cloud Sync", icon: Globe },
    { id: "features", label: "Features & Modules", icon: SlidersHorizontal },
    { id: "backup", label: "Backup & Restore", icon: HardDriveDownload },
];

export default function OwnerSettingsPage() {
    const t = useTranslations("owner");
    const tTopBar = useTranslations("topbar");
    const tRoles = useTranslations("roleLabels");
    const session = useAppSelector(state => state.identity.session);
    const staff = useAppSelector(selectCurrentStaff);
    const { data: siteRes, isLoading: siteLoading } = useGetTenantSiteQuery();
    const { data: dash } = useGetManagerDashboardQuery();
    const [updateSite, { isLoading: saving }] = useUpdateTenantSiteMutation();

    const [activeTab, setActiveTab] = useState<SettingsTab>("general");

    const site = siteRes?.data;
    const [tenantName, setTenantName] = useState("");
    const [slug, setSlug] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [slugTouched, setSlugTouched] = useState(false);
    const [calendarMode, setCalendarMode] = useState<CalendarMode>(
        getSavedCalendarMode(),
    );
    const [autoApproveSupplyRequests, setAutoApproveSupplyRequests] =
        useState(false);
    const [requireDriverForDispatch, setRequireDriverForDispatch] =
        useState(false);
    const [featureInventory, setFeatureInventory] = useState(true);
    const [featureCentralWarehouse, setFeatureCentralWarehouse] =
        useState(true);
    const [featureTelegramBackup, setFeatureTelegramBackup] = useState(true);
    const [featureAiAdvisor, setFeatureAiAdvisor] = useState(true);
    const [featureOutsideOrders, setFeatureOutsideOrders] = useState(true);

    useEffect(() => {
        if (!site) return;
        setTenantName(site.tenantName || "");
        setSlug(site.slug || "");
        setLogoUrl(site.theme?.logoUrl || "");
        setAutoApproveSupplyRequests(Boolean(site.autoApproveSupplyRequests));
        setRequireDriverForDispatch(Boolean(site.requireDriverForDispatch));
        setFeatureInventory(site.featureInventory !== false);
        setFeatureCentralWarehouse(site.featureCentralWarehouse !== false);
        setFeatureTelegramBackup(site.featureTelegramBackup !== false);
        setFeatureAiAdvisor(site.featureAiAdvisor !== false);
        setFeatureOutsideOrders(site.featureOutsideOrders !== false);
        if (
            site.calendarPreference === "GREGORIAN" ||
            site.calendarPreference === "ETHIOPIAN"
        ) {
            setCalendarMode(site.calendarPreference as CalendarMode);
            setSavedCalendarMode(site.calendarPreference as CalendarMode);
        }
        setSlugTouched(false);
    }, [site]);

    const dirty = useMemo(() => {
        if (!site) return false;
        return (
            tenantName.trim() !== (site.tenantName || "").trim() ||
            slug.trim() !== (site.slug || "").trim() ||
            (logoUrl || "") !== (site.theme?.logoUrl || "") ||
            calendarMode !== (site.calendarPreference || "ETHIOPIAN") ||
            autoApproveSupplyRequests !==
                Boolean(site.autoApproveSupplyRequests) ||
            requireDriverForDispatch !==
                Boolean(site.requireDriverForDispatch) ||
            featureInventory !== (site.featureInventory !== false) ||
            featureCentralWarehouse !==
                (site.featureCentralWarehouse !== false) ||
            featureTelegramBackup !== (site.featureTelegramBackup !== false) ||
            featureAiAdvisor !== (site.featureAiAdvisor !== false) ||
            featureOutsideOrders !== (site.featureOutsideOrders !== false)
        );
    }, [
        site,
        tenantName,
        slug,
        logoUrl,
        calendarMode,
        autoApproveSupplyRequests,
        requireDriverForDispatch,
        featureInventory,
        featureCentralWarehouse,
        featureTelegramBackup,
        featureAiAdvisor,
        featureOutsideOrders,
    ]);

    async function onSave() {
        const name = tenantName.trim();
        if (name.length < 2) {
            toast.error(t("nameMinChars"));
            return;
        }
        const nextSlug = slugify(slug || name);
        if (nextSlug.length < 2) {
            toast.error(t("slugMinChars"));
            return;
        }
        try {
            const result = await updateSite({
                tenantName: name,
                slug: nextSlug,
                theme: {
                    ...(site?.theme ?? {}),
                    logoUrl: logoUrl || null,
                },
                calendarPreference: calendarMode,
                autoApproveSupplyRequests,
                requireDriverForDispatch,
                featureInventory,
                featureCentralWarehouse,
                featureTelegramBackup,
                featureAiAdvisor,
                featureOutsideOrders,
            }).unwrap();
            setTenantName(result.data.tenantName);
            setSlug(result.data.slug);
            setLogoUrl(result.data.theme?.logoUrl || "");
            setAutoApproveSupplyRequests(
                Boolean(result.data.autoApproveSupplyRequests),
            );
            setRequireDriverForDispatch(
                Boolean(result.data.requireDriverForDispatch),
            );
            if (
                result.data.calendarPreference === "GREGORIAN" ||
                result.data.calendarPreference === "ETHIOPIAN"
            ) {
                setCalendarMode(result.data.calendarPreference as CalendarMode);
                setSavedCalendarMode(
                    result.data.calendarPreference as CalendarMode,
                );
            }
            toast.success(t("settingsSaved"));
        } catch (err: unknown) {
            toast.fromUnknown(err, t("settingsSaveError"));
        }
    }

    const roleKey = (staff?.role || "owner").toLowerCase();
    const roleLabel = tRoles.has(roleKey)
        ? tRoles(roleKey)
        : ROLE_LABELS[roleKey] || tRoles("owner");

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Business"
                    title="Settings"
                    description={t("settingsDesc")}
                />
                {(activeTab === "general" || activeTab === "features") && (
                    <Button
                        size="sm"
                        onClick={() => void onSave()}
                        disabled={!dirty || saving || siteLoading}
                        className="self-start gap-2 rounded-full"
                    >
                        {saving ? (
                            <RestorchSpinner className="size-3.5 " />
                        ) : (
                            <Save className="size-3.5" />
                        )}
                        {saving ? t("saving") : t("saveChanges")}
                    </Button>
                )}
            </div>

            {/* Tab Bar */}
            <div className="mt-4 flex border-b border-hairline">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px",
                                isActive
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40",
                            )}
                        >
                            <Icon className="size-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ===================== GENERAL TAB ===================== */}
            {activeTab === "general" && (
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <div className="space-y-4">
                        <section className="space-y-4 rounded-[16px] border border-hairline bg-card p-4 shadow-subtle sm:p-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="restaurant-name">
                                    {t("restaurantName")}
                                </Label>
                                <Input
                                    id="restaurant-name"
                                    value={tenantName}
                                    onChange={e => {
                                        const next = e.target.value;
                                        setTenantName(next);
                                        if (!slugTouched) {
                                            setSlug(slugify(next));
                                        }
                                    }}
                                    placeholder={t("restaurantNamePlaceholder")}
                                    className="h-10 rounded-xl"
                                    disabled={siteLoading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="site-slug">
                                    {t("publicSiteSlug")}
                                </Label>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <span className="shrink-0 text-[12px] text-slate-gray">
                                        /r/
                                    </span>
                                    <Input
                                        id="site-slug"
                                        value={slug}
                                        onChange={e => {
                                            setSlugTouched(true);
                                            setSlug(slugify(e.target.value));
                                        }}
                                        placeholder="your-restaurant"
                                        className="h-10 rounded-xl font-mono text-[13px]"
                                        disabled={siteLoading}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-gray">
                                    {t("guestsOpenPrefix")}{" "}
                                    <span className="font-medium text-foreground">
                                        {site?.publicPath ||
                                            `/r/${slug || "…"}`}
                                    </span>
                                </p>
                            </div>

                            <ImageUploadField
                                label={t("restaurantLogo")}
                                value={logoUrl}
                                onChange={setLogoUrl}
                            />
                        </section>

                        {/* Calendar System & Localization Setting Card */}
                        <section className="space-y-4 rounded-[16px] border border-hairline bg-card p-4 shadow-subtle sm:p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-[14px] font-semibold tracking-tight text-foreground flex items-center gap-2">
                                        <Calendar className="size-4 text-brand" />
                                        <span>
                                            Calendar System & Shift Localization
                                        </span>
                                    </h2>
                                    <p className="text-[12px] text-slate-gray">
                                        Configure the primary calendar and time
                                        system used for shift schedules, weekly
                                        rosters, and staff attendance across
                                        this restaurant.
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase font-bold text-brand border-brand/30 bg-brand/5"
                                >
                                    Tenant Default
                                </Badge>
                            </div>

                            {/* Calendar Mode Selector Cards */}
                            <div className="grid gap-3 sm:grid-cols-2 pt-1">
                                {/* Ethiopian Calendar Option */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCalendarMode("ETHIOPIAN");
                                        setSavedCalendarMode("ETHIOPIAN");
                                    }}
                                    className={cn(
                                        "flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer",
                                        calendarMode === "ETHIOPIAN"
                                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                                            : "border-hairline bg-surface-ivory/40 hover:bg-secondary/60 text-muted-foreground",
                                    )}
                                >
                                    <div className="flex w-full items-center justify-between mb-1.5">
                                        <span className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <span className="text-base">
                                                🇪🇹
                                            </span>
                                            <span>የኢትዮጵያ ቀን መቁጠሪያ (ዓ.ም.)</span>
                                        </span>
                                        {calendarMode === "ETHIOPIAN" && (
                                            <CheckCircle2 className="size-4 text-primary" />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Ethiopian Calendar (Meskerem through
                                        Pagume 13) and 12-hour local clock (e.g.
                                        1:00 ጠዋት – 9:00 ከሰዓት).
                                    </p>
                                    <div className="mt-2.5 rounded-lg bg-card/80 border border-hairline px-2.5 py-1 text-[11px] font-semibold text-foreground">
                                        Today:{" "}
                                        {getEthiopianDateDetails().formattedAm}
                                    </div>
                                </button>

                                {/* Gregorian Calendar Option */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCalendarMode("GREGORIAN");
                                        setSavedCalendarMode("GREGORIAN");
                                    }}
                                    className={cn(
                                        "flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer",
                                        calendarMode === "GREGORIAN"
                                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                                            : "border-hairline bg-surface-ivory/40 hover:bg-secondary/60 text-muted-foreground",
                                    )}
                                >
                                    <div className="flex w-full items-center justify-between mb-1.5">
                                        <span className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <Globe className="size-4 text-blue-500" />
                                            <span>
                                                Gregorian Calendar (G.C.)
                                            </span>
                                        </span>
                                        {calendarMode === "GREGORIAN" && (
                                            <CheckCircle2 className="size-4 text-primary" />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Standard international calendar (January
                                        through December) and 24-hour military
                                        clock (e.g. 07:00 – 15:00).
                                    </p>
                                    <div className="mt-2.5 rounded-lg bg-card/80 border border-hairline px-2.5 py-1 text-[11px] font-semibold text-foreground">
                                        Today:{" "}
                                        {new Date().toLocaleDateString(
                                            "en-US",
                                            {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            },
                                        )}
                                    </div>
                                </button>
                            </div>

                            {/* Timezone Note */}
                            <div className="rounded-xl border border-hairline bg-secondary/30 p-3 text-[11px] text-muted-foreground flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock3 className="size-3.5 text-slate-gray" />
                                    <span>
                                        Timezone:{" "}
                                        <strong className="text-foreground">
                                            Africa/Addis_Ababa (EAT, UTC+3)
                                        </strong>
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-gray">
                                    Auto-synced across roster and shifts
                                </span>
                            </div>
                        </section>

                        {/* Inventory Transfer & Fleet Approval Settings Card */}
                        <section className="space-y-4 rounded-[16px] border border-hairline bg-card p-4 shadow-subtle sm:p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-[14px] font-semibold tracking-tight text-foreground flex items-center gap-2">
                                        <Truck className="size-4 text-primary" />
                                        <span>
                                            Branch Supply Requests & Fleet
                                            Transit
                                        </span>
                                    </h2>
                                    <p className="text-[12px] text-slate-gray">
                                        Configure auto-approval rules and driver
                                        assignment requirements for inter-branch
                                        inventory transfers.
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase font-bold text-primary border-primary/30 bg-primary/5"
                                >
                                    Transit Rules
                                </Badge>
                            </div>

                            <div className="space-y-3 pt-1">
                                {/* Toggle 1: Owner Approval Governance */}
                                <div className="flex items-start justify-between gap-4 rounded-xl border border-hairline bg-surface-ivory/40 p-3.5 dark:bg-card/40">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-semibold text-foreground">
                                                Require Owner Approval for
                                                Supply Requests
                                            </p>
                                            <span
                                                className={cn(
                                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                    !autoApproveSupplyRequests
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                        : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
                                                )}
                                            >
                                                {!autoApproveSupplyRequests
                                                    ? "Active (ON)"
                                                    : "Bypassed (OFF)"}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-slate-gray leading-relaxed">
                                            {!autoApproveSupplyRequests
                                                ? "ON — Only the restaurant owner can approve or reject branch supply requests. Once approved, the central storekeeper can start preparing (PREPARING status). If rejected, the request cannot move forward."
                                                : "OFF — Owner review is bypassed. Central storekeepers can immediately start preparing (PREPARING status) and dispatch stock to branches."}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAutoApproveSupplyRequests(
                                                v => !v,
                                            )
                                        }
                                        className={cn(
                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                            !autoApproveSupplyRequests
                                                ? "bg-emerald-600"
                                                : "bg-zinc-300 dark:bg-zinc-700",
                                        )}
                                        title="Toggle Owner Approval requirement"
                                    >
                                        <span
                                            className={cn(
                                                "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                                !autoApproveSupplyRequests
                                                    ? "translate-x-5"
                                                    : "translate-x-0",
                                            )}
                                        />
                                    </button>
                                </div>

                                {/* Toggle 2: Require Driver */}
                                <div className="flex items-start justify-between gap-4 rounded-xl border border-hairline bg-surface-ivory/40 p-3.5 dark:bg-card/40">
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-semibold text-foreground">
                                            Require Driver Assignment for
                                            Dispatch
                                        </p>
                                        <p className="text-[12px] text-slate-gray leading-relaxed">
                                            When enabled, shipments leaving the
                                            central warehouse must have a
                                            registered driver and vehicle
                                            licence plate assigned before
                                            departure.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setRequireDriverForDispatch(v => !v)
                                        }
                                        className={cn(
                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                            requireDriverForDispatch
                                                ? "bg-emerald-600"
                                                : "bg-zinc-300 dark:bg-zinc-700",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                                requireDriverForDispatch
                                                    ? "translate-x-5"
                                                    : "translate-x-0",
                                            )}
                                        />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="rounded-[16px] border border-hairline bg-card p-4 shadow-subtle sm:p-5">
                        <h2 className="text-[14px] font-semibold tracking-tight">
                            {t("workspace")}
                        </h2>
                        <p className="mt-1 text-[12px] text-slate-gray">
                            {t("workspaceHint")}
                        </p>
                        <ul className="mt-4 space-y-3">
                            {[
                                {
                                    name: t("siteStatus"),
                                    value:
                                        site?.status ||
                                        (siteLoading ? "…" : "—"),
                                },
                                {
                                    name: t("branch"),
                                    value:
                                        dash?.data?.branchName ||
                                        session?.branchName ||
                                        "—",
                                },
                                {
                                    name: tTopBar("signedInAs"),
                                    value:
                                        session?.displayName ||
                                        staff?.name ||
                                        "—",
                                },
                                {
                                    name: tTopBar("role"),
                                    value: roleLabel,
                                },
                                {
                                    name: t("businessDate"),
                                    value: dash?.data?.businessDate || "—",
                                },
                            ].map(row => (
                                <li
                                    key={row.name}
                                    className="flex flex-col gap-1 border-b border-hairline pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                                >
                                    <span className="text-[12px] text-slate-gray">
                                        {row.name}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className="max-w-full self-start truncate sm:self-auto"
                                    >
                                        {row.value}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            )}

            {/* ===================== FEATURES & MODULES TAB ===================== */}
            {activeTab === "features" && (
                <div className="mt-4 space-y-4">
                    <section className="space-y-4 rounded-[16px] border border-hairline bg-card p-4 shadow-subtle sm:p-5">
                        <div className="space-y-1">
                            <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                                <SlidersHorizontal className="size-4 text-primary" />
                                <span>Operational Feature Controls</span>
                            </h3>
                            <p className="text-[12px] text-slate-gray">
                                Enable or disable operational add-on modules for
                                your restaurant. Disabling keeps your staff
                                dashboard focused and streamlined.
                            </p>
                        </div>

                        <div className="grid gap-3 pt-2 sm:grid-cols-2">
                            {/* Toggle 1: Basic Inventory */}
                            <div className="flex items-start justify-between rounded-xl border border-hairline p-4 bg-background/50 hover:bg-background transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                                        <Package className="size-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] font-semibold text-foreground">
                                                Basic Inventory Tracking
                                            </span>
                                            <Badge
                                                variant={
                                                    featureInventory
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {featureInventory
                                                    ? "Active"
                                                    : "Pure POS"}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-gray">
                                            Tracks raw ingredients, stock levels
                                            and recipes. When OFF, your system
                                            runs as a pure POS with no stock
                                            counting.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={featureInventory}
                                    onClick={() =>
                                        setFeatureInventory(!featureInventory)
                                    }
                                    className={cn(
                                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                                        featureInventory
                                            ? "bg-emerald-600"
                                            : "bg-slate-300 dark:bg-slate-700",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                            featureInventory
                                                ? "translate-x-4"
                                                : "translate-x-0",
                                        )}
                                    />
                                </button>
                            </div>

                            {/* Toggle 2: Central Warehouse & Transfers */}
                            <div className="flex items-start justify-between rounded-xl border border-hairline p-4 bg-background/50 hover:bg-background transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                                        <Warehouse className="size-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] font-semibold text-foreground">
                                                Central Warehouse & Transfers
                                            </span>
                                            <Badge
                                                variant={
                                                    featureCentralWarehouse
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {featureCentralWarehouse
                                                    ? "Active"
                                                    : "Single Store"}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-gray">
                                            Unlocks central main warehouse,
                                            inter-branch transfer supply
                                            requests and multi-location
                                            logistics.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={featureCentralWarehouse}
                                    onClick={() =>
                                        setFeatureCentralWarehouse(
                                            !featureCentralWarehouse,
                                        )
                                    }
                                    className={cn(
                                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                                        featureCentralWarehouse
                                            ? "bg-emerald-600"
                                            : "bg-slate-300 dark:bg-slate-700",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                            featureCentralWarehouse
                                                ? "translate-x-4"
                                                : "translate-x-0",
                                        )}
                                    />
                                </button>
                            </div>

                            {/* Toggle 3: Telegram Cloud Backups */}
                            <div className="flex items-start justify-between rounded-xl border border-hairline p-4 bg-background/50 hover:bg-background transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 shrink-0 mt-0.5">
                                        <Send className="size-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] font-semibold text-foreground">
                                                Telegram Cloud Backups
                                            </span>
                                            <Badge
                                                variant={
                                                    featureTelegramBackup
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {featureTelegramBackup
                                                    ? "Active"
                                                    : "Disabled"}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-gray">
                                            Automated midnight .sql.gz database
                                            exports sent directly to your
                                            verified personal Telegram bot chat.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={featureTelegramBackup}
                                    onClick={() =>
                                        setFeatureTelegramBackup(
                                            !featureTelegramBackup,
                                        )
                                    }
                                    className={cn(
                                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                                        featureTelegramBackup
                                            ? "bg-emerald-600"
                                            : "bg-slate-300 dark:bg-slate-700",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                            featureTelegramBackup
                                                ? "translate-x-4"
                                                : "translate-x-0",
                                        )}
                                    />
                                </button>
                            </div>

                            {/* Toggle 5: Outside Orders & Returnable Materials */}
                            <div className="flex items-start justify-between rounded-xl border border-hairline p-4 bg-background/50 hover:bg-background transition-colors sm:col-span-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
                                        <Building2 className="size-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] font-semibold text-foreground">
                                                Outside Orders & Returnable
                                                Tableware Tracking
                                            </span>
                                            <Badge
                                                variant={
                                                    featureOutsideOrders
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {featureOutsideOrders
                                                    ? "Active"
                                                    : "In-House Only"}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-gray">
                                            Enables off-site orders for
                                            neighboring offices/buildings in
                                            Waiter & Manager, and unlocks the
                                            Kitchen/Bar Returnable Materials
                                            tracking log for dishes and trays.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={featureOutsideOrders}
                                    onClick={() =>
                                        setFeatureOutsideOrders(
                                            !featureOutsideOrders,
                                        )
                                    }
                                    className={cn(
                                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                                        featureOutsideOrders
                                            ? "bg-emerald-600"
                                            : "bg-slate-300 dark:bg-slate-700",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                            featureOutsideOrders
                                                ? "translate-x-4"
                                                : "translate-x-0",
                                        )}
                                    />
                                </button>
                            </div>

                            {/* Toggle 4: AI Voice Business Advisor */}
                            <div className="flex items-start justify-between rounded-xl border border-hairline p-4 bg-background/50 hover:bg-background transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 shrink-0 mt-0.5">
                                        <Bot className="size-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] font-semibold text-foreground">
                                                AI Voice Business Advisor
                                            </span>
                                            <Badge
                                                variant={
                                                    featureAiAdvisor
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {featureAiAdvisor
                                                    ? "Active"
                                                    : "Disabled"}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-gray">
                                            Voice-powered speech assistant with
                                            instant business intelligence
                                            analytics and revenue queries.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={featureAiAdvisor}
                                    onClick={() =>
                                        setFeatureAiAdvisor(!featureAiAdvisor)
                                    }
                                    className={cn(
                                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                                        featureAiAdvisor
                                            ? "bg-emerald-600"
                                            : "bg-slate-300 dark:bg-slate-700",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                            featureAiAdvisor
                                                ? "translate-x-4"
                                                : "translate-x-0",
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* ===================== CONNECT TERMINALS TAB ===================== */}
            {activeTab === "terminals" && (
                <div className="mt-4">
                    <TerminalConnectSection />
                </div>
            )}

            {/* ===================== CLOUD SYNC TAB ===================== */}
            {activeTab === "sync" && (
                <div className="mt-4">
                    <CloudSyncSection />
                </div>
            )}

            {/* ===================== BACKUP TAB ===================== */}
            {activeTab === "backup" && (
                <div className="mt-4">
                    <OwnerBackupSection showHeader={false} />
                </div>
            )}
        </DashboardFrame>
    );
}
