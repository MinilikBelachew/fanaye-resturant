"use client";

import React, { useMemo, useRef, useState } from "react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { StudioSkeleton } from "@/components/custom/molecules/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QrCodeSvg } from "@/components/common/QrCodeSvg";
import {
    useGetAdminQrMenuConfigQuery,
    useGetAdminTablesQrQuery,
    useUpdateAdminQrMenuConfigMutation,
} from "@/context/services/qrMenuApi";
import { useGetTenantSiteQuery } from "@/context/services/siteApi";
import {
    useUploadMenuImageMutation,
    useAdminMenuItemsQuery,
} from "@/context/services/menuApi";
import {
    adminMenuItemToCatalog,
    filePublicUrl,
} from "@/domains/catalog/application/mapAdminMenu";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { exportElementToPdf } from "@/lib/pdfExport";
import { GoldenClocheLogo } from "@/components/common/GoldenClocheLogo";
import {
    AuroraMenuSheet,
    BreakfastMenuSheet,
    PRINT_MENU_TEMPLATES,
    type PrintMenuTemplateId,
} from "@/domains/catalog/ui/print-menu/PrintMenuTemplateSheets";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    Download,
    Eye,
    FileDown,
    FileText,
    Flame,
    Layers,
    LayoutGrid,
    Leaf,
    Loader2,
    Palette,
    Printer,
    QrCode,
    Save,
    Sliders,
    Sparkles,
    Type,
    Upload,
    X,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import { useTranslations } from "next-intl";

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

type FontTheme = "serif" | "sans" | "bistro";
type ColorPalette = "amber" | "monochrome" | "charcoal";
type QrMode = "universal" | "table_specific";

interface PrintMenuSettings {
    templateId: PrintMenuTemplateId;
    title: string;
    subtitle: string;
    showLogo: boolean;
    logoSource: "tenant" | "golden_cloche" | "custom";
    customLogoUrl: string;
    showQrCode: boolean;
    qrMode: QrMode;
    qrHeadline: string;
    qrSubtext: string;
    fontTheme: FontTheme;
    colorPalette: ColorPalette;
    backgroundType: "solid" | "gradient" | "texture";
    backgroundColor: string;
    backgroundGradient: string;
    paperTextureUrl?: string;
    paperOverlayOpacity?: number;
    columns: 1 | 2;
    showImages: boolean;
    showDescriptions: boolean;
    showBadges: boolean;
    showDotLeaders: boolean;
    selectedCategories: string[];
}

export default function ManagerPrintMenuPage() {
    const tCommon = useTranslations("common");
    const tNav = useTranslations("appNav");
    const tManager = useTranslations("manager");
    const t = useTranslations("printMenuStudio");
    const { data: configData, isLoading: configLoading } =
        useGetAdminQrMenuConfigQuery();
    const { data: tablesData } = useGetAdminTablesQrQuery();
    const { data: menuData, isLoading: menuLoading } = useAdminMenuItemsQuery();
    const { data: siteData } = useGetTenantSiteQuery();
    const [updateConfig, { isLoading: isSaving }] =
        useUpdateAdminQrMenuConfigMutation();
    const [uploadImage, { isLoading: isUploadingLogo }] =
        useUploadMenuImageMutation();
    const logoFileInputRef = useRef<HTMLInputElement>(null);

    const tables = tablesData?.tables || [];
    const slug = tablesData?.slug || "restaurant";
    const origin =
        typeof window !== "undefined"
            ? window.location.origin
            : "https://example.com";
    const tenantLogoUrl = siteData?.data?.theme?.logoUrl || null;
    const tenantName = siteData?.data?.tenantName || "Restaurant & Lounge";

    const allItems = menuData?.data || [];

    // Group menu items by category
    const categoriesWithItems = useMemo(() => {
        const map = new Map<string, typeof allItems>();
        for (const item of allItems) {
            const cat = item.categoryName || "Main Menu";
            if (!map.has(cat)) {
                map.set(cat, []);
            }
            map.get(cat)!.push(item);
        }
        return Array.from(map.entries()).map(([name, items]) => ({
            name,
            items,
        }));
    }, [allItems]);

    // Form Settings
    const [settings, setSettings] = useState<PrintMenuSettings>({
        templateId: "classic",
        title: tenantName,
        subtitle: "Dine-In Food & Beverages Menu",
        showLogo: true,
        logoSource: "tenant",
        customLogoUrl: "",
        showQrCode: true,
        qrMode: "table_specific",
        qrHeadline: "Prefer to order contactless from your phone?",
        qrSubtext:
            "Scan with your camera to view photos & send directly to kitchen",
        fontTheme: "serif",
        colorPalette: "amber",
        backgroundType: "solid",
        backgroundColor: "#ffffff",
        backgroundGradient:
            "linear-gradient(135deg, #fffbeb 0%, #fef3c7 45%, #fde68a 100%)",
        paperTextureUrl: "",
        paperOverlayOpacity: 0.88,
        columns: 2,
        showImages: true,
        showDescriptions: true,
        showBadges: true,
        showDotLeaders: true,
        selectedCategories: [],
    });

    // Selected Table for Single Preview / Print
    const [selectedTableId, setSelectedTableId] = useState<string>("ALL");
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const paperSheetRef = useRef<HTMLDivElement>(null);

    // Active categories based on selection
    const activeCategories = useMemo(() => {
        if (settings.selectedCategories.length === 0) {
            return categoriesWithItems;
        }
        return categoriesWithItems.filter(c =>
            settings.selectedCategories.includes(c.name),
        );
    }, [categoriesWithItems, settings.selectedCategories]);

    // Selected table object
    const currentTable = useMemo(() => {
        return tables.find(t => t.id === selectedTableId) || tables[0];
    }, [tables, selectedTableId]);

    async function handleLogoFileUpload(
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await uploadImage(file).unwrap();
            const publicUrl = filePublicUrl(res.file.path) || res.file.path;
            setSettings(prev => ({
                ...prev,
                customLogoUrl: publicUrl || "",
                logoSource: "custom",
            }));
            toast.success("Logo uploaded!", "Custom restaurant logo attached.");
        } catch {
            toast.error("Failed to upload logo image.");
        }
    }

    const effectiveLogoUrl = useMemo(() => {
        if (!settings.showLogo) return null;
        if (settings.logoSource === "tenant" && tenantLogoUrl) {
            return tenantLogoUrl;
        }
        if (settings.logoSource === "custom" && settings.customLogoUrl) {
            return settings.customLogoUrl;
        }
        return null; // fallback to GoldenClocheLogo vector
    }, [
        settings.showLogo,
        settings.logoSource,
        settings.customLogoUrl,
        tenantLogoUrl,
    ]);

    const isDarkPaper = useMemo(() => {
        if (settings.backgroundType === "solid") {
            return (
                settings.backgroundColor === "#0f172a" ||
                settings.backgroundColor === "#121214" ||
                settings.backgroundColor === "#1a1512" ||
                settings.backgroundColor === "#18181b"
            );
        }
        if (settings.backgroundType === "gradient") {
            return (
                settings.backgroundGradient.includes("#0b1120") ||
                settings.backgroundGradient.includes("#1c1917") ||
                settings.backgroundGradient.includes("#0f172a")
            );
        }
        return false;
    }, [
        settings.backgroundType,
        settings.backgroundColor,
        settings.backgroundGradient,
    ]);

    const computedPaperBackground = useMemo(() => {
        if (
            settings.backgroundType === "gradient" &&
            settings.backgroundGradient
        ) {
            return settings.backgroundGradient;
        }
        if (settings.backgroundType === "texture" && settings.paperTextureUrl) {
            const opacity = settings.paperOverlayOpacity ?? 0.88;
            const overlay = isDarkPaper
                ? `rgba(18, 18, 20, ${opacity})`
                : `rgba(255, 255, 255, ${opacity})`;
            return `linear-gradient(${overlay}, ${overlay}), url("${settings.paperTextureUrl}") center/cover no-repeat`;
        }
        return settings.backgroundColor || "#ffffff";
    }, [
        settings.backgroundType,
        settings.backgroundColor,
        settings.backgroundGradient,
        settings.paperTextureUrl,
        settings.paperOverlayOpacity,
        isDarkPaper,
    ]);

    function toggleCategory(catName: string) {
        setSettings(prev => {
            const current = prev.selectedCategories;
            const isSelected = current.includes(catName);
            if (isSelected) {
                return {
                    ...prev,
                    selectedCategories: current.filter(c => c !== catName),
                };
            }
            return { ...prev, selectedCategories: [...current, catName] };
        });
    }

    function selectAllCategories() {
        setSettings(prev => ({
            ...prev,
            selectedCategories: categoriesWithItems.map(c => c.name),
        }));
    }

    function resetCategorySelection() {
        setSettings(prev => ({ ...prev, selectedCategories: [] }));
    }

    // Save Settings
    async function handleSave() {
        try {
            await updateConfig({
                ...(configData || {}),
                welcomeMessage: settings.title,
                subtitle: settings.subtitle,
            }).unwrap();
            toast.success(
                "Print Menu Settings Saved",
                "Template preferences have been recorded.",
            );
        } catch {
            toast.error("Failed to save settings");
        }
    }

    // Direct PDF export trigger (zero window.print dialogs)
    function handlePrint() {
        handleExportPdf();
    }

    // Direct Export to PDF using html-to-image + jsPDF (Option 1) - No direct print
    async function handleExportPdf() {
        if (!paperSheetRef.current) return;
        setIsExportingPdf(true);

        const prevZoom = zoomLevel;
        // Normalize zoom to 100% during export to capture exact 1:1 A4 physical aspect ratio
        if (zoomLevel !== 100) {
            setZoomLevel(100);
            await new Promise(r => setTimeout(r, 120));
        }

        const filename =
            settings.qrMode === "table_specific" &&
            selectedTableId !== "ALL" &&
            currentTable
                ? `${slug}-${currentTable.displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-menu.pdf`
                : `${slug}-physical-menu.pdf`;

        try {
            await exportElementToPdf(paperSheetRef.current, {
                filename,
                scale: 2.5,
                orientation: "portrait",
                fitSinglePage: true,
            });
        } finally {
            if (prevZoom !== 100) {
                setZoomLevel(prevZoom);
            }
            setIsExportingPdf(false);
        }
    }

    if (configLoading || menuLoading) {
        return (
            <DashboardFrame>
                <StudioSkeleton />
            </DashboardFrame>
        );
    }

    // Compute QR Code URL
    // If universal: /r/[slug]
    // If table_specific: /r/[slug]/t/[tableId]
    const previewQrUrl =
        settings.qrMode === "universal" || !currentTable
            ? `${origin}/r/${slug}`
            : `${origin}/r/${slug}/t/${currentTable.id}`;

    return (
        <DashboardFrame>
            {/* CSS @media print rules for paper printing */}
            <style jsx global>{`
                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #print-menu-canvas,
                    #print-menu-canvas * {
                        visibility: visible !important;
                    }
                    #print-menu-canvas {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Header Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
                <PageHeader
                    eyebrow={tNav("floor")}
                    title={tNav("printMenu")}
                    description={tManager("printMenuDescription")}
                />

                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        onClick={handleExportPdf}
                        disabled={isExportingPdf}
                        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs"
                    >
                        {isExportingPdf ? (
                            <Loader2 className="size-4 animate-spin text-white" />
                        ) : (
                            <FileDown className="size-4" />
                        )}
                        {isExportingPdf
                            ? tCommon("loading")
                            : tCommon("exportPdf")}
                    </Button>

                    <Button
                        onClick={handlePrint}
                        disabled={isExportingPdf}
                        variant="outline"
                        className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                    >
                        <Printer className="size-4" />
                        {tCommon("print")}
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        variant="ghost"
                        className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                    >
                        <Save className="size-3.5" />
                        {isSaving ? tCommon("loading") : tCommon("save")}
                    </Button>
                </div>
            </div>

            {/* Main 2-Column Studio: Left Customizer / Right Paper Preview */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print">
                {/* Left Customization Controls (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                    {/* Template picker */}
                    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <LayoutGrid className="size-4 text-amber-600" />
                            {t("templatePickerTitle")}
                        </div>
                        <p className="text-[11px] text-slate-500">
                            {t("templatePickerDesc")}
                        </p>
                        <div className="grid grid-cols-1 gap-2 max-w-xs">
                            {PRINT_MENU_TEMPLATES.map(tpl => (
                                <button
                                    key={tpl.id}
                                    type="button"
                                    onClick={() =>
                                        setSettings(prev => ({
                                            ...prev,
                                            templateId: tpl.id,
                                            ...(tpl.id === "aurora"
                                                ? {
                                                      backgroundType:
                                                          "solid" as const,
                                                      backgroundColor:
                                                          "#F7F1E3",
                                                      showImages: true,
                                                  }
                                                : tpl.id === "breakfast"
                                                  ? {
                                                        backgroundType:
                                                            "solid" as const,
                                                        backgroundColor:
                                                            "#F2EFE9",
                                                        showImages: true,
                                                        showDescriptions: false,
                                                    }
                                                  : {}),
                                        }))
                                    }
                                    className={cn(
                                        "rounded-xl border p-2.5 text-left transition-colors",
                                        settings.templateId === tpl.id
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                                    )}
                                >
                                    <div
                                        className="mb-2 h-10 w-full rounded-lg border border-black/5"
                                        style={{ background: tpl.swatch }}
                                    />
                                    <span className="block text-[12px] font-semibold">
                                        {t(
                                            tpl.id === "classic"
                                                ? "templateClassic"
                                                : tpl.id === "aurora"
                                                  ? "templateAurora"
                                                  : "templateBreakfast",
                                        )}
                                    </span>
                                    <span
                                        className={cn(
                                            "mt-0.5 block text-[10px] leading-snug",
                                            settings.templateId === tpl.id
                                                ? "text-white/70"
                                                : "text-slate-500",
                                        )}
                                    >
                                        {t(
                                            tpl.id === "classic"
                                                ? "templateClassicDesc"
                                                : tpl.id === "aurora"
                                                  ? "templateAuroraDesc"
                                                  : "templateBreakfastDesc",
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 1: Header & Branding */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                            <Sparkles className="size-4 text-amber-600" />
                            {t("headerBrandingTitle")}
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <Label className="text-xs font-semibold text-slate-700">
                                    {t("menuTitle")}
                                </Label>
                                <Input
                                    value={settings.title ?? ""}
                                    onChange={e =>
                                        setSettings(prev => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder={t("menuTitlePlaceholder")}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">
                                    {t("subtitleTagline")}
                                </Label>
                                <Input
                                    value={settings.subtitle ?? ""}
                                    onChange={e =>
                                        setSettings(prev => ({
                                            ...prev,
                                            subtitle: e.target.value,
                                        }))
                                    }
                                    placeholder={t("subtitlePlaceholder")}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h5 className="font-semibold text-slate-900">
                                            {t("includeLogo")}
                                        </h5>
                                        <p className="text-[11px] text-slate-500">
                                            {t("includeLogoDesc")}
                                        </p>
                                    </div>
                                    <ToggleSwitch
                                        checked={settings.showLogo}
                                        onCheckedChange={checked =>
                                            setSettings(prev => ({
                                                ...prev,
                                                showLogo: checked,
                                            }))
                                        }
                                    />
                                </div>

                                {settings.showLogo ? (
                                    <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
                                        <Label className="text-[11px] font-semibold text-slate-700">
                                            {t("logoSource")}
                                        </Label>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        logoSource: "tenant",
                                                    }))
                                                }
                                                className={`rounded-xl border p-2 text-left transition-all ${
                                                    settings.logoSource ===
                                                    "tenant"
                                                        ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold shadow-2xs"
                                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                            >
                                                <span className="block text-[11px]">
                                                    {t("officialLogo")}
                                                </span>
                                                <span className="block text-[9px] text-slate-400 font-normal truncate">
                                                    {tenantLogoUrl
                                                        ? t("tenantBrand")
                                                        : t("fromBranding")}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        logoSource:
                                                            "golden_cloche",
                                                    }))
                                                }
                                                className={`rounded-xl border p-2 text-left transition-all ${
                                                    settings.logoSource ===
                                                    "golden_cloche"
                                                        ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold shadow-2xs"
                                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                            >
                                                <span className="block text-[11px]">
                                                    {t("goldenCloche")}
                                                </span>
                                                <span className="block text-[9px] text-slate-400 font-normal">
                                                    {t("luxuryEmblem")}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        logoSource: "custom",
                                                    }))
                                                }
                                                className={`rounded-xl border p-2 text-left transition-all ${
                                                    settings.logoSource ===
                                                    "custom"
                                                        ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold shadow-2xs"
                                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                            >
                                                <span className="block text-[11px]">
                                                    {t("customFile")}
                                                </span>
                                                <span className="block text-[9px] text-slate-400 font-normal">
                                                    {t("uploadFile")}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Custom Logo Upload / URL */}
                                        {settings.logoSource === "custom" ? (
                                            <div className="flex gap-2 pt-1">
                                                <Input
                                                    value={
                                                        settings.customLogoUrl ??
                                                        ""
                                                    }
                                                    onChange={e =>
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            customLogoUrl:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    placeholder={t(
                                                        "logoUrlPlaceholder",
                                                    )}
                                                    className="text-xs flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        logoFileInputRef.current?.click()
                                                    }
                                                    disabled={isUploadingLogo}
                                                    className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
                                                >
                                                    <Upload className="size-3 text-amber-600" />
                                                    {isUploadingLogo
                                                        ? t("uploading")
                                                        : t("file")}
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={logoFileInputRef}
                                                    accept="image/*"
                                                    onChange={
                                                        handleLogoFileUpload
                                                    }
                                                    className="hidden"
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Section: Paper Background & Styling (Like Website Builder) */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <Palette className="size-4 text-amber-600" />
                                {t("paperBackgroundTitle")}
                            </div>

                            {/* Background Mode Selector */}
                            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs">
                                {(
                                    [
                                        { id: "solid", labelKey: "bgSolid" },
                                        {
                                            id: "gradient",
                                            labelKey: "bgGradient",
                                        },
                                        {
                                            id: "texture",
                                            labelKey: "bgParchment",
                                        },
                                    ] as const
                                ).map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() =>
                                            setSettings(prev => ({
                                                ...prev,
                                                backgroundType: m.id,
                                            }))
                                        }
                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                            settings.backgroundType === m.id
                                                ? "bg-white text-slate-900 shadow-2xs"
                                                : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        {t(m.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mode 1: Solid Paper Color */}
                        {settings.backgroundType === "solid" ? (
                            <div className="space-y-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-700">
                                        {t("paperToneSwatches")}
                                    </span>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <span className="text-[11px] text-slate-500 font-medium">
                                            {t("custom")}
                                        </span>
                                        <input
                                            type="color"
                                            value={settings.backgroundColor}
                                            onChange={e =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    backgroundColor:
                                                        e.target.value,
                                                }))
                                            }
                                            className="size-6 cursor-pointer rounded-md border border-slate-300 p-0"
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {(
                                        [
                                            {
                                                id: "#ffffff",
                                                labelKey: "crispWhite",
                                                subKey: "standardPaper",
                                            },
                                            {
                                                id: "#fffaf5",
                                                labelKey: "warmIvory",
                                                subKey: "linenCream",
                                            },
                                            {
                                                id: "#fdf8f4",
                                                labelKey: "vintageLinen",
                                                subKey: "warmNeutral",
                                            },
                                            {
                                                id: "#fbf5eb",
                                                labelKey: "parchment",
                                                subKey: "rusticBistro",
                                            },
                                            {
                                                id: "#0f172a",
                                                labelKey: "obsidianSlate",
                                                subKey: "modernDark",
                                            },
                                            {
                                                id: "#1a1512",
                                                labelKey: "espressoNoir",
                                                subKey: "darkLuxury",
                                            },
                                        ] as const
                                    ).map(swatch => (
                                        <button
                                            key={swatch.id}
                                            type="button"
                                            onClick={() =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    backgroundColor: swatch.id,
                                                }))
                                            }
                                            className={`rounded-xl border p-2 text-left transition-all ${
                                                settings.backgroundColor ===
                                                swatch.id
                                                    ? "border-amber-600 bg-amber-50/70 font-semibold ring-1 ring-amber-500 shadow-2xs"
                                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    style={{
                                                        backgroundColor:
                                                            swatch.id,
                                                    }}
                                                    className="size-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                                                />
                                                <span className="text-xs font-semibold text-slate-800 truncate">
                                                    {t(swatch.labelKey)}
                                                </span>
                                            </div>
                                            <span className="block text-[9px] text-slate-400 mt-0.5">
                                                {t(swatch.subKey)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Mode 2: Paper Gradient */}
                        {settings.backgroundType === "gradient" ? (
                            <div className="space-y-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
                                <span className="font-semibold text-slate-700 block">
                                    {t("curatedGradients")}
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    {(
                                        [
                                            {
                                                id: "golden-amber",
                                                labelKey: "goldenAmber",
                                                val: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 45%, #fde68a 100%)",
                                            },
                                            {
                                                id: "sunset-ember",
                                                labelKey: "sunsetLinen",
                                                val: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fbcfe8 100%)",
                                            },
                                            {
                                                id: "obsidian-night",
                                                labelKey: "obsidianSlate",
                                                val: "linear-gradient(180deg, #0b1120 0%, #1e293b 100%)",
                                            },
                                            {
                                                id: "rose-quartz",
                                                labelKey: "roseVelvet",
                                                val: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%)",
                                            },
                                        ] as const
                                    ).map(grad => (
                                        <button
                                            key={grad.id}
                                            type="button"
                                            onClick={() =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    backgroundGradient:
                                                        grad.val,
                                                }))
                                            }
                                            style={{ background: grad.val }}
                                            className={`relative h-12 rounded-xl border p-2 text-left transition-all ${
                                                settings.backgroundGradient ===
                                                grad.val
                                                    ? "border-amber-600 ring-2 ring-amber-500/30 shadow-xs"
                                                    : "border-slate-300"
                                            }`}
                                        >
                                            <span className="absolute bottom-1 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                                {t(grad.labelKey)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Mode 3: Parchment Texture */}
                        {settings.backgroundType === "texture" ? (
                            <div className="space-y-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
                                <span className="font-semibold text-slate-700 block">
                                    {t("menuTextures")}
                                </span>
                                <div className="grid grid-cols-3 gap-2">
                                    {(
                                        [
                                            {
                                                id: "parchment",
                                                labelKey: "vintageParchment",
                                                url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=800&auto=format&fit=crop",
                                            },
                                            {
                                                id: "linen",
                                                labelKey: "texturedLinen",
                                                url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=800&auto=format&fit=crop",
                                            },
                                            {
                                                id: "slate",
                                                labelKey: "charcoalSlate",
                                                url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
                                            },
                                        ] as const
                                    ).map(tex => (
                                        <button
                                            key={tex.id}
                                            type="button"
                                            onClick={() =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    paperTextureUrl: tex.url,
                                                }))
                                            }
                                            className={`relative h-14 overflow-hidden rounded-xl border transition-all ${
                                                settings.paperTextureUrl ===
                                                tex.url
                                                    ? "border-amber-600 ring-2 ring-amber-500/30 shadow-xs"
                                                    : "border-slate-200"
                                            }`}
                                        >
                                            <img
                                                src={tex.url}
                                                alt={t(tex.labelKey)}
                                                className="size-full object-cover"
                                            />
                                            <span className="absolute bottom-1 left-1.5 rounded-md bg-black/60 px-1 py-0.5 text-[8px] font-bold text-white">
                                                {t(tex.labelKey)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Section 2: Hybrid QR Code Settings (OPTIONAL as requested) */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <QrCode className="size-4 text-amber-600" />
                                {t("hybridQrTitle")}
                            </div>
                            <ToggleSwitch
                                checked={settings.showQrCode}
                                onCheckedChange={checked =>
                                    setSettings(prev => ({
                                        ...prev,
                                        showQrCode: checked,
                                    }))
                                }
                            />
                        </div>

                        <p className="text-xs text-slate-500">
                            {settings.showQrCode
                                ? t("qrEnabled")
                                : t("qrHidden")}
                        </p>

                        {settings.showQrCode ? (
                            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                                {/* QR Target Mode: Universal vs Table-Specific */}
                                <div>
                                    <Label className="text-xs font-semibold text-slate-700">
                                        {t("qrTargetMode")}
                                    </Label>
                                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    qrMode: "universal",
                                                }))
                                            }
                                            className={`rounded-xl border p-2.5 text-left transition-all ${
                                                settings.qrMode === "universal"
                                                    ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold"
                                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span className="block text-xs">
                                                {t("oneUniversal")}
                                            </span>
                                            <span className="block text-[10px] text-slate-400 font-normal">
                                                {t("oneUniversalDesc")}
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    qrMode: "table_specific",
                                                }))
                                            }
                                            className={`rounded-xl border p-2.5 text-left transition-all ${
                                                settings.qrMode ===
                                                "table_specific"
                                                    ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold"
                                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span className="block text-xs">
                                                {t("tableSpecific")}
                                            </span>
                                            <span className="block text-[10px] text-slate-400 font-normal">
                                                {t("tableSpecificDesc")}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Table Selector if Table-Specific */}
                                {settings.qrMode === "table_specific" ? (
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-700">
                                            {t("previewingTable")}
                                        </Label>
                                        <select
                                            value={selectedTableId}
                                            onChange={e =>
                                                setSelectedTableId(
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        >
                                            {tables.map(table => (
                                                <option
                                                    key={table.id}
                                                    value={table.id}
                                                >
                                                    {table.displayName} (
                                                    {table.locationName ||
                                                        t("mainFloor")}
                                                    )
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-[10px] text-slate-400">
                                            {t("tableSwitchHint")}
                                        </p>
                                    </div>
                                ) : null}

                                <div>
                                    <Label className="text-xs font-semibold text-slate-700">
                                        {t("calloutHeadline")}
                                    </Label>
                                    <Input
                                        value={settings.qrHeadline ?? ""}
                                        onChange={e =>
                                            setSettings(prev => ({
                                                ...prev,
                                                qrHeadline: e.target.value,
                                            }))
                                        }
                                        placeholder={t(
                                            "calloutHeadlinePlaceholder",
                                        )}
                                        className="mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-slate-700">
                                        {t("calloutSubtitle")}
                                    </Label>
                                    <Input
                                        value={settings.qrSubtext ?? ""}
                                        onChange={e =>
                                            setSettings(prev => ({
                                                ...prev,
                                                qrSubtext: e.target.value,
                                            }))
                                        }
                                        placeholder={t(
                                            "calloutSubtitlePlaceholder",
                                        )}
                                        className="mt-1 text-xs"
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Section 3: Design & Typography */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                            <Palette className="size-4 text-amber-600" />
                            {t("designTypography")}
                        </div>

                        <div className="space-y-3 text-xs">
                            {/* Font Theme */}
                            <div>
                                <Label className="text-xs font-semibold text-slate-700">
                                    {t("fontStyle")}
                                </Label>
                                <div className="mt-1.5 grid grid-cols-3 gap-2">
                                    {(
                                        [
                                            {
                                                id: "serif",
                                                labelKey: "classicSerif",
                                            },
                                            {
                                                id: "sans",
                                                labelKey: "modernSans",
                                            },
                                            {
                                                id: "bistro",
                                                labelKey: "boldBistro",
                                            },
                                        ] as const
                                    ).map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    fontTheme:
                                                        opt.id as FontTheme,
                                                }))
                                            }
                                            className={`rounded-xl border py-2 text-center text-xs transition-all ${
                                                settings.fontTheme === opt.id
                                                    ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold"
                                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            {t(opt.labelKey)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Theme */}
                            <div>
                                <Label className="text-xs font-semibold text-slate-700">
                                    {t("colorPalette")}
                                </Label>
                                <div className="mt-1.5 grid grid-cols-3 gap-2">
                                    {(
                                        [
                                            {
                                                id: "amber",
                                                labelKey: "warmAmber",
                                            },
                                            {
                                                id: "monochrome",
                                                labelKey: "pureBw",
                                            },
                                            {
                                                id: "charcoal",
                                                labelKey: "deepCharcoal",
                                            },
                                        ] as const
                                    ).map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    colorPalette:
                                                        opt.id as ColorPalette,
                                                }))
                                            }
                                            className={`rounded-xl border py-2 text-center text-xs transition-all ${
                                                settings.colorPalette === opt.id
                                                    ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold"
                                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            {t(opt.labelKey)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Toggles */}
                            <div className="pt-2 border-t border-slate-100 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-slate-900 font-semibold block">
                                            {t("showFoodPhotos")}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block">
                                            {t("showFoodPhotosDesc")}
                                        </span>
                                    </div>
                                    <ToggleSwitch
                                        checked={settings.showImages}
                                        onCheckedChange={checked =>
                                            setSettings(prev => ({
                                                ...prev,
                                                showImages: checked,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">
                                        {t("showDescriptions")}
                                    </span>
                                    <ToggleSwitch
                                        checked={settings.showDescriptions}
                                        onCheckedChange={checked =>
                                            setSettings(prev => ({
                                                ...prev,
                                                showDescriptions: checked,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">
                                        {t("showBadges")}
                                    </span>
                                    <ToggleSwitch
                                        checked={settings.showBadges}
                                        onCheckedChange={checked =>
                                            setSettings(prev => ({
                                                ...prev,
                                                showBadges: checked,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">
                                        {t("showDotLeaders")}
                                    </span>
                                    <ToggleSwitch
                                        checked={settings.showDotLeaders}
                                        onCheckedChange={checked =>
                                            setSettings(prev => ({
                                                ...prev,
                                                showDotLeaders: checked,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Category Filtering */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <Layers className="size-4 text-amber-600" />
                                {t("categoriesInclude", {
                                    count: activeCategories.length,
                                })}
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                                <button
                                    type="button"
                                    onClick={selectAllCategories}
                                    className="text-amber-600 font-semibold hover:underline"
                                >
                                    {t("all")}
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    type="button"
                                    onClick={resetCategorySelection}
                                    className="text-slate-500 hover:underline"
                                >
                                    {t("reset")}
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">
                            {t("categoriesDesc")}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {categoriesWithItems.map(cat => {
                                const isSelected =
                                    settings.selectedCategories.length === 0 ||
                                    settings.selectedCategories.includes(
                                        cat.name,
                                    );
                                return (
                                    <button
                                        key={cat.name}
                                        type="button"
                                        onClick={() => toggleCategory(cat.name)}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                                            isSelected
                                                ? "bg-slate-900 text-white shadow-xs"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                    >
                                        <span>{cat.name}</span>
                                        <span className="text-[10px] opacity-70">
                                            ({cat.items.length})
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Interactive Paper Sheet Preview (7 cols) */}
                <div className="lg:col-span-7 flex flex-col items-center">
                    {/* Paper Viewport Controls */}
                    <div className="mb-3 flex items-center justify-between w-full max-w-[210mm] px-2 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span>{t("a4Preview")}</span>
                            {settings.showQrCode &&
                            settings.qrMode === "table_specific" &&
                            currentTable ? (
                                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-900 text-[10px]">
                                    {currentTable.displayName}
                                </span>
                            ) : settings.showQrCode ? (
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 text-[10px]">
                                    {t("universal")}
                                </span>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setZoomLevel(z => Math.max(70, z - 10))
                                }
                                className="flex size-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                title={t("zoomOut")}
                            >
                                <ZoomOut className="size-3.5" />
                            </button>
                            <span className="w-10 text-center font-mono text-[11px]">
                                {zoomLevel}%
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setZoomLevel(z => Math.min(130, z + 10))
                                }
                                className="flex size-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                title={t("zoomIn")}
                            >
                                <ZoomIn className="size-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Paper Container (Scaled) */}
                    <div
                        style={{
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: "top center",
                            transition: "transform 0.15s ease-out",
                        }}
                        className="w-full flex justify-center"
                    >
                        {/* The Actual Printable Paper Sheet (210mm x 297mm A4 aspect) */}
                        <div
                            id="print-menu-canvas"
                            ref={paperSheetRef}
                            style={{
                                background:
                                    settings.templateId === "aurora"
                                        ? "#F7F1E3"
                                        : settings.templateId === "breakfast"
                                          ? "#F2EFE9"
                                          : computedPaperBackground,
                                height:
                                    settings.templateId === "classic"
                                        ? undefined
                                        : "297mm",
                                maxHeight:
                                    settings.templateId === "classic"
                                        ? undefined
                                        : "297mm",
                                overflow:
                                    settings.templateId === "classic"
                                        ? undefined
                                        : "hidden",
                                boxSizing: "border-box",
                            }}
                            className={`w-[210mm] min-h-[297mm] shadow-2xl rounded-xs border border-slate-300/80 transition-colors ${
                                settings.templateId !== "classic"
                                    ? "p-[10mm] text-slate-900 font-sans"
                                    : "p-[14mm]"
                            } ${
                                settings.templateId === "classic"
                                    ? isDarkPaper
                                        ? "text-slate-100"
                                        : "text-slate-900"
                                    : ""
                            } ${
                                settings.templateId === "classic"
                                    ? settings.fontTheme === "serif"
                                        ? "font-serif"
                                        : settings.fontTheme === "bistro"
                                          ? "font-sans font-medium"
                                          : "font-sans"
                                    : ""
                            }`}
                        >
                            {settings.templateId === "aurora" ? (
                                <AuroraMenuSheet
                                    title={settings.title}
                                    subtitle={settings.subtitle}
                                    showLogo={settings.showLogo}
                                    logoUrl={effectiveLogoUrl}
                                    categories={activeCategories}
                                    showImages={settings.showImages}
                                    showDescriptions={settings.showDescriptions}
                                    showQrCode={settings.showQrCode}
                                    qrUrl={previewQrUrl}
                                    qrHeadline={settings.qrHeadline}
                                    qrSubtext={settings.qrSubtext}
                                    tableLabel={
                                        settings.qrMode === "table_specific" &&
                                        currentTable
                                            ? currentTable.displayName
                                            : null
                                    }
                                    footerNote={t("footerNote")}
                                />
                            ) : null}
                            {settings.templateId === "breakfast" ? (
                                <BreakfastMenuSheet
                                    title={settings.title}
                                    subtitle={settings.subtitle}
                                    showLogo={settings.showLogo}
                                    logoUrl={effectiveLogoUrl}
                                    categories={activeCategories}
                                    showImages={settings.showImages}
                                    showDescriptions={settings.showDescriptions}
                                    showQrCode={settings.showQrCode}
                                    qrUrl={previewQrUrl}
                                    qrHeadline={settings.qrHeadline}
                                    qrSubtext={settings.qrSubtext}
                                    tableLabel={
                                        settings.qrMode === "table_specific" &&
                                        currentTable
                                            ? currentTable.displayName
                                            : null
                                    }
                                    footerNote={t("footerNote")}
                                />
                            ) : null}
                            {settings.templateId === "classic" ? (
                                <>
                                    {/* Header with Cloche Logo & Restaurant Title */}
                                    <div
                                        className={`relative border-b-2 pb-5 text-center ${
                                            isDarkPaper
                                                ? "border-slate-700"
                                                : "border-slate-900"
                                        }`}
                                    >
                                        {settings.showLogo ? (
                                            <div className="mx-auto mb-2 flex size-12 items-center justify-center">
                                                {effectiveLogoUrl ? (
                                                    <img
                                                        src={effectiveLogoUrl}
                                                        alt="Restaurant Logo"
                                                        className="size-11 object-contain rounded-xl"
                                                        crossOrigin="anonymous"
                                                    />
                                                ) : (
                                                    <GoldenClocheLogo
                                                        className="size-11"
                                                        size={44}
                                                    />
                                                )}
                                            </div>
                                        ) : null}

                                        <h1
                                            className={`text-2xl font-black uppercase tracking-widest ${
                                                isDarkPaper
                                                    ? "text-amber-400"
                                                    : settings.colorPalette ===
                                                        "amber"
                                                      ? "text-slate-950"
                                                      : "text-black"
                                            }`}
                                        >
                                            {settings.title}
                                        </h1>
                                        <p
                                            className={`mt-1 text-xs tracking-wider uppercase font-medium ${
                                                isDarkPaper
                                                    ? "text-slate-300"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            {settings.subtitle}
                                        </p>

                                        {/* Hybrid QR Callout Box (Optional) */}
                                        {settings.showQrCode ? (
                                            <div
                                                className={`mt-4 mx-auto max-w-xl rounded-2xl border-2 p-3 flex items-center justify-between gap-4 ${
                                                    isDarkPaper
                                                        ? "border-slate-700 bg-slate-800/80 text-white"
                                                        : settings.colorPalette ===
                                                            "monochrome"
                                                          ? "border-black bg-slate-50 text-black"
                                                          : settings.colorPalette ===
                                                              "charcoal"
                                                            ? "border-slate-800 bg-slate-100 text-slate-900"
                                                            : "border-amber-600/40 bg-gradient-to-r from-amber-50/60 via-amber-50/30 to-amber-100/40 text-amber-950"
                                                }`}
                                            >
                                                <div className="flex-1 text-left">
                                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                                                        📱{" "}
                                                        {t(
                                                            "instantMobileOrder",
                                                        )}
                                                    </div>
                                                    <h4 className="mt-1 text-xs font-bold leading-tight">
                                                        {settings.qrHeadline}
                                                    </h4>
                                                    <p
                                                        className={`mt-0.5 text-[10px] ${
                                                            isDarkPaper
                                                                ? "text-slate-300"
                                                                : "text-slate-600"
                                                        }`}
                                                    >
                                                        {settings.qrSubtext}
                                                    </p>
                                                    {settings.qrMode ===
                                                        "table_specific" &&
                                                    currentTable ? (
                                                        <span
                                                            className={`mt-1 inline-block text-[10px] font-bold ${
                                                                isDarkPaper
                                                                    ? "text-amber-400"
                                                                    : "text-amber-800"
                                                            }`}
                                                        >
                                                            {t("seatedAt")}{" "}
                                                            {
                                                                currentTable.displayName
                                                            }
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="flex flex-col items-center flex-shrink-0 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
                                                    <QrCodeSvg
                                                        value={previewQrUrl}
                                                        size={64}
                                                        fgColor="#000000"
                                                    />
                                                    <span className="mt-1 text-[7px] font-mono text-slate-500 uppercase tracking-tighter">
                                                        {t("scanWithCamera")}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Menu Categories & Items Grid */}
                                    <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6">
                                        {activeCategories.map(cat => (
                                            <div
                                                key={cat.name}
                                                className="break-inside-avoid space-y-3"
                                            >
                                                {/* Category Title with Ornamental Line */}
                                                <div className="flex items-center gap-2">
                                                    <h3
                                                        className={`text-sm font-black uppercase tracking-wider ${
                                                            isDarkPaper
                                                                ? "text-amber-400"
                                                                : settings.colorPalette ===
                                                                    "amber"
                                                                  ? "text-amber-800"
                                                                  : "text-black"
                                                        }`}
                                                    >
                                                        {cat.name}
                                                    </h3>
                                                    <div
                                                        className={`flex-1 border-b ${
                                                            isDarkPaper
                                                                ? "border-slate-700"
                                                                : "border-slate-300"
                                                        }`}
                                                    />
                                                </div>

                                                {/* Dishes in Category */}
                                                <div className="space-y-3">
                                                    {cat.items.map(item => {
                                                        const mappedItem =
                                                            adminMenuItemToCatalog(
                                                                item,
                                                            );
                                                        const dishImage =
                                                            mappedItem.image ||
                                                            filePublicUrl(
                                                                item.imageUrl,
                                                            ) ||
                                                            item.imageUrl;

                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className="group flex items-start gap-2.5"
                                                            >
                                                                {/* Food Photo Thumbnail */}
                                                                {settings.showImages ? (
                                                                    <div
                                                                        className={`size-11 shrink-0 overflow-hidden rounded-xl border shadow-xs ${
                                                                            isDarkPaper
                                                                                ? "border-slate-700 bg-slate-800"
                                                                                : "border-slate-200 bg-slate-100"
                                                                        }`}
                                                                    >
                                                                        {dishImage ? (
                                                                            <img
                                                                                src={
                                                                                    dishImage
                                                                                }
                                                                                alt={
                                                                                    item.name
                                                                                }
                                                                                className="size-full object-cover"
                                                                                crossOrigin="anonymous"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex size-full items-center justify-center text-xs">
                                                                                🍽️
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : null}

                                                                <div className="flex-1 min-w-0">
                                                                    {/* Dish Name, Dots, Price */}
                                                                    <div className="flex items-baseline justify-between text-xs">
                                                                        <span
                                                                            className={`font-bold shrink-0 ${
                                                                                isDarkPaper
                                                                                    ? "text-white"
                                                                                    : "text-slate-950"
                                                                            }`}
                                                                        >
                                                                            {
                                                                                item.name
                                                                            }
                                                                        </span>
                                                                        {settings.showDotLeaders ? (
                                                                            <span
                                                                                className={`mx-1.5 flex-1 border-b border-dotted mb-1 ${
                                                                                    isDarkPaper
                                                                                        ? "border-slate-600"
                                                                                        : "border-slate-400"
                                                                                }`}
                                                                            />
                                                                        ) : null}
                                                                        <span
                                                                            className={`font-extrabold shrink-0 ${
                                                                                isDarkPaper
                                                                                    ? "text-amber-400"
                                                                                    : settings.colorPalette ===
                                                                                        "amber"
                                                                                      ? "text-amber-900"
                                                                                      : "text-black"
                                                                            }`}
                                                                        >
                                                                            {formatEtb(
                                                                                Number(
                                                                                    item.price,
                                                                                ),
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    {/* Description & Badges */}
                                                                    {settings.showDescriptions &&
                                                                    item.description ? (
                                                                        <p
                                                                            className={`mt-0.5 text-[10px] leading-tight ${
                                                                                isDarkPaper
                                                                                    ? "text-slate-400"
                                                                                    : "text-slate-600"
                                                                            }`}
                                                                        >
                                                                            {
                                                                                item.description
                                                                            }
                                                                        </p>
                                                                    ) : null}

                                                                    {/* Dietary Badges */}
                                                                    {settings.showBadges &&
                                                                    item.badge ? (
                                                                        <div className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                                                                            {item.badge ===
                                                                            "FASTING" ? (
                                                                                <span className="inline-flex items-center gap-0.5 text-emerald-700">
                                                                                    <Leaf className="size-2.5" />{" "}
                                                                                    {t(
                                                                                        "badgeFasting",
                                                                                    )}
                                                                                </span>
                                                                            ) : item.badge ===
                                                                              "VEGETARIAN" ? (
                                                                                <span className="inline-flex items-center gap-0.5 text-emerald-700">
                                                                                    <Leaf className="size-2.5" />{" "}
                                                                                    {t(
                                                                                        "badgeVegetarian",
                                                                                    )}
                                                                                </span>
                                                                            ) : item.badge ===
                                                                              "SPICY" ? (
                                                                                <span className="inline-flex items-center gap-0.5 text-rose-700">
                                                                                    <Flame className="size-2.5" />{" "}
                                                                                    {t(
                                                                                        "badgeSpicy",
                                                                                    )}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-amber-700 font-bold">
                                                                                    ★{" "}
                                                                                    {
                                                                                        item.badge
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom Footer Note */}
                                    <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[9px] text-slate-500 font-medium tracking-wide">
                                        {t("footerNote")}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardFrame>
    );
}
