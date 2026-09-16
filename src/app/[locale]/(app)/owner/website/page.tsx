"use client";

import { useEffect, useMemo, useState } from "react";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import {
    Loader2,
    ExternalLink,
    Globe2,
    Sparkles,
    Palette,
    Layers,
    Type,
    Image as ImageIcon,
    Check,
    Sliders,
    ChevronDown,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import {
    useGetTenantSiteQuery,
    usePublishTenantSiteMutation,
    useUnpublishTenantSiteMutation,
    useUpdateTenantSiteMutation,
    type PublicMenuItem,
    type SiteTheme,
} from "@/context/services/siteApi";
import { useAdminMenuItemsQuery } from "@/context/services/menuApi";
import { adminMenuItemToCatalog } from "@/domains/catalog/application/mapAdminMenu";
import { ImageUploadField } from "@/domains/site/puck/ImageUploadField";
import {
    SiteRenderContext,
    sitePuckConfig,
} from "@/domains/site/puck/sitePuckConfig";

// International Curated Mood Themes (1-Click Presets)
interface ThemePreset {
    id: string;
    name: string;
    subtitle: string;
    theme: Partial<SiteTheme>;
    previewColors: string[];
}

const INTERNATIONAL_MOOD_THEMES: ThemePreset[] = [
    {
        id: "golden-cloche",
        name: "Golden Cloche Luxury",
        subtitle: "Warm amber, dark zinc & golden radiance",
        previewColors: ["#d97706", "#18181b", "#fde68a"],
        theme: {
            primaryColor: "#d97706",
            accentColor: "#18181b",
            backgroundColor: "#fffbf0",
            textColor: "#18181b",
            backgroundType: "gradient",
            backgroundGradient:
                "linear-gradient(135deg, #fffbeb 0%, #fef3c7 45%, #fde68a 100%)",
            fontDisplay: "Fraunces, serif",
            fontBody: "DM Sans, sans-serif",
            borderRadius: "xl",
        },
    },
    {
        id: "warm-habesha",
        name: "Warm Habesha Bistro",
        subtitle: "Rich terracotta spice & clay earth tones",
        previewColors: ["#c2410c", "#451a03", "#fdf8f4"],
        theme: {
            primaryColor: "#c2410c",
            accentColor: "#451a03",
            backgroundColor: "#fdf8f4",
            textColor: "#291508",
            backgroundType: "solid",
            fontDisplay: "Georgia, serif",
            fontBody: "DM Sans, sans-serif",
            borderRadius: "md",
        },
    },
    {
        id: "emerald-garden",
        name: "Emerald Botanical Lounge",
        subtitle: "Fresh mint, deep forest & botanical luxury",
        previewColors: ["#059669", "#064e3b", "#dcfce7"],
        theme: {
            primaryColor: "#059669",
            accentColor: "#064e3b",
            backgroundColor: "#f0fdf4",
            textColor: "#06281e",
            backgroundType: "gradient",
            backgroundGradient:
                "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
            fontDisplay: "Playfair Display, serif",
            fontBody: "Plus Jakarta Sans, sans-serif",
            borderRadius: "xl",
        },
    },
    {
        id: "midnight-obsidian",
        name: "Midnight Obsidian",
        subtitle: "Sleek dark mode with vibrant amber highlights",
        previewColors: ["#f59e0b", "#0f172a", "#1e293b"],
        theme: {
            primaryColor: "#f59e0b",
            accentColor: "#f8fafc",
            backgroundColor: "#0f172a",
            textColor: "#f8fafc",
            backgroundType: "gradient",
            backgroundGradient:
                "linear-gradient(180deg, #0b1120 0%, #1e293b 100%)",
            fontDisplay: "Inter, sans-serif",
            fontBody: "Inter, sans-serif",
            borderRadius: "md",
        },
    },
    {
        id: "sunset-terracotta",
        name: "Sunset Terracotta",
        subtitle: "Warm ochre, sunset ember & soft sand",
        previewColors: ["#e85d04", "#7c2d12", "#ffedd5"],
        theme: {
            primaryColor: "#e85d04",
            accentColor: "#7c2d12",
            backgroundColor: "#fff7ed",
            textColor: "#1c1917",
            backgroundType: "gradient",
            backgroundGradient:
                "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)",
            fontDisplay: "Playfair Display, serif",
            fontBody: "DM Sans, sans-serif",
            borderRadius: "xl",
        },
    },
    {
        id: "minimalist-pearl",
        name: "Minimalist Pearl",
        subtitle: "Monochrome high-contrast gallery style",
        previewColors: ["#000000", "#71717a", "#ffffff"],
        theme: {
            primaryColor: "#000000",
            accentColor: "#27272a",
            backgroundColor: "#ffffff",
            textColor: "#09090b",
            backgroundType: "solid",
            fontDisplay: "Inter, sans-serif",
            fontBody: "system-ui, sans-serif",
            borderRadius: "none",
        },
    },
];

// Curated Background Gradients
const CURATED_GRADIENTS = [
    {
        id: "golden-amber",
        label: "Golden Amber",
        value: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 45%, #fde68a 100%)",
    },
    {
        id: "sunset-ember",
        label: "Sunset Ember",
        value: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fbcfe8 100%)",
    },
    {
        id: "obsidian-slate",
        label: "Obsidian Slate",
        value: "linear-gradient(180deg, #0b1120 0%, #1e293b 100%)",
    },
    {
        id: "deep-espresso",
        label: "Deep Espresso",
        value: "linear-gradient(180deg, #1c1917 0%, #292524 100%)",
    },
    {
        id: "emerald-mint",
        label: "Emerald Mint",
        value: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
    },
    {
        id: "rose-quartz",
        label: "Rose Quartz",
        value: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%)",
    },
];

// Curated Background Atmospheric Wallpapers / Textures
const CURATED_WALLPAPERS = [
    {
        id: "coffee-ceremony",
        label: "Coffee Ceremony",
        url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop",
    },
    {
        id: "luxury-dining",
        label: "Fine Dining",
        url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
    },
    {
        id: "warm-stone",
        label: "Slate & Marble",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
    },
    {
        id: "cozy-bistro",
        label: "Cozy Bistro",
        url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop",
    },
];

type CustomizerTab = "mood" | "background" | "branding" | "typography";

export default function WebsiteEditorPage() {
    const { data, isLoading, error, refetch } = useGetTenantSiteQuery();
    const { data: menuData } = useAdminMenuItemsQuery();
    const [updateSite, { isLoading: saving }] = useUpdateTenantSiteMutation();
    const [publishSite, { isLoading: publishing }] =
        usePublishTenantSiteMutation();
    const [unpublishSite, { isLoading: unpublishing }] =
        useUnpublishTenantSiteMutation();

    const site = data?.data;
    const [slug, setSlug] = useState("");
    const [theme, setTheme] = useState<SiteTheme | null>(null);
    const [draftData, setDraftData] = useState<Data | null>(null);
    const [activeTab, setActiveTab] = useState<CustomizerTab>("mood");
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(true);

    useEffect(() => {
        if (!site) return;
        setSlug(site.slug);
        setTheme(site.theme);
        setDraftData(site.draftData as Data);
    }, [site]);

    const previewMenuItems = useMemo<PublicMenuItem[]>(() => {
        return (menuData?.data || []).map(item => {
            const mapped = adminMenuItemToCatalog(item);
            return {
                id: item.id,
                name: item.name,
                description: item.description || "",
                price: Number(item.price) || 0,
                currencyCode: item.currencyCode || "ETB",
                imageUrl: mapped.image || item.imageUrl || null,
                categoryId: item.categoryId || "",
                categoryName: item.categoryName || "Menu",
                soldOut: item.soldOut || item.available === false,
            };
        });
    }, [menuData?.data]);

    const renderContext = useMemo(
        () => ({
            theme: theme ||
                site?.theme || {
                    primaryColor: "#e85d04",
                    accentColor: "#0f172a",
                    backgroundColor: "#fffaf5",
                    textColor: "#0f172a",
                    backgroundType: "solid" as const,
                },
            tenantName: site?.tenantName || "Restaurant",
            phone: null as string | null,
            email: null as string | null,
            city: null as string | null,
            address: null as string | null,
            hours: null as string | null,
            menuItems: previewMenuItems,
        }),
        [theme, site?.theme, site?.tenantName, previewMenuItems],
    );

    // Compute live background style for Puck wrapper
    const computedBackgroundStyle = useMemo(() => {
        if (!theme) return "#fffaf5";
        if (theme.backgroundType === "gradient" && theme.backgroundGradient) {
            return theme.backgroundGradient;
        }
        if (theme.backgroundType === "image" && theme.backgroundImageUrl) {
            const opacity = theme.backgroundOverlayOpacity ?? 0.85;
            const isDark =
                theme.textColor === "#f8fafc" || theme.textColor === "#ffffff";
            const overlay = isDark
                ? `rgba(15, 23, 42, ${opacity})`
                : `rgba(255, 255, 255, ${opacity})`;
            return `linear-gradient(${overlay}, ${overlay}), url("${theme.backgroundImageUrl}") center/cover fixed no-repeat`;
        }
        return theme.backgroundColor || "#fffaf5";
    }, [theme]);

    function applyMoodTheme(preset: ThemePreset) {
        if (!theme) return;
        setTheme({
            ...theme,
            ...preset.theme,
        });
        toast.success("Theme Applied!", `${preset.name} style is now active.`);
    }

    async function saveDraft(nextData?: Data) {
        if (!theme) return;
        try {
            const result = await updateSite({
                slug: slug.trim() || undefined,
                theme,
                draftData: (nextData || draftData || undefined) as
                    | Record<string, unknown>
                    | undefined,
            }).unwrap();
            setSlug(result.data.slug);
            setTheme(result.data.theme);
            setDraftData(result.data.draftData as Data);
            toast.success("Draft saved");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Could not save website draft.";
            toast.error(message);
        }
    }

    async function onPublish() {
        try {
            await saveDraft();
            await publishSite().unwrap();
            toast.success("Website published");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Could not publish website.";
            toast.error(message);
        }
    }

    async function onUnpublish() {
        try {
            await unpublishSite().unwrap();
            toast.success("Website unpublished");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Could not unpublish website.";
            toast.error(message);
        }
    }

    if (isLoading || !site || !theme || !draftData) {
        return (
            <DashboardFrame>
                <div className="flex min-h-[320px] items-center justify-center gap-2 text-[13px] text-slate-gray">
                    <Loader2 className="size-4 animate-spin text-brand" />
                    Loading website editor…
                </div>
            </DashboardFrame>
        );
    }

    if (error) {
        return (
            <DashboardFrame>
                <PageHeader
                    eyebrow="Business"
                    title="Website"
                    description="Build and publish your public restaurant site."
                />
                <div className="rounded-[16px] border border-destructive/20 bg-destructive/10 p-4 text-[13px] text-destructive">
                    Unable to load website editor. Sign in as owner or manager.
                </div>
            </DashboardFrame>
        );
    }

    const publicHref = site.publicPath;
    const published = site.status === "PUBLISHED";

    return (
        <DashboardFrame>
            {/* Top Bar Actions */}
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <PageHeader
                    eyebrow="Business"
                    title="Website Studio"
                    description="Curate international brand themes, rich gradients, and custom wallpapers for your public restaurant site."
                />
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={published ? "success" : "secondary"}>
                        {published ? "Published" : "Draft"}
                    </Badge>
                    <a
                        href={publicHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-hairline px-3 py-2 text-[12px] font-medium hover:bg-surface-ivory"
                    >
                        <ExternalLink className="size-3.5" />
                        Open public URL
                    </a>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveDraft()}
                        className="rounded-xl border border-hairline px-3 py-2 text-[12px] font-medium hover:bg-surface-ivory disabled:opacity-60"
                    >
                        {saving ? "Saving…" : "Save draft"}
                    </button>
                    {published ? (
                        <button
                            type="button"
                            disabled={unpublishing}
                            onClick={() => void onUnpublish()}
                            className="rounded-xl border border-hairline px-3 py-2 text-[12px] font-medium hover:bg-surface-ivory"
                        >
                            Unpublish
                        </button>
                    ) : null}
                    <button
                        type="button"
                        disabled={publishing}
                        onClick={() => void onPublish()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-brand/90 disabled:opacity-60 shadow-xs"
                    >
                        <Globe2 className="size-3.5" />
                        {publishing ? "Publishing…" : "Publish"}
                    </button>
                </div>
            </div>

            {/* International Theme & Brand Studio Drawer */}
            <div className="mb-5 overflow-hidden rounded-3xl border border-hairline bg-card shadow-xs">
                {/* Customizer Navigation Tabs */}
                <div className="flex flex-wrap items-center justify-between border-b border-hairline bg-surface-ivory/50 px-4 py-2.5">
                    <div className="flex items-center gap-1">
                        {[
                            {
                                id: "mood",
                                label: "Mood Themes",
                                icon: Sparkles,
                            },
                            {
                                id: "background",
                                label: "Background & Gradient",
                                icon: Layers,
                            },
                            {
                                id: "branding",
                                label: "Brand Colors & Logo",
                                icon: Palette,
                            },
                            {
                                id: "typography",
                                label: "Typography & Shape",
                                icon: Type,
                            },
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(tab.id as CustomizerTab);
                                        setIsCustomizerOpen(true);
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                        isActive
                                            ? "bg-white text-slate-900 shadow-xs border border-hairline"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                                    }`}
                                >
                                    <Icon
                                        className={`size-3.5 ${isActive ? "text-brand" : "text-slate-400"}`}
                                    />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCustomizerOpen(!isCustomizerOpen)}
                        className="text-xs text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                    >
                        {isCustomizerOpen ? "Collapse" : "Expand"}
                        <ChevronDown
                            className={`size-3.5 transition-transform ${isCustomizerOpen ? "rotate-180" : ""}`}
                        />
                    </button>
                </div>

                {/* Tab Content Panels */}
                {isCustomizerOpen ? (
                    <div className="p-4 sm:p-5">
                        {/* TAB 1: 1-Click Curated Mood Themes */}
                        {activeTab === "mood" ? (
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">
                                        International Restaurant Aesthetics
                                        (1-Click Presets)
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                        Instantly align colors, gradients, font
                                        styles, and border radius in one tap.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                    {INTERNATIONAL_MOOD_THEMES.map(preset => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() =>
                                                applyMoodTheme(preset)
                                            }
                                            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left transition-all hover:border-brand hover:shadow-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    {preset.previewColors.map(
                                                        (color, idx) => (
                                                            <span
                                                                key={idx}
                                                                style={{
                                                                    backgroundColor:
                                                                        color,
                                                                }}
                                                                className="size-4 rounded-full border border-black/10 shadow-2xs"
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Apply ✦
                                                </span>
                                            </div>

                                            <div className="mt-3">
                                                <h5 className="text-xs font-bold text-slate-900">
                                                    {preset.name}
                                                </h5>
                                                <p className="mt-0.5 text-[10px] text-slate-500">
                                                    {preset.subtitle}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* TAB 2: Multi-Mode Background Customizer */}
                        {activeTab === "background" ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">
                                            Background Styling & Atmosphere
                                        </h4>
                                        <p className="text-[11px] text-slate-500">
                                            Choose between solid minimalist
                                            colors, multi-stop luxury gradients,
                                            or restaurant atmosphere wallpapers.
                                        </p>
                                    </div>

                                    {/* Mode Selector */}
                                    <div className="inline-flex rounded-xl border border-hairline bg-slate-100 p-1 text-xs">
                                        {[
                                            {
                                                id: "solid",
                                                label: "Solid Color",
                                            },
                                            {
                                                id: "gradient",
                                                label: "Gradient",
                                            },
                                            {
                                                id: "image",
                                                label: "Wallpaper Image",
                                            },
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() =>
                                                    setTheme({
                                                        ...theme,
                                                        backgroundType: m.id as
                                                            | "solid"
                                                            | "gradient"
                                                            | "image",
                                                    })
                                                }
                                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                                    (theme.backgroundType ||
                                                        "solid") === m.id
                                                        ? "bg-white text-slate-900 shadow-2xs"
                                                        : "text-slate-500 hover:text-slate-900"
                                                }`}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Mode A: Solid Color */}
                                {(theme.backgroundType || "solid") ===
                                "solid" ? (
                                    <div className="space-y-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                                <span>Custom Hex:</span>
                                                <input
                                                    type="color"
                                                    value={
                                                        theme.backgroundColor ||
                                                        "#fffaf5"
                                                    }
                                                    onChange={e =>
                                                        setTheme({
                                                            ...theme,
                                                            backgroundColor:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="size-8 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5"
                                                />
                                                <span className="font-mono text-[11px] text-slate-500">
                                                    {theme.backgroundColor ||
                                                        "#fffaf5"}
                                                </span>
                                            </label>

                                            <span className="text-slate-300">
                                                |
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] text-slate-500 font-medium">
                                                    Quick Swatches:
                                                </span>
                                                {[
                                                    {
                                                        label: "Ivory Cream",
                                                        hex: "#fffaf5",
                                                    },
                                                    {
                                                        label: "Crisp White",
                                                        hex: "#ffffff",
                                                    },
                                                    {
                                                        label: "Warm Linen",
                                                        hex: "#fdf8f4",
                                                    },
                                                    {
                                                        label: "Slate Stone",
                                                        hex: "#f8fafc",
                                                    },
                                                    {
                                                        label: "Obsidian Dark",
                                                        hex: "#0f172a",
                                                    },
                                                    {
                                                        label: "Espresso",
                                                        hex: "#1c1917",
                                                    },
                                                ].map(swatch => (
                                                    <button
                                                        key={swatch.hex}
                                                        type="button"
                                                        onClick={() =>
                                                            setTheme({
                                                                ...theme,
                                                                backgroundColor:
                                                                    swatch.hex,
                                                                textColor:
                                                                    swatch.hex ===
                                                                        "#0f172a" ||
                                                                    swatch.hex ===
                                                                        "#1c1917"
                                                                        ? "#f8fafc"
                                                                        : "#0f172a",
                                                            })
                                                        }
                                                        style={{
                                                            backgroundColor:
                                                                swatch.hex,
                                                        }}
                                                        className="size-6 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                                                        title={swatch.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Mode B: Multi-stop Gradients */}
                                {theme.backgroundType === "gradient" ? (
                                    <div className="space-y-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                                            {CURATED_GRADIENTS.map(grad => (
                                                <button
                                                    key={grad.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setTheme({
                                                            ...theme,
                                                            backgroundGradient:
                                                                grad.value,
                                                            textColor:
                                                                grad.id ===
                                                                    "obsidian-slate" ||
                                                                grad.id ===
                                                                    "deep-espresso"
                                                                    ? "#f8fafc"
                                                                    : "#0f172a",
                                                        })
                                                    }
                                                    className={`group relative h-16 rounded-xl border p-2 text-left transition-all ${
                                                        theme.backgroundGradient ===
                                                        grad.value
                                                            ? "border-brand ring-2 ring-brand/20 shadow-xs"
                                                            : "border-slate-200 hover:border-slate-400"
                                                    }`}
                                                    style={{
                                                        background: grad.value,
                                                    }}
                                                >
                                                    <span className="absolute bottom-1.5 left-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                                        {grad.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        <div>
                                            <Label className="text-[11px] font-semibold text-slate-700">
                                                Custom CSS Gradient Formula:
                                            </Label>
                                            <Input
                                                value={
                                                    theme.backgroundGradient ||
                                                    ""
                                                }
                                                onChange={e =>
                                                    setTheme({
                                                        ...theme,
                                                        backgroundGradient:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)"
                                                className="mt-1 font-mono text-xs"
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                {/* Mode C: Atmosphere Image / Texture Wallpaper */}
                                {theme.backgroundType === "image" ? (
                                    <div className="space-y-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                                        <div>
                                            <span className="text-[11px] text-slate-500 font-medium">
                                                Curated Restaurant Atmospheres:
                                            </span>
                                            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                {CURATED_WALLPAPERS.map(wp => (
                                                    <button
                                                        key={wp.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setTheme({
                                                                ...theme,
                                                                backgroundImageUrl:
                                                                    wp.url,
                                                            })
                                                        }
                                                        className={`group relative h-16 overflow-hidden rounded-xl border transition-all ${
                                                            theme.backgroundImageUrl ===
                                                            wp.url
                                                                ? "border-brand ring-2 ring-brand/20 shadow-xs"
                                                                : "border-slate-200 hover:border-slate-400"
                                                        }`}
                                                    >
                                                        <img
                                                            src={wp.url}
                                                            alt={wp.label}
                                                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                                        />
                                                        <span className="absolute bottom-1.5 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                                            {wp.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-200/60">
                                            <div>
                                                <Label className="text-[11px] font-semibold text-slate-700">
                                                    Custom Image Wallpaper URL:
                                                </Label>
                                                <Input
                                                    value={
                                                        theme.backgroundImageUrl ||
                                                        ""
                                                    }
                                                    onChange={e =>
                                                        setTheme({
                                                            ...theme,
                                                            backgroundImageUrl:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Paste image link (https://...)"
                                                    className="mt-1 text-xs"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                                                    <span>
                                                        Overlay Contrast Tint:
                                                    </span>
                                                    <span>
                                                        {Math.round(
                                                            (theme.backgroundOverlayOpacity ??
                                                                0.85) * 100,
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.30"
                                                    max="0.95"
                                                    step="0.05"
                                                    value={
                                                        theme.backgroundOverlayOpacity ??
                                                        0.85
                                                    }
                                                    onChange={e =>
                                                        setTheme({
                                                            ...theme,
                                                            backgroundOverlayOpacity:
                                                                parseFloat(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                        })
                                                    }
                                                    className="mt-2 w-full accent-brand cursor-pointer"
                                                />
                                                <p className="mt-1 text-[10px] text-slate-400">
                                                    Higher overlay guarantees
                                                    perfect readability of menu
                                                    dishes and text.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        {/* TAB 3: Brand Colors & Assets */}
                        {activeTab === "branding" ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">
                                        Core Brand Palette & Identity
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                        Configure your signature button colors,
                                        accent highlights, and official logo.
                                    </p>
                                </div>

                                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                                    <label className="space-y-1 text-xs">
                                        <span className="font-semibold text-slate-700">
                                            Public Slug
                                        </span>
                                        <Input
                                            value={slug}
                                            onChange={e =>
                                                setSlug(
                                                    e.target.value.toLowerCase(),
                                                )
                                            }
                                            placeholder="abyssinia-grill"
                                            className="text-xs"
                                        />
                                    </label>

                                    <label className="space-y-1 text-xs">
                                        <span className="font-semibold text-slate-700">
                                            Primary Brand
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                value={theme.primaryColor}
                                                onChange={e =>
                                                    setTheme({
                                                        ...theme,
                                                        primaryColor:
                                                            e.target.value,
                                                    })
                                                }
                                                className="size-9 cursor-pointer p-0.5"
                                            />
                                            <span className="font-mono text-[11px] text-slate-500">
                                                {theme.primaryColor}
                                            </span>
                                        </div>
                                    </label>

                                    <label className="space-y-1 text-xs">
                                        <span className="font-semibold text-slate-700">
                                            Accent Highlight
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                value={theme.accentColor}
                                                onChange={e =>
                                                    setTheme({
                                                        ...theme,
                                                        accentColor:
                                                            e.target.value,
                                                    })
                                                }
                                                className="size-9 cursor-pointer p-0.5"
                                            />
                                            <span className="font-mono text-[11px] text-slate-500">
                                                {theme.accentColor}
                                            </span>
                                        </div>
                                    </label>

                                    <label className="space-y-1 text-xs">
                                        <span className="font-semibold text-slate-700">
                                            Text Color
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                value={theme.textColor}
                                                onChange={e =>
                                                    setTheme({
                                                        ...theme,
                                                        textColor:
                                                            e.target.value,
                                                    })
                                                }
                                                className="size-9 cursor-pointer p-0.5"
                                            />
                                            <span className="font-mono text-[11px] text-slate-500">
                                                {theme.textColor}
                                            </span>
                                        </div>
                                    </label>

                                    <div>
                                        <ImageUploadField
                                            label="Official Logo"
                                            value={theme.logoUrl || ""}
                                            onChange={logoUrl =>
                                                setTheme({
                                                    ...theme,
                                                    logoUrl: logoUrl || null,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* TAB 4: Typography & Shape */}
                        {activeTab === "typography" ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">
                                        Typography Pairings & Card Shape
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                        Select international headline font
                                        pairings and button corner curvature.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-700">
                                            Headline Display Font
                                        </Label>
                                        <select
                                            value={
                                                theme.fontDisplay ||
                                                "Fraunces, serif"
                                            }
                                            onChange={e =>
                                                setTheme({
                                                    ...theme,
                                                    fontDisplay: e.target.value,
                                                })
                                            }
                                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
                                        >
                                            <option value="Fraunces, serif">
                                                Fraunces (Luxury Serif)
                                            </option>
                                            <option value="Playfair Display, serif">
                                                Playfair Display (Editorial)
                                            </option>
                                            <option value="Inter, sans-serif">
                                                Inter (Modern Clean)
                                            </option>
                                            <option value="Georgia, serif">
                                                Georgia (Classic Bistro)
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold text-slate-700">
                                            Body Reading Font
                                        </Label>
                                        <select
                                            value={
                                                theme.fontBody ||
                                                "DM Sans, sans-serif"
                                            }
                                            onChange={e =>
                                                setTheme({
                                                    ...theme,
                                                    fontBody: e.target.value,
                                                })
                                            }
                                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
                                        >
                                            <option value="DM Sans, sans-serif">
                                                DM Sans (Warm Modern)
                                            </option>
                                            <option value="Inter, sans-serif">
                                                Inter (High Legibility)
                                            </option>
                                            <option value="Plus Jakarta Sans, sans-serif">
                                                Plus Jakarta Sans (Crisp)
                                            </option>
                                            <option value="system-ui, sans-serif">
                                                System UI (Native)
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold text-slate-700">
                                            Button & Card Corner Radius
                                        </Label>
                                        <div className="mt-1.5 grid grid-cols-4 gap-1">
                                            {[
                                                { id: "none", label: "Sharp" },
                                                { id: "md", label: "Subtle" },
                                                { id: "xl", label: "Curved" },
                                                { id: "full", label: "Pill" },
                                            ].map(r => (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setTheme({
                                                            ...theme,
                                                            borderRadius:
                                                                r.id as
                                                                    | "none"
                                                                    | "md"
                                                                    | "xl"
                                                                    | "full",
                                                        })
                                                    }
                                                    className={`rounded-lg py-1.5 text-center text-xs font-semibold transition-all ${
                                                        (theme.borderRadius ||
                                                            "md") === r.id
                                                            ? "bg-brand text-white shadow-xs"
                                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {/* Puck Visual Canvas with Live Computed Theme Background */}
            <div className="overflow-hidden rounded-3xl border border-hairline bg-card shadow-lg">
                <SiteRenderContext.Provider value={renderContext}>
                    <div
                        style={
                            {
                                "--site-font-display":
                                    theme.fontDisplay || "Georgia, serif",
                                "--site-font-body":
                                    theme.fontBody || "system-ui, sans-serif",
                                color: theme.textColor,
                                background: computedBackgroundStyle,
                                transition:
                                    "background 0.25s ease-out, color 0.2s ease-out",
                            } as React.CSSProperties
                        }
                    >
                        <Puck
                            config={sitePuckConfig}
                            data={draftData}
                            onChange={data => setDraftData(data)}
                            onPublish={async data => {
                                setDraftData(data);
                                await saveDraft(data);
                            }}
                            headerTitle={`${site.tenantName} site`}
                        />
                    </div>
                </SiteRenderContext.Provider>
            </div>
        </DashboardFrame>
    );
}
