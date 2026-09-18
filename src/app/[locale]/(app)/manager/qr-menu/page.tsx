"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { StudioSkeleton } from "@/components/custom/molecules/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                checked ? "bg-amber-600" : "bg-slate-300"
            }`}
        >
            <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    checked ? "translate-x-5" : "translate-x-0"
                }`}
            />
        </button>
    );
}
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
    CheckCircle2,
    ExternalLink,
    FileDown,
    Flame,
    Globe,
    ImageIcon,
    Leaf,
    Loader2,
    Printer,
    QrCode,
    Save,
    ShieldCheck,
    Sparkles,
    Upload,
    Wifi,
    X,
    Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function ManagerQrMenuPage() {
    const tManager = useTranslations("manager");
    const tCommon = useTranslations("common");
    const tNav = useTranslations("appNav");
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

    useEffect(() => {
        if (configData) {
            setForm(configData);
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

    async function handleSave() {
        try {
            await updateConfig(form).unwrap();
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
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow={tNav("floor")}
                    title={tNav("qrMenu")}
                    description="Design the customer ordering screen displayed when diners scan table QR codes."
                />
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        variant="outline"
                        onClick={() => setPrintModalOpen(true)}
                        className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                        <FileDown className="size-4 text-amber-600" />
                        {tManager("printCards")} ({tables.length})
                    </Button>

                    <Link href={sampleTableUrl} target="_blank">
                        <Button
                            variant="outline"
                            className="gap-2 border-slate-300 text-slate-700"
                        >
                            <ExternalLink className="size-4 text-slate-500" />
                            Preview Live
                        </Button>
                    </Link>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
                    >
                        {isSaving ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Save className="size-4" />
                        )}
                        {tCommon("save")}
                    </Button>
                </div>
            </div>

            {/* Main 2-Column Studio: Left Config Panels / Right Phone Simulator */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Form Controls (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Ordering Policy & Operations */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                            <Zap className="size-4 text-amber-600" />
                            Ordering Rules & Kitchen Dispatch
                        </div>

                        <div className="mt-4 space-y-4">
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-900">
                                        Allow Guest Self-Ordering
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                        If disabled, the QR code acts as a
                                        view-only digital menu without ordering.
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

                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-900">
                                        Auto-Send to Kitchen Displays (KDS)
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                        {form.autoSendToKitchen
                                            ? "Orders route directly to Kitchen & Barista screens immediately."
                                            : "Orders require 1-tap confirmation from the waiter before dispatch."}
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
                    </div>

                    {/* Header Branding & Welcome */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                            <Sparkles className="size-4 text-amber-600" />
                            Header Branding & Greeting
                        </div>

                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs font-medium text-slate-700">
                                    Welcome Title
                                </Label>
                                <Input
                                    value={form.welcomeMessage || ""}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            welcomeMessage: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Welcome to our Rooftop & Lounge"
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-medium text-slate-700">
                                    Subtitle / Ambiance Note
                                </Label>
                                <Input
                                    value={form.subtitle || ""}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            subtitle: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Traditional Ethiopian coffee, sizzler tibs & cocktails"
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-slate-700">
                                        Cover Photo Banner
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
                                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                                        >
                                            <X className="size-3" />
                                            Remove
                                        </button>
                                    ) : null}
                                </div>

                                {/* Banner Thumbnail Preview */}
                                {form.coverImageUrl ? (
                                    <div className="relative mt-2 h-28 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner group">
                                        <img
                                            src={form.coverImageUrl}
                                            alt="Banner Preview"
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    bannerFileInputRef.current?.click()
                                                }
                                                className="text-xs h-7 gap-1 bg-white/90 text-slate-900 hover:bg-white"
                                            >
                                                <Upload className="size-3" />
                                                Replace File
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Dual controls: URL input + Select from Files button */}
                                <div className="mt-2 flex gap-2">
                                    <Input
                                        value={form.coverImageUrl || ""}
                                        onChange={e =>
                                            setForm(prev => ({
                                                ...prev,
                                                coverImageUrl: e.target.value,
                                            }))
                                        }
                                        placeholder="Paste banner image URL (https://...)"
                                        className="text-xs flex-1"
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
                                        disabled={isUploadingBanner}
                                        onClick={() =>
                                            bannerFileInputRef.current?.click()
                                        }
                                        className="shrink-0 gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        {isUploadingBanner ? (
                                            <Loader2 className="size-3.5 animate-spin text-amber-600" />
                                        ) : (
                                            <Upload className="size-3.5 text-amber-600" />
                                        )}
                                        {isUploadingBanner
                                            ? "Uploading…"
                                            : "Select File"}
                                    </Button>
                                </div>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Tip: Upload a dining room photo from your
                                    computer or paste any high-resolution image
                                    URL.
                                </p>

                                {/* Quick Presets */}
                                <div className="mt-2.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Quick Presets:
                                    </span>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        {[
                                            {
                                                label: "Modern Dining",
                                                url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
                                            },
                                            {
                                                label: "Rooftop Lounge",
                                                url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80",
                                            },
                                            {
                                                label: "Ethiopian Traditional",
                                                url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80",
                                            },
                                            {
                                                label: "Cocktail Bar",
                                                url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&auto=format&fit=crop&q=80",
                                            },
                                        ].map(preset => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() =>
                                                    setForm(prev => ({
                                                        ...prev,
                                                        coverImageUrl:
                                                            preset.url,
                                                    }))
                                                }
                                                className={`rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors ${
                                                    form.coverImageUrl ===
                                                    preset.url
                                                        ? "border-amber-500 bg-amber-50 text-amber-900 font-semibold"
                                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Wi-Fi Details */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                            <Wifi className="size-4 text-amber-600" />
                            Guest Wi-Fi Credentials
                        </div>
                        <p className="text-xs text-slate-500">
                            Customers appreciate quick access to restaurant
                            Wi-Fi right when they sit down.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-medium text-slate-700">
                                    Wi-Fi Name (SSID)
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
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-medium text-slate-700">
                                    Wi-Fi Password
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
                                    className="mt-1 text-xs font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Featured Dishes / Chef's Highlights */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <Sparkles className="size-4 text-amber-600" />
                                Chef&apos;s Highlights & Featured Items
                            </div>
                            <span className="text-xs font-medium text-amber-600">
                                {(form.featuredItemIds || []).length} selected
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Select dishes to pin at the very top of the guest
                            menu in a highlighted spotlight carousel.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
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
                                        className={`flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-all ${
                                            isSelected
                                                ? "border-amber-500 bg-amber-50/50 shadow-xs"
                                                : "border-slate-200 bg-white hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="relative size-10 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs">
                                                    🍽️
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-xs font-semibold text-slate-900 truncate">
                                                {item.name}
                                            </h5>
                                            <span className="text-[11px] font-bold text-slate-600">
                                                {item.price} ETB
                                            </span>
                                        </div>

                                        <div
                                            className={`flex size-5 items-center justify-center rounded-full border transition-colors ${
                                                isSelected
                                                    ? "border-amber-600 bg-amber-600 text-white"
                                                    : "border-slate-300 bg-white"
                                            }`}
                                        >
                                            {isSelected ? (
                                                <Check className="size-3 stroke-[3]" />
                                            ) : null}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Live Phone Simulator (5 cols) */}
                <div className="lg:col-span-5 lg:sticky lg:top-6 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Customer Screen Preview
                    </div>

                    <LivePhoneSimulator
                        config={form}
                        menuItems={menuItems}
                        tableName={
                            tables[0]?.displayName ||
                            "Table 4 · Rooftop Terrace"
                        }
                        restaurantName={
                            form.welcomeMessage || "Your Restaurant"
                        }
                    />
                </div>
            </div>

            {/* Table QR Card Modal */}
            <TableQrCardModal
                open={printModalOpen}
                onOpenChange={setPrintModalOpen}
                tables={tables}
                config={form}
                restaurantName={form.welcomeMessage || "Your Restaurant"}
                slug={slug}
            />
        </DashboardFrame>
    );
}
