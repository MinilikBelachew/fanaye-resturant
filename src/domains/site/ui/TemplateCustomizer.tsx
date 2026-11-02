"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Render, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import {
    ArrowLeft,
    Building2,
    Check,
    Clock,
    ExternalLink,
    Eye,
    Globe,
    Layers,
    Loader2,
    Mail,
    MapPin,
    Monitor,
    Palette,
    Phone,
    Rocket,
    Save,
    Smartphone,
    Sparkles,
    Tablet,
    Type,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type {
    PublicMenuItem,
    SiteTheme,
    TenantProfile,
} from "@/context/services/siteApi";
import {
    DEFAULT_SECTION_VISIBILITY,
    buildTemplateDraft,
    getTemplate,
    type SectionVisibility,
    type WebsiteTemplateId,
} from "@/domains/site/templates/restaurantTemplates";
import {
    SiteRenderContext,
    bindSiteRender,
    sitePuckConfig,
} from "@/domains/site/puck/sitePuckConfig";
import { SiteFontLoader } from "@/domains/site/puck/siteTypography";

export interface CustomizationData {
    profile: {
        tagline?: string;
        story?: string;
        phone?: string;
        email?: string;
        address?: string;
        city?: string;
        hours?: string;
        instagram?: string;
        facebook?: string;
        tiktok?: string;
        telegram?: string;
    };
    theme: Partial<SiteTheme>;
    sections: SectionVisibility;
    heroImageUrl?: string;
}

interface TemplateCustomizerProps {
    templateId: WebsiteTemplateId;
    templateName: string;
    tenantName: string;
    branchName?: string | null;
    branchData?: {
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        city?: string | null;
    } | null;
    initialProfile?: TenantProfile | null;
    initialTheme?: Partial<SiteTheme> | null;
    initialSections?: SectionVisibility | null;
    menuItems?: PublicMenuItem[];
    publicUrl?: string | null;
    isPublished?: boolean;
    busy?: boolean;
    publishing?: boolean;
    onSave: (data: CustomizationData) => Promise<void> | void;
    onPublish: (data: CustomizationData) => Promise<void> | void;
    onBack: () => void;
}

type TabKey = "info" | "sections" | "theme";
type DevicePreview = "desktop" | "tablet" | "mobile";

const COLOR_SCHEMES = [
    {
        id: "foodly-yellow",
        name: "Foodly Gold",
        primary: "#FDB913",
        text: "#1F2937",
        bg: "#F9FAFB",
        preview: "linear-gradient(135deg, #FDB913 0%, #fbbf24 100%)",
    },
    {
        id: "warm-orange",
        name: "Warm Bistro",
        primary: "#ff6a00",
        text: "#171717",
        bg: "#fdfcf9",
        preview: "linear-gradient(135deg, #ff6a00 0%, #ea580c 100%)",
    },
    {
        id: "ember-gold",
        name: "Ember Dark",
        primary: "#f59e0b",
        text: "#f8fafc",
        bg: "#020617",
        preview:
            "linear-gradient(135deg, #020617 0%, #1e293b 50%, #f59e0b 100%)",
    },
    {
        id: "forest-emerald",
        name: "Botanical Green",
        primary: "#059669",
        text: "#022c22",
        bg: "#f4fbf7",
        preview: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    },
    {
        id: "habesha-roastery",
        name: "Habesha Roastery",
        primary: "#92400e",
        text: "#1c1917",
        bg: "#faf7f2",
        preview: "linear-gradient(135deg, #92400e 0%, #78350f 100%)",
    },
    {
        id: "royal-blue",
        name: "Royal Navy",
        primary: "#1e40af",
        text: "#0f172a",
        bg: "#f8fafc",
        preview: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    },
    {
        id: "burgundy",
        name: "Burgundy Wine",
        primary: "#9f1239",
        text: "#1c1917",
        bg: "#fff1f2",
        preview: "linear-gradient(135deg, #9f1239 0%, #e11d48 100%)",
    },
    {
        id: "city-charcoal",
        name: "City Monochrome",
        primary: "#18181b",
        text: "#09090b",
        bg: "#ffffff",
        preview: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
    },
];

const FONT_PRESETS = [
    {
        id: "modern",
        name: "Inter Modern",
        display: "Inter, system-ui, sans-serif",
        body: "Inter, system-ui, sans-serif",
    },
    {
        id: "editorial",
        name: "Fraunces Serif & Clean Sans",
        display: "Fraunces, Georgia, serif",
        body: "DM Sans, sans-serif",
    },
    {
        id: "playfair",
        name: "Playfair Luxury",
        display: "Playfair Display, serif",
        body: "Plus Jakarta Sans, sans-serif",
    },
    {
        id: "outfit",
        name: "Outfit Friendly",
        display: "Outfit, system-ui, sans-serif",
        body: "DM Sans, sans-serif",
    },
];

export default function TemplateCustomizer({
    templateId,
    templateName,
    tenantName,
    branchName,
    branchData,
    initialProfile,
    initialTheme,
    initialSections,
    menuItems = [],
    publicUrl,
    isPublished = false,
    busy = false,
    publishing = false,
    onSave,
    onPublish,
    onBack,
}: TemplateCustomizerProps) {
    const t = useTranslations("websiteStudio");

    // Profile data with auto-fill fallback from branch
    const [profile, setProfile] = useState({
        tagline:
            initialProfile?.tagline ||
            (branchName
                ? `Welcome to ${tenantName} · ${branchName}`
                : `Welcome to ${tenantName}`),
        story:
            initialProfile?.story ||
            `At ${tenantName}${
                branchName ? ` (${branchName})` : ""
            }, we prepare delicious meals daily with fresh, high-quality ingredients. Order from your table or explore our full menu.`,
        phone: initialProfile?.phone || branchData?.phone || "+251 911 000 000",
        email:
            initialProfile?.email ||
            branchData?.email ||
            "contact@restaurant.com",
        address:
            initialProfile?.address ||
            branchData?.address ||
            "Bole Road, Central District",
        city: initialProfile?.city || branchData?.city || "Addis Ababa",
        hours:
            initialProfile?.hours ||
            "Mon – Sun: 8:00 AM – 10:00 PM\nKitchen closes at 9:30 PM",
        instagram: initialProfile?.instagram || "",
        facebook: initialProfile?.facebook || "",
        tiktok: initialProfile?.tiktok || "",
        telegram: initialProfile?.telegram || "",
    });

    // Theme state
    const templateMeta = useMemo(() => getTemplate(templateId), [templateId]);

    const [theme, setTheme] = useState<Partial<SiteTheme>>({
        primaryColor:
            initialTheme?.primaryColor ||
            templateMeta.theme.primaryColor ||
            "#FDB913",
        accentColor:
            initialTheme?.accentColor ||
            templateMeta.theme.accentColor ||
            "#1F2937",
        backgroundColor:
            initialTheme?.backgroundColor ||
            templateMeta.theme.backgroundColor ||
            "#F9FAFB",
        textColor:
            initialTheme?.textColor ||
            templateMeta.theme.textColor ||
            "#1F2937",
        logoUrl: initialTheme?.logoUrl || "",
        fontDisplay:
            initialTheme?.fontDisplay ||
            templateMeta.theme.fontDisplay ||
            "Inter, system-ui, sans-serif",
        fontBody:
            initialTheme?.fontBody ||
            templateMeta.theme.fontBody ||
            "Inter, system-ui, sans-serif",
        borderRadius:
            initialTheme?.borderRadius ||
            templateMeta.theme.borderRadius ||
            "xl",
    });

    const [heroImageUrl, setHeroImageUrl] = useState<string>(
        templateMeta.previewImage || "",
    );

    // Section visibility toggles ("Can be in the website or not")
    const [sections, setSections] = useState<SectionVisibility>({
        ...DEFAULT_SECTION_VISIBILITY,
        ...initialSections,
    });

    const [activeTab, setActiveTab] = useState<TabKey>("info");
    const [devicePreview, setDevicePreview] =
        useState<DevicePreview>("desktop");

    // Auto-fill from branch action
    function handleAutoFillFromBranch() {
        setProfile(prev => ({
            ...prev,
            phone: branchData?.phone || prev.phone,
            email: branchData?.email || prev.email,
            address: branchData?.address || prev.address,
            city: branchData?.city || prev.city,
            tagline: branchName
                ? `Welcome to ${tenantName} · ${branchName}`
                : `Welcome to ${tenantName}`,
        }));
        toast.success(
            `Filled branch details${branchName ? ` for ${branchName}` : ""}!`,
        );
    }

    // Live draft data for the preview
    const liveDraftData = useMemo<Data>(() => {
        const effectiveName = branchName
            ? `${tenantName} · ${branchName}`
            : tenantName;
        return buildTemplateDraft(templateId, effectiveName, profile, {
            sections,
            heroImageUrl: heroImageUrl.trim() || undefined,
            customTagline: profile.tagline,
            menuData: menuItems,
        });
    }, [
        templateId,
        tenantName,
        branchName,
        profile,
        sections,
        heroImageUrl,
        menuItems,
    ]);

    // Live render context for puck
    const renderContext = useMemo(() => {
        const ctx = {
            theme: {
                primaryColor: theme.primaryColor || "#FDB913",
                accentColor: theme.accentColor || "#1F2937",
                backgroundColor: theme.backgroundColor || "#F9FAFB",
                textColor: theme.textColor || "#1F2937",
                logoUrl: theme.logoUrl,
                fontDisplay:
                    theme.fontDisplay || "Inter, system-ui, sans-serif",
                fontBody: theme.fontBody || "Inter, system-ui, sans-serif",
                borderRadius: theme.borderRadius || "xl",
            },
            tenantName: branchName
                ? `${tenantName} · ${branchName}`
                : tenantName,
            phone: profile.phone || null,
            email: profile.email || null,
            city: profile.city || null,
            address: profile.address || null,
            hours: profile.hours || null,
            tagline: profile.tagline || null,
            story: profile.story || null,
            instagram: profile.instagram || null,
            facebook: profile.facebook || null,
            tiktok: profile.tiktok || null,
            telegram: profile.telegram || null,
            menuItems,
            viewport: devicePreview,
        };
        bindSiteRender(ctx);
        return ctx;
    }, [theme, tenantName, branchName, profile, menuItems, devicePreview]);

    // Save and Publish handlers
    function handleSaveDraft() {
        void onSave({
            profile,
            theme,
            sections,
            heroImageUrl: heroImageUrl.trim() || undefined,
        });
    }

    function handlePublishLive() {
        void onPublish({
            profile,
            theme,
            sections,
            heroImageUrl: heroImageUrl.trim() || undefined,
        });
    }

    return (
        <div className="flex h-screen flex-col bg-surface-ivory dark:bg-background overflow-hidden">
            {/* Top Command Bar */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-card px-4 z-20">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        disabled={busy || publishing}
                        className="gap-1.5 text-xs text-slate-gray hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Change Template</span>
                    </Button>
                    <div className="h-4 w-px bg-hairline" />
                    <div className="flex items-center gap-2">
                        <span
                            className="size-2.5 rounded-full"
                            style={{
                                background: theme.primaryColor || "#FDB913",
                            }}
                        />
                        <span className="text-xs font-semibold text-foreground">
                            {templateName}
                        </span>
                        {branchName ? (
                            <Badge
                                variant="outline"
                                className="text-[11px] font-normal gap-1"
                            >
                                <Building2 className="size-3 text-brand" />
                                {branchName}
                            </Badge>
                        ) : null}
                    </div>
                </div>

                {/* Device Viewport Selector */}
                <div className="hidden sm:flex items-center gap-1 rounded-xl border border-hairline bg-surface-ivory/50 dark:bg-card/50 p-1">
                    <button
                        type="button"
                        onClick={() => setDevicePreview("desktop")}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                            devicePreview === "desktop"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-slate-gray hover:text-foreground",
                        )}
                        title="Desktop view"
                    >
                        <Monitor className="size-3.5" />
                        <span className="hidden md:inline">Desktop</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setDevicePreview("tablet")}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                            devicePreview === "tablet"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-slate-gray hover:text-foreground",
                        )}
                        title="Tablet view"
                    >
                        <Tablet className="size-3.5" />
                        <span className="hidden md:inline">Tablet</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setDevicePreview("mobile")}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                            devicePreview === "mobile"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-slate-gray hover:text-foreground",
                        )}
                        title="Mobile view"
                    >
                        <Smartphone className="size-3.5" />
                        <span className="hidden md:inline">Mobile</span>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoFillFromBranch}
                        disabled={busy || publishing}
                        className="hidden lg:flex gap-1.5 rounded-xl text-xs font-medium border-hairline"
                    >
                        <Sparkles className="size-3.5 text-brand" />
                        <span>Auto-fill from Branch</span>
                    </Button>

                    {publicUrl ? (
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-hairline bg-card px-2.5 py-1.5 text-xs font-medium text-slate-gray hover:text-foreground hover:bg-surface-ivory"
                            title="Open live website"
                        >
                            <ExternalLink className="size-3.5" />
                            <span className="hidden xl:inline">Live Site</span>
                        </a>
                    ) : null}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSaveDraft}
                        disabled={busy || publishing}
                        className="gap-1.5 rounded-xl text-xs font-medium border-hairline"
                    >
                        {busy ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Save className="size-3.5" />
                        )}
                        <span>{t("saveDraft")}</span>
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        onClick={handlePublishLive}
                        disabled={busy || publishing}
                        className="gap-1.5 rounded-xl bg-brand hover:bg-brand/90 text-white text-xs font-semibold shadow-xs"
                    >
                        {publishing ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Rocket className="size-3.5" />
                        )}
                        <span>
                            {isPublished ? "Update Live" : t("publish")}
                        </span>
                    </Button>
                </div>
            </header>

            {/* Split Screen: Customizer Sidebar + Live Canvas Preview */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Controls Sidebar (Width 400px) */}
                <aside className="w-full sm:w-[420px] shrink-0 border-r border-hairline bg-card flex flex-col z-10 shadow-xs">
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-hairline px-3 bg-surface-ivory/30 dark:bg-card/40">
                        <button
                            type="button"
                            onClick={() => setActiveTab("info")}
                            className={cn(
                                "flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition-colors",
                                activeTab === "info"
                                    ? "border-brand text-brand"
                                    : "border-transparent text-slate-gray hover:text-foreground",
                            )}
                        >
                            <Globe className="size-3.5" />
                            <span>Info & Contact</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("sections")}
                            className={cn(
                                "flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition-colors",
                                activeTab === "sections"
                                    ? "border-brand text-brand"
                                    : "border-transparent text-slate-gray hover:text-foreground",
                            )}
                        >
                            <Layers className="size-3.5" />
                            <span>Sections</span>
                            <Badge
                                variant="secondary"
                                className="ml-1 text-[10px] px-1.5 py-0"
                            >
                                {Object.values(sections).filter(Boolean).length}
                            </Badge>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("theme")}
                            className={cn(
                                "flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition-colors",
                                activeTab === "theme"
                                    ? "border-brand text-brand"
                                    : "border-transparent text-slate-gray hover:text-foreground",
                            )}
                        >
                            <Palette className="size-3.5" />
                            <span>Style & Colors</span>
                        </button>
                    </div>

                    {/* Tab Contents (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* TAB 1: BASIC INFO & CONTACT */}
                        {activeTab === "info" && (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-hairline bg-surface-ivory/50 dark:bg-card/40 p-3 text-xs text-slate-gray flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            {tenantName}
                                            {branchName
                                                ? ` · ${branchName}`
                                                : ""}
                                        </p>
                                        <p className="text-[11px] mt-0.5">
                                            Auto-synced with your restaurant and
                                            branch profile.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAutoFillFromBranch}
                                        className="h-7 text-[11px] gap-1 px-2 shrink-0 rounded-lg"
                                    >
                                        <Sparkles className="size-3 text-brand" />
                                        Auto-fill
                                    </Button>
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="tagline"
                                        className="text-xs font-semibold"
                                    >
                                        Tagline / Header Headline
                                    </Label>
                                    <Input
                                        id="tagline"
                                        value={profile.tagline}
                                        onChange={e =>
                                            setProfile(prev => ({
                                                ...prev,
                                                tagline: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. Delicious Food, Served Fresh"
                                        className="rounded-xl text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="story"
                                        className="text-xs font-semibold"
                                    >
                                        About Story / Restaurant Description
                                    </Label>
                                    <Textarea
                                        id="story"
                                        rows={3}
                                        value={profile.story}
                                        onChange={e =>
                                            setProfile(prev => ({
                                                ...prev,
                                                story: e.target.value,
                                            }))
                                        }
                                        placeholder="Tell guests about your kitchen, chef specialties, or heritage..."
                                        className="rounded-xl text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="phone"
                                            className="text-xs font-semibold flex items-center gap-1"
                                        >
                                            <Phone className="size-3 text-slate-gray" />
                                            Phone Number
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={profile.phone}
                                            onChange={e =>
                                                setProfile(prev => ({
                                                    ...prev,
                                                    phone: e.target.value,
                                                }))
                                            }
                                            placeholder="+251 911 000 000"
                                            className="rounded-xl text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="email"
                                            className="text-xs font-semibold flex items-center gap-1"
                                        >
                                            <Mail className="size-3 text-slate-gray" />
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            value={profile.email}
                                            onChange={e =>
                                                setProfile(prev => ({
                                                    ...prev,
                                                    email: e.target.value,
                                                }))
                                            }
                                            placeholder="contact@restaurant.com"
                                            className="rounded-xl text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="city"
                                            className="text-xs font-semibold flex items-center gap-1"
                                        >
                                            <MapPin className="size-3 text-slate-gray" />
                                            City / Region
                                        </Label>
                                        <Input
                                            id="city"
                                            value={profile.city}
                                            onChange={e =>
                                                setProfile(prev => ({
                                                    ...prev,
                                                    city: e.target.value,
                                                }))
                                            }
                                            placeholder="Addis Ababa"
                                            className="rounded-xl text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="address"
                                            className="text-xs font-semibold flex items-center gap-1"
                                        >
                                            <MapPin className="size-3 text-slate-gray" />
                                            Branch Street Address
                                        </Label>
                                        <Input
                                            id="address"
                                            value={profile.address}
                                            onChange={e =>
                                                setProfile(prev => ({
                                                    ...prev,
                                                    address: e.target.value,
                                                }))
                                            }
                                            placeholder="Bole, Cameroon St."
                                            className="rounded-xl text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="hours"
                                        className="text-xs font-semibold flex items-center gap-1"
                                    >
                                        <Clock className="size-3 text-slate-gray" />
                                        Operating Hours
                                    </Label>
                                    <Textarea
                                        id="hours"
                                        rows={2}
                                        value={profile.hours}
                                        onChange={e =>
                                            setProfile(prev => ({
                                                ...prev,
                                                hours: e.target.value,
                                            }))
                                        }
                                        placeholder="Mon – Sun: 8:00 AM – 10:00 PM"
                                        className="rounded-xl text-xs"
                                    />
                                    <p className="text-[11px] text-slate-gray">
                                        Format like: &ldquo;Mon – Fri|8:00 –
                                        22:00&rdquo; or standard text.
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-hairline">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Social Media Links
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            value={profile.instagram}
                                            onChange={e =>
                                                setProfile(prev => ({
                                                    ...prev,
                                                    instagram: e.target.value,
                                                }))
                                            }
                                            placeholder="Instagram URL"
                                            className="rounded-xl text-xs"
                                        />
                                        <Input
                                            value={profile.telegram}
                                            onChange={e =>
                                                setProfile(prev => ({
                                                    ...prev,
                                                    telegram: e.target.value,
                                                }))
                                            }
                                            placeholder="Telegram channel/user"
                                            className="rounded-xl text-xs"
                                        />
                                        <Input
                                            value={profile.facebook}
                                            onChange={e =>
                                                setProfile(prev => ({
                                                    ...prev,
                                                    facebook: e.target.value,
                                                }))
                                            }
                                            placeholder="Facebook page URL"
                                            className="rounded-xl text-xs"
                                        />
                                        <Input
                                            value={profile.tiktok}
                                            onChange={e =>
                                                setProfile(prev => ({
                                                    ...prev,
                                                    tiktok: e.target.value,
                                                }))
                                            }
                                            placeholder="TikTok profile URL"
                                            className="rounded-xl text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: SECTIONS TOGGLES ("Can be in website or not") */}
                        {activeTab === "sections" && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-semibold text-foreground">
                                        Page Section Controls
                                    </h3>
                                    <p className="text-[11px] text-slate-gray mt-0.5">
                                        Toggle sections on or off to choose what
                                        appears on your website.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {[
                                        {
                                            key: "showHero",
                                            title: "Hero Banner",
                                            desc: "Welcome headline, primary CTA and background image",
                                        },
                                        {
                                            key: "showMenu",
                                            title: "Menu Catalog",
                                            desc: "Live food & drinks dishes, categories and search bar",
                                        },
                                        {
                                            key: "showFeatures",
                                            title: "Features & Amenities",
                                            desc: "Highlights like Fresh Daily, Fast Service, Wi-Fi, etc.",
                                        },
                                        {
                                            key: "showAbout",
                                            title: "About / Restaurant Story",
                                            desc: "Your culinary background, chef story and hospitality stats",
                                        },
                                        {
                                            key: "showGallery",
                                            title: "Photo Gallery & Carousel",
                                            desc: "Showcase signature dishes and restaurant atmosphere",
                                        },
                                        {
                                            key: "showTestimonials",
                                            title: "Customer Testimonials",
                                            desc: "Guest reviews and social proof quotes",
                                        },
                                        {
                                            key: "showHours",
                                            title: "Operating Hours",
                                            desc: "Opening times and service schedule table",
                                        },
                                        {
                                            key: "showCtaBanner",
                                            title: "Special Offer / Promo Banner",
                                            desc: "Call-to-action banner for table reservations or ordering",
                                        },
                                        {
                                            key: "showContact",
                                            title: "Contact & Location Card",
                                            desc: "Address, phone number and map directions",
                                        },
                                        {
                                            key: "showFooter",
                                            title: "Footer & Social Icons",
                                            desc: "Copyright note and social media links",
                                        },
                                    ].map(item => {
                                        const key =
                                            item.key as keyof SectionVisibility;
                                        const isChecked =
                                            sections[key] !== false;
                                        return (
                                            <div
                                                key={item.key}
                                                className="flex items-center justify-between rounded-xl border border-hairline bg-card p-3 hover:border-slate-gray/30 transition-colors"
                                            >
                                                <div className="space-y-0.5 pr-2">
                                                    <p className="text-xs font-semibold text-foreground">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[11px] text-slate-gray leading-tight">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={isChecked}
                                                    onClick={() =>
                                                        setSections(prev => ({
                                                            ...prev,
                                                            [key]: !isChecked,
                                                        }))
                                                    }
                                                    className={cn(
                                                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none",
                                                        isChecked
                                                            ? "bg-brand"
                                                            : "bg-slate-300 dark:bg-slate-700",
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5",
                                                            isChecked
                                                                ? "translate-x-4 ml-0.5"
                                                                : "translate-x-0.5",
                                                        )}
                                                    />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: THEME, COLORS & BRANDING */}
                        {activeTab === "theme" && (
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-xs font-semibold text-foreground">
                                        Color Palette Presets
                                    </h3>
                                    <p className="text-[11px] text-slate-gray mt-0.5">
                                        Curated restaurant palettes with high
                                        contrast.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {COLOR_SCHEMES.map(scheme => {
                                        const isSelected =
                                            theme.primaryColor ===
                                            scheme.primary;
                                        return (
                                            <button
                                                key={scheme.id}
                                                type="button"
                                                onClick={() =>
                                                    setTheme(prev => ({
                                                        ...prev,
                                                        primaryColor:
                                                            scheme.primary,
                                                        textColor: scheme.text,
                                                        backgroundColor:
                                                            scheme.bg,
                                                    }))
                                                }
                                                className={cn(
                                                    "group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all p-2 gap-1.5 cursor-pointer",
                                                    isSelected
                                                        ? "border-brand ring-1 ring-brand/30 bg-surface-ivory/50 dark:bg-card/80"
                                                        : "border-hairline hover:border-slate-gray/40 bg-card",
                                                )}
                                            >
                                                <div
                                                    className="h-6 w-full rounded-lg shadow-inner"
                                                    style={{
                                                        background:
                                                            scheme.preview,
                                                    }}
                                                />
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-foreground">
                                                        {scheme.name}
                                                    </span>
                                                    {isSelected ? (
                                                        <Check className="size-3.5 text-brand" />
                                                    ) : null}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-hairline">
                                    <Label className="text-xs font-semibold">
                                        Custom Primary Brand Color
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={
                                                theme.primaryColor || "#FDB913"
                                            }
                                            onChange={e =>
                                                setTheme(prev => ({
                                                    ...prev,
                                                    primaryColor:
                                                        e.target.value,
                                                }))
                                            }
                                            className="size-8 cursor-pointer rounded-lg border border-hairline p-0.5"
                                        />
                                        <Input
                                            value={
                                                theme.primaryColor || "#FDB913"
                                            }
                                            onChange={e =>
                                                setTheme(prev => ({
                                                    ...prev,
                                                    primaryColor:
                                                        e.target.value,
                                                }))
                                            }
                                            className="rounded-xl text-xs font-mono uppercase"
                                            placeholder="#FDB913"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-hairline">
                                    <Label className="text-xs font-semibold flex items-center gap-1">
                                        <Type className="size-3 text-slate-gray" />
                                        Typography Pairing
                                    </Label>
                                    <div className="space-y-1.5">
                                        {FONT_PRESETS.map(preset => {
                                            const isSelected =
                                                theme.fontDisplay ===
                                                preset.display;
                                            return (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setTheme(prev => ({
                                                            ...prev,
                                                            fontDisplay:
                                                                preset.display,
                                                            fontBody:
                                                                preset.body,
                                                        }))
                                                    }
                                                    className={cn(
                                                        "w-full flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-colors cursor-pointer",
                                                        isSelected
                                                            ? "border-brand bg-brand/5 text-brand font-semibold"
                                                            : "border-hairline hover:border-slate-gray/40 text-foreground",
                                                    )}
                                                >
                                                    <span
                                                        style={{
                                                            fontFamily:
                                                                preset.display,
                                                        }}
                                                    >
                                                        {preset.name}
                                                    </span>
                                                    {isSelected ? (
                                                        <Check className="size-3.5 text-brand" />
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-hairline">
                                    <Label className="text-xs font-semibold">
                                        Hero Banner Background Image URL
                                    </Label>
                                    <Input
                                        value={heroImageUrl}
                                        onChange={e =>
                                            setHeroImageUrl(e.target.value)
                                        }
                                        placeholder="https://images.unsplash.com/photo-..."
                                        className="rounded-xl text-xs"
                                    />
                                    <p className="text-[11px] text-slate-gray">
                                        Paste a high-resolution food or
                                        restaurant interior image URL.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right Area: Live Responsive Interactive Preview */}
                <main className="flex-1 bg-slate-100 dark:bg-zinc-900/50 flex flex-col overflow-hidden">
                    {/* Viewport Info Bar */}
                    <div className="flex h-9 shrink-0 items-center justify-between border-b border-hairline bg-card/60 px-4 text-[11px] text-slate-gray">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Live Interactive Preview</span>
                            <span>·</span>
                            <span className="capitalize">
                                {devicePreview} View
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>{menuItems.length} menu dishes synced</span>
                        </div>
                    </div>

                    {/* Preview Screen Canvas Container */}
                    <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start">
                        <div
                            data-viewport={devicePreview}
                            className={cn(
                                "transition-all duration-300 bg-white shadow-2xl overflow-hidden @container",
                                devicePreview === "desktop" &&
                                    "w-full max-w-6xl rounded-2xl border border-hairline",
                                devicePreview === "tablet" &&
                                    "w-[768px] max-w-full rounded-2xl border-4 border-slate-700 shadow-xl my-3",
                                devicePreview === "mobile" &&
                                    "w-[390px] max-w-full rounded-[44px] border-[10px] border-slate-900 shadow-2xl my-3",
                            )}
                            style={{
                                minHeight:
                                    devicePreview === "desktop"
                                        ? "100%"
                                        : "844px",
                            }}
                        >
                            {/* Device Notch simulation for mobile */}
                            {devicePreview === "mobile" ? (
                                <div className="h-6 w-full bg-slate-900 flex justify-center items-center">
                                    <div className="h-3.5 w-24 rounded-full bg-black/60" />
                                </div>
                            ) : null}

                            {/* Rendered Live Site */}
                            <SiteFontLoader />
                            <SiteRenderContext.Provider value={renderContext}>
                                <div
                                    style={
                                        {
                                            "--site-font-display":
                                                theme.fontDisplay ||
                                                "Inter, system-ui, sans-serif",
                                            "--site-font-body":
                                                theme.fontBody ||
                                                "Inter, system-ui, sans-serif",
                                            color: theme.textColor,
                                            background:
                                                theme.backgroundColor ||
                                                "#ffffff",
                                            minHeight: "100%",
                                        } as React.CSSProperties
                                    }
                                >
                                    <Render
                                        config={sitePuckConfig}
                                        data={liveDraftData}
                                    />
                                </div>
                            </SiteRenderContext.Provider>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
