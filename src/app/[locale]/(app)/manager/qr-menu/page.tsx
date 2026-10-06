"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { StudioSkeleton } from "@/components/custom/molecules/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import {
    useGetAdminQrMenuConfigQuery,
    useGetAdminTablesQrQuery,
    useUpdateAdminQrMenuConfigMutation,
    QrMenuConfig,
} from "@/context/services/qrMenuApi";
import {
    useAdminMenuItemsQuery,
    useUploadMenuImageMutation,
} from "@/context/services/menuApi";
import {
    adminMenuItemToCatalog,
    filePublicUrl,
} from "@/domains/catalog/application/mapAdminMenu";
import { LivePhoneSimulator } from "@/domains/catalog/ui/qr-builder/LivePhoneSimulator";
import { TableQrCardModal } from "@/domains/catalog/ui/qr-builder/TableQrCardModal";
import {
    Check,
    ExternalLink,
    FileDown,
    Loader2,
    Save,
    Upload,
    Wifi,
    X,
    Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function ToggleSwitch({
    checked,
    onCheckedChange,
}: {
    checked: boolean;
    onCheckedChange: (val: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors",
                checked
                    ? "border-foreground bg-foreground"
                    : "border-border bg-muted",
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block size-4 translate-y-px rounded-full bg-background transition-transform",
                    checked ? "translate-x-4" : "translate-x-0.5",
                )}
            />
        </button>
    );
}

function Section({
    title,
    icon,
    children,
    meta,
}: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    meta?: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-border bg-background p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[13px] text-foreground">
                    {icon}
                    {title}
                </div>
                {meta}
            </div>
            {children}
        </section>
    );
}

export default function ManagerQrMenuPage() {
    const tManager = useTranslations("manager");
    const tCommon = useTranslations("common");
    const tNav = useTranslations("appNav");
    const t = useTranslations("qrMenuStudio");
    const { data: configData, isLoading: configLoading } =
        useGetAdminQrMenuConfigQuery();
    const { data: tablesData } = useGetAdminTablesQrQuery();
    const { data: menuData } = useAdminMenuItemsQuery();
    const [updateConfig, { isLoading: isSaving }] =
        useUpdateAdminQrMenuConfigMutation();
    const [uploadImage, { isLoading: isUploadingBanner }] =
        useUploadMenuImageMutation();
    const bannerFileInputRef = React.useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<QrMenuConfig>({
        coverImageUrl: "",
        welcomeMessage: "",
        subtitle: "",
        wifiSsid: "",
        wifiPassword: "",
        featuredItemIds: [],
        allowGuestOrders: true,
        autoSendToKitchen: true,
        enabledDietaryTags: ["FASTING", "VEGETARIAN", "SPICY", "CHEF_PICK"],
    });

    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [wifiEnabled, setWifiEnabled] = useState(false);

    useEffect(() => {
        if (configData) {
            setForm(configData);
            setWifiEnabled(
                Boolean(
                    configData.wifiSsid?.trim() ||
                        configData.wifiPassword?.trim(),
                ),
            );
        }
    }, [configData]);

    async function handleBannerFileChange(
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await uploadImage(file).unwrap();
            const publicUrl = filePublicUrl(res.file.path) || res.file.path;
            setForm(prev => ({ ...prev, coverImageUrl: publicUrl }));
            toast.success(
                "Cover image uploaded!",
                "Banner has been updated with your uploaded image.",
            );
        } catch {
            toast.error(
                "Failed to upload image. Please try a JPG or PNG under 5MB.",
            );
        } finally {
            if (e.target) e.target.value = "";
        }
    }

    const menuItems = useMemo(
        () => (menuData?.data || []).map(item => adminMenuItemToCatalog(item)),
        [menuData],
    );

    const tables = tablesData?.tables || [];
    const slug = tablesData?.slug || "restaurant";
    const managesAllBranches = tablesData?.managesAllBranches ?? false;

    async function handleSave() {
        try {
            const payload: QrMenuConfig = {
                ...form,
                wifiSsid: wifiEnabled ? form.wifiSsid || "" : "",
                wifiPassword: wifiEnabled ? form.wifiPassword || "" : "",
            };
            await updateConfig(payload).unwrap();
            setForm(payload);
            toast.success(
                "QR Menu saved!",
                "Your dining table menu settings have been updated.",
            );
        } catch {
            toast.error("Failed to save QR menu configuration.");
        }
    }

    function toggleFeaturedItem(id: string) {
        setForm(prev => {
            const current = prev.featuredItemIds || [];
            const updated = current.includes(id)
                ? current.filter(itemId => itemId !== id)
                : [...current, id];
            return { ...prev, featuredItemIds: updated };
        });
    }

    const sampleTableUrl =
        tables.length > 0 ? `/r/${slug}/t/${tables[0].id}` : `/r/${slug}`;

    if (configLoading) {
        return (
            <DashboardFrame>
                <StudioSkeleton />
            </DashboardFrame>
        );
    }

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow={tNav("floor")}
                    title={tNav("qrMenu")}
                    description={tManager("qrMenuDescription")}
                />
                <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrintModalOpen(true)}
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                        <FileDown className="size-3.5" />
                        {tManager("printCards")} ({tables.length})
                    </Button>
                    <Link href={sampleTableUrl} target="_blank">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                            <ExternalLink className="size-3.5" />
                            {tManager("previewLive")}
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-1.5 shadow-none"
                    >
                        {isSaving ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Save className="size-3.5" />
                        )}
                        {tCommon("save")}
                    </Button>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-7">
                    <Section
                        title={t("orderingRulesTitle")}
                        icon={
                            <Zap className="size-3.5 text-muted-foreground" />
                        }
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3.5 py-3">
                                <div className="min-w-0">
                                    <p className="text-[13px] text-foreground">
                                        {t("allowGuestOrders")}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {t("allowGuestOrdersDesc")}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={form.allowGuestOrders ?? true}
                                    onCheckedChange={(checked: boolean) =>
                                        setForm(prev => ({
                                            ...prev,
                                            allowGuestOrders: checked,
                                        }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3.5 py-3">
                                <div className="min-w-0">
                                    <p className="text-[13px] text-foreground">
                                        {t("autoSendKds")}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {form.autoSendToKitchen
                                            ? t("autoSendKdsOn")
                                            : t("autoSendKdsOff")}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={form.autoSendToKitchen ?? true}
                                    onCheckedChange={(checked: boolean) =>
                                        setForm(prev => ({
                                            ...prev,
                                            autoSendToKitchen: checked,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </Section>

                    <Section title={t("headerBrandingTitle")}>
                        <div className="space-y-3">
                            <div>
                                <Label className="text-[12px] text-muted-foreground">
                                    {t("welcomeTitle")}
                                </Label>
                                <Input
                                    value={form.welcomeMessage || ""}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            welcomeMessage: e.target.value,
                                        }))
                                    }
                                    placeholder={t("welcomeTitlePlaceholder")}
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label className="text-[12px] text-muted-foreground">
                                    {t("subtitleLabel")}
                                </Label>
                                <Input
                                    value={form.subtitle || ""}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            subtitle: e.target.value,
                                        }))
                                    }
                                    placeholder={t("subtitlePlaceholder")}
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-[12px] text-muted-foreground">
                                        {t("coverPhotoBanner")}
                                    </Label>
                                    {form.coverImageUrl ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    coverImageUrl: "",
                                                }))
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="size-3" />
                                            {t("remove")}
                                        </button>
                                    ) : null}
                                </div>

                                {form.coverImageUrl ? (
                                    <div className="relative mt-2 h-28 w-full overflow-hidden rounded-lg border border-border bg-muted">
                                        <img
                                            src={form.coverImageUrl}
                                            alt="Banner Preview"
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    bannerFileInputRef.current?.click()
                                                }
                                                className="h-7 gap-1 text-[11px] shadow-none"
                                            >
                                                <Upload className="size-3" />
                                                {t("replaceFile")}
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="mt-2 flex gap-2">
                                    <Input
                                        value={form.coverImageUrl || ""}
                                        onChange={e =>
                                            setForm(prev => ({
                                                ...prev,
                                                coverImageUrl: e.target.value,
                                            }))
                                        }
                                        placeholder={t("bannerUrlPlaceholder")}
                                        className="flex-1"
                                    />
                                    <input
                                        type="file"
                                        ref={bannerFileInputRef}
                                        accept="image/*"
                                        onChange={handleBannerFileChange}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isUploadingBanner}
                                        onClick={() =>
                                            bannerFileInputRef.current?.click()
                                        }
                                        className="shrink-0 gap-1.5 shadow-none"
                                    >
                                        {isUploadingBanner ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <Upload className="size-3.5" />
                                        )}
                                        {isUploadingBanner
                                            ? t("uploading")
                                            : t("selectFile")}
                                    </Button>
                                </div>

                                <p className="mt-1.5 text-[11px] text-muted-foreground">
                                    {t("bannerTip")}
                                </p>

                                <div className="mt-3">
                                    <span className="text-[11px] tracking-wide text-muted-foreground">
                                        {t("quickPresets")}
                                    </span>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {(
                                            [
                                                {
                                                    key: "presetModern",
                                                    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
                                                },
                                                {
                                                    key: "presetRooftop",
                                                    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80",
                                                },
                                                {
                                                    key: "presetEthiopian",
                                                    url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80",
                                                },
                                                {
                                                    key: "presetCocktail",
                                                    url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&auto=format&fit=crop&q=80",
                                                },
                                            ] as const
                                        ).map(preset => (
                                            <button
                                                key={preset.key}
                                                type="button"
                                                onClick={() =>
                                                    setForm(prev => ({
                                                        ...prev,
                                                        coverImageUrl:
                                                            preset.url,
                                                    }))
                                                }
                                                className={cn(
                                                    "rounded-md border px-2 py-1 text-[11px] transition-colors",
                                                    form.coverImageUrl ===
                                                        preset.url
                                                        ? "border-foreground bg-foreground text-background"
                                                        : "border-border text-muted-foreground hover:text-foreground",
                                                )}
                                            >
                                                {t(preset.key)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section
                        title={t("wifiCredentialsTitle")}
                        icon={
                            <Wifi className="size-3.5 text-muted-foreground" />
                        }
                        meta={
                            <ToggleSwitch
                                checked={wifiEnabled}
                                onCheckedChange={checked => {
                                    setWifiEnabled(checked);
                                    if (!checked) {
                                        setForm(prev => ({
                                            ...prev,
                                            wifiSsid: "",
                                            wifiPassword: "",
                                        }));
                                    }
                                }}
                            />
                        }
                    >
                        <p className="mb-3 text-[12px] text-muted-foreground">
                            {wifiEnabled
                                ? t("wifiCredentialsDesc")
                                : t("wifiCredentialsOptional")}
                        </p>
                        {wifiEnabled ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <Label className="text-[12px] text-muted-foreground">
                                        {t("wifiName")}
                                    </Label>
                                    <Input
                                        value={form.wifiSsid || ""}
                                        onChange={e =>
                                            setForm(prev => ({
                                                ...prev,
                                                wifiSsid: e.target.value,
                                            }))
                                        }
                                        placeholder="Guest_Wifi"
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[12px] text-muted-foreground">
                                        {t("wifiPassword")}
                                    </Label>
                                    <Input
                                        value={form.wifiPassword || ""}
                                        onChange={e =>
                                            setForm(prev => ({
                                                ...prev,
                                                wifiPassword: e.target.value,
                                            }))
                                        }
                                        placeholder="buna2026"
                                        className="mt-1.5 font-mono"
                                    />
                                </div>
                            </div>
                        ) : null}
                    </Section>

                    <Section
                        title={t("chefsHighlightsTitle")}
                        meta={
                            <span className="text-[11px] text-muted-foreground">
                                {t("selectedCount", {
                                    count: (form.featuredItemIds || []).length,
                                })}
                            </span>
                        }
                    >
                        <p className="mb-3 text-[12px] text-muted-foreground">
                            {t("chefsHighlightsDesc")}
                        </p>
                        <div className="grid max-h-[300px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                            {menuItems.map(item => {
                                const isSelected = (
                                    form.featuredItemIds || []
                                ).includes(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            toggleFeaturedItem(item.id)
                                        }
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                                            isSelected
                                                ? "border-foreground/30 bg-muted/40"
                                                : "border-border hover:border-foreground/20",
                                        )}
                                    >
                                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                                                    —
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[12px] text-foreground">
                                                {item.name}
                                            </p>
                                            <span className="text-[11px] text-muted-foreground">
                                                {item.price} ETB
                                            </span>
                                        </div>
                                        <div
                                            className={cn(
                                                "flex size-5 items-center justify-center rounded-full border",
                                                isSelected
                                                    ? "border-foreground bg-foreground text-background"
                                                    : "border-border bg-background",
                                            )}
                                        >
                                            {isSelected ? (
                                                <Check className="size-3" />
                                            ) : null}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Section>
                </div>

                <div className="flex flex-col items-center lg:sticky lg:top-6 lg:col-span-5">
                    <div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {t("livePreview")}
                    </div>
                    <LivePhoneSimulator
                        config={{
                            ...form,
                            wifiSsid: wifiEnabled ? form.wifiSsid : "",
                            wifiPassword: wifiEnabled ? form.wifiPassword : "",
                        }}
                        menuItems={menuItems}
                        tableName={
                            tables[0]?.displayName ||
                            "Table 4 · Rooftop Terrace"
                        }
                        restaurantName={
                            form.welcomeMessage || t("restaurantFallback")
                        }
                    />
                </div>
            </div>

            <TableQrCardModal
                open={printModalOpen}
                onOpenChange={setPrintModalOpen}
                tables={tables}
                config={form}
                restaurantName={form.welcomeMessage || t("restaurantFallback")}
                slug={slug}
                managesAllBranches={managesAllBranches}
            />
        </DashboardFrame>
    );
}
