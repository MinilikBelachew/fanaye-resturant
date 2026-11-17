"use client";

import { useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import {
    ArrowLeft,
    Building2,
    ExternalLink,
    Layers,
    Maximize2,
    Minimize2,
    Monitor,
    Palette,
    Rocket,
    RotateCcw,
    Save,
    Smartphone,
    Tablet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PublicMenuItem, TenantProfile } from "@/context/services/siteApi";
import { ImageUploadField } from "@/domains/site/puck/ImageUploadField";
import SiteTemplateRenderer from "@/domains/site/templates/SiteTemplateRenderer";
import {
    getTemplate,
    type MenuLayoutMode,
    type PerTemplateConfig,
    type SectionVisibility,
    type TemplateCustomCopy,
    type WebsiteTemplateId,
} from "@/domains/site/templates/restaurantTemplates";

export interface CustomizationData {
    config: PerTemplateConfig;
    profile: TenantProfile;
}

interface TemplateCustomizerProps {
    templateId: WebsiteTemplateId;
    slug?: string | null;
    tenantName: string;
    branchName?: string | null;
    branchData?: {
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        city?: string | null;
        managerName?: string | null;
    } | null;
    initialConfig: PerTemplateConfig;
    initialProfile?: TenantProfile | null;
    menuItems?: PublicMenuItem[];
    publicUrl?: string | null;
    isPublished?: boolean;
    busy?: boolean;
    publishing?: boolean;
    onSave: (data: CustomizationData) => Promise<void>;
    onPublish: (data: CustomizationData) => Promise<void>;
    onBack: () => void;
}

const SECTION_LABELS: Array<{ key: keyof SectionVisibility; label: string }> = [
    { key: "hero", label: "Hero Banner" },
    { key: "marquee", label: "Marquee Ticker Strip" },
    { key: "spotlight", label: "Featured / Counter Highlight" },
    { key: "menu", label: "Live Restaurant Menu" },
    { key: "story", label: "Story / About Section" },
    { key: "whyChoose", label: "Why Choose / Craft Cards" },
    { key: "stats", label: "Stats & Numbers Banner" },
    { key: "timeline", label: "Day Timeline & Transition" },
    { key: "gallery", label: "Photo Gallery / The Room" },
    { key: "reviews", label: "Approved Guest Ratings" },
    { key: "hours", label: "Opening Hours Block" },
    { key: "contact", label: "Contact & Footer" },
];

export default function TemplateCustomizer({
    templateId,
    slug,
    tenantName,
    branchName,
    branchData,
    initialConfig,
    initialProfile,
    menuItems = [],
    publicUrl,
    isPublished,
    busy,
    publishing,
    onSave,
    onPublish,
    onBack,
}: TemplateCustomizerProps) {
    const templateMeta = getTemplate(templateId);

    const [activeTab, setActiveTab] = useState<"template" | "business">(
        "template",
    );
    const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
        "desktop",
    );
    const [isFullPreview, setIsFullPreview] = useState(false);

    const [config, setConfig] = useState<PerTemplateConfig>({
        ...initialConfig,
        managerName: initialConfig.managerName || branchData?.managerName || "",
    });
    const [profile, setProfile] = useState<TenantProfile>({
        tagline: initialProfile?.tagline ?? "",
        story: initialProfile?.story ?? "",
        phone: initialProfile?.phone ?? branchData?.phone ?? "",
        email: initialProfile?.email ?? branchData?.email ?? "",
        address: initialProfile?.address ?? branchData?.address ?? "",
        city: initialProfile?.city ?? branchData?.city ?? "",
        hours: initialProfile?.hours ?? "Mon – Sun · 8:00 AM – 10:00 PM",
        instagram: initialProfile?.instagram ?? "",
        facebook: initialProfile?.facebook ?? "",
        tiktok: initialProfile?.tiktok ?? "",
        telegram: initialProfile?.telegram ?? "",
    });

    const displayName = tenantName;

    const handleResetTemplate = () => {
        setConfig(templateMeta.defaultConfig);
    };

    const customCopy: TemplateCustomCopy = config.customCopy ?? {};
    const updateCustomCopy = (patch: Partial<TemplateCustomCopy>) => {
        setConfig(prev => ({
            ...prev,
            customCopy: {
                ...(prev.customCopy ?? {}),
                ...patch,
            },
        }));
    };

    return (
        <div className="flex h-[calc(100svh-4.5rem)] flex-col bg-background overflow-hidden">
            {/* Top Toolbar */}
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5 shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="gap-1.5 rounded-xl"
                    >
                        <ArrowLeft className="size-4" />
                        <span>5 Websites</span>
                    </Button>
                    <div className="h-5 w-px bg-border" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-bold text-foreground">
                                {templateMeta.name}
                            </h1>
                            {isPublished ? (
                                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    Live
                                </span>
                            ) : (
                                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    Draft
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Customizing {templateMeta.name} separately
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Responsive switcher */}
                    <div className="hidden md:flex items-center rounded-xl border border-border bg-background p-0.5 mr-2">
                        {(
                            [
                                { id: "desktop", icon: Monitor },
                                { id: "tablet", icon: Tablet },
                                { id: "mobile", icon: Smartphone },
                            ] as const
                        ).map(({ id, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setViewport(id)}
                                className={cn(
                                    "rounded-lg p-1.5 transition",
                                    viewport === id
                                        ? "bg-secondary text-foreground"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                                title={id}
                            >
                                <Icon className="size-4" />
                            </button>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullPreview(v => !v)}
                        className="rounded-xl gap-1.5 text-xs"
                    >
                        {isFullPreview ? (
                            <>
                                <Minimize2 className="size-3.5" />
                                <span>Show Editor</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="size-3.5" />
                                <span className="hidden sm:inline">
                                    Full Preview
                                </span>
                            </>
                        )}
                    </Button>

                    {publicUrl && isPublished ? (
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                        >
                            <span>View Live</span>
                            <ExternalLink className="size-3.5" />
                        </a>
                    ) : null}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy || publishing}
                        onClick={() => void onSave({ config, profile })}
                        className="rounded-xl gap-1.5 text-xs"
                    >
                        {busy ? (
                            <RestorchSpinner className="size-3.5" />
                        ) : (
                            <Save className="size-3.5" />
                        )}
                        <span>Save Draft</span>
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        disabled={busy || publishing}
                        onClick={() => void onPublish({ config, profile })}
                        className="rounded-xl gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {publishing ? (
                            <RestorchSpinner className="size-3.5" />
                        ) : (
                            <Rocket className="size-3.5" />
                        )}
                        <span>Publish</span>
                    </Button>
                </div>
            </header>

            {/* Studio Body */}
            <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
                {/* Left Sidebar Controls */}
                {!isFullPreview ? (
                    <aside className="w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card flex flex-col min-h-0">
                        {/* Tabs */}
                        <div className="grid grid-cols-2 border-b border-border p-1.5 gap-1 bg-muted/30">
                            <button
                                type="button"
                                onClick={() => setActiveTab("template")}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition",
                                    activeTab === "template"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                <Palette className="size-3.5" />
                                <span>This Website</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("business")}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition",
                                    activeTab === "business"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                <Building2 className="size-3.5" />
                                <span>Restaurant Info</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-5">
                            {activeTab === "template" ? (
                                <>
                                    {/* Accent Color */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold">
                                                Accent Color
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={handleResetTemplate}
                                                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                                            >
                                                <RotateCcw className="size-3" />
                                                <span>Reset defaults</span>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {templateMeta.accentPresets.map(
                                                hex => (
                                                    <button
                                                        key={hex}
                                                        type="button"
                                                        onClick={() =>
                                                            setConfig(prev => ({
                                                                ...prev,
                                                                accentColor:
                                                                    hex,
                                                            }))
                                                        }
                                                        className={cn(
                                                            "size-7 rounded-full border-2 transition",
                                                            config.accentColor ===
                                                                hex
                                                                ? "border-foreground scale-110"
                                                                : "border-transparent",
                                                        )}
                                                        style={{
                                                            backgroundColor:
                                                                hex,
                                                        }}
                                                    />
                                                ),
                                            )}
                                            <input
                                                type="color"
                                                value={config.accentColor}
                                                onChange={e =>
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        accentColor:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Hero Texts & Image */}
                                    <div className="space-y-3 pt-2 border-t border-border">
                                        <div>
                                            <Label className="text-xs">
                                                Badge Text
                                            </Label>
                                            <Input
                                                value={config.badgeText}
                                                onChange={e =>
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        badgeText:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="mt-1 h-8 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">
                                                Hero Headline
                                            </Label>
                                            <Input
                                                value={config.heroHeadline}
                                                onChange={e =>
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        heroHeadline:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="mt-1 h-8 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">
                                                Hero Subheadline
                                            </Label>
                                            <Textarea
                                                rows={2}
                                                value={config.heroSubheadline}
                                                onChange={e =>
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        heroSubheadline:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="mt-1 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">
                                                Button Label
                                            </Label>
                                            <Input
                                                value={config.ctaLabel}
                                                onChange={e =>
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        ctaLabel:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="mt-1 h-8 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <ImageUploadField
                                                label="Hero Photo (Placeholder — upload or paste URL)"
                                                value={config.heroImageUrl}
                                                onChange={url =>
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        heroImageUrl:
                                                            url ||
                                                            templateMeta
                                                                .defaultConfig
                                                                .heroImageUrl,
                                                    }))
                                                }
                                            />
                                            <Input
                                                value={config.heroImageUrl}
                                                onChange={e =>
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        heroImageUrl:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="Or paste image URL"
                                                className="mt-2 h-8 text-xs font-mono"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">
                                                Branch Manager Name
                                            </Label>
                                            <Input
                                                value={config.managerName ?? ""}
                                                onChange={e =>
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        managerName:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder={
                                                    branchData?.managerName ||
                                                    "Branch Manager"
                                                }
                                                className="mt-1 h-8 text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Spotlight */}
                                    <div className="space-y-3 pt-2 border-t border-border">
                                        <div>
                                            <Label className="text-xs">
                                                Highlight Title
                                            </Label>
                                            <Input
                                                value={config.spotlightTitle}
                                                onChange={e =>
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        spotlightTitle:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="mt-1 h-8 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">
                                                Highlight Note
                                            </Label>
                                            <Textarea
                                                rows={2}
                                                value={config.spotlightNote}
                                                onChange={e =>
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        spotlightNote:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="mt-1 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-3 pt-2 border-t border-border">
                                            <Label className="text-xs font-semibold">
                                                Atmosphere Gallery Photos
                                            </Label>
                                            {[0, 1, 2].map(idx => (
                                                <div
                                                    key={idx}
                                                    className="rounded-xl border border-border p-2.5 space-y-2"
                                                >
                                                    <ImageUploadField
                                                        label={`Gallery Photo ${idx + 1}`}
                                                        value={
                                                            config
                                                                .galleryImages[
                                                                idx
                                                            ] ?? ""
                                                        }
                                                        onChange={url =>
                                                            setConfig(prev => {
                                                                const next = [
                                                                    ...prev.galleryImages,
                                                                ];
                                                                next[idx] = url;
                                                                return {
                                                                    ...prev,
                                                                    galleryImages:
                                                                        next,
                                                                };
                                                            })
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Menu Layout Style */}
                                    <div className="space-y-2 pt-2 border-t border-border">
                                        <Label className="text-xs font-semibold">
                                            Menu Display Style
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(
                                                [
                                                    {
                                                        id: "cards",
                                                        label: "Photo Cards",
                                                    },
                                                    {
                                                        id: "editorial",
                                                        label: "2-Column List",
                                                    },
                                                    {
                                                        id: "grouped",
                                                        label: "By Category",
                                                    },
                                                    {
                                                        id: "showcase",
                                                        label: "Showcase",
                                                    },
                                                ] as Array<{
                                                    id: MenuLayoutMode;
                                                    label: string;
                                                }>
                                            ).map(opt => {
                                                const active =
                                                    (config.menuLayout ??
                                                        "cards") === opt.id;
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setConfig(prev => ({
                                                                ...prev,
                                                                menuLayout:
                                                                    opt.id,
                                                            }))
                                                        }
                                                        className={cn(
                                                            "rounded-xl border px-3 py-2 text-xs font-semibold text-left transition",
                                                            active
                                                                ? "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300"
                                                                : "border-border bg-background text-muted-foreground hover:text-foreground",
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Section Toggles */}
                                    <div className="space-y-2 pt-2 border-t border-border">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <Layers className="size-3.5" />
                                            <span>Visible Sections</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {SECTION_LABELS.map(
                                                ({ key, label }) => (
                                                    <label
                                                        key={key}
                                                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs cursor-pointer hover:bg-muted/40"
                                                    >
                                                        <span>{label}</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                config.sections[
                                                                    key
                                                                ] !== false
                                                            }
                                                            onChange={e =>
                                                                setConfig(
                                                                    prev => ({
                                                                        ...prev,
                                                                        sections:
                                                                            {
                                                                                ...prev.sections,
                                                                                [key]: e
                                                                                    .target
                                                                                    .checked,
                                                                            },
                                                                    }),
                                                                )
                                                            }
                                                            className="size-4 accent-orange-600"
                                                        />
                                                    </label>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    {/* All Section Texts & Copy */}
                                    <div className="space-y-3 pt-3 border-t border-border">
                                        <Label className="text-xs font-semibold">
                                            All Section Texts &amp; Labels
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground">
                                            Leave any field blank to use the
                                            template default.
                                        </p>

                                        <div className="grid grid-cols-1 gap-2.5">
                                            {(
                                                [
                                                    [
                                                        "aboutEyebrow",
                                                        "About Eyebrow",
                                                        "e.g. About / (01) THE ROASTERY",
                                                    ],
                                                    [
                                                        "aboutTitle",
                                                        "About Heading",
                                                        "e.g. Every Celebration Remarkable",
                                                    ],
                                                    [
                                                        "whyChooseEyebrow",
                                                        "Why Choose / Craft Eyebrow",
                                                        "e.g. Why Choose Us?",
                                                    ],
                                                    [
                                                        "whyChooseTitle",
                                                        "Why Choose / Craft Heading",
                                                        "e.g. More Than Dining...",
                                                    ],
                                                    [
                                                        "menuEyebrow",
                                                        "Menu Eyebrow",
                                                        "e.g. Explore Menu Option",
                                                    ],
                                                    [
                                                        "menuTitle",
                                                        "Menu Heading",
                                                        "e.g. Signature Kitchen Menus",
                                                    ],
                                                    [
                                                        "timelineEyebrow",
                                                        "Timeline Eyebrow",
                                                        "e.g. (03) A DAY AT...",
                                                    ],
                                                    [
                                                        "timelineTitle",
                                                        "Timeline Heading",
                                                        "e.g. From the oven to the last espresso.",
                                                    ],
                                                    [
                                                        "transitionTop",
                                                        "Transition Line 1",
                                                        "e.g. Roast first.",
                                                    ],
                                                    [
                                                        "transitionBottom",
                                                        "Transition Line 2",
                                                        "e.g. Sweet later.",
                                                    ],
                                                    [
                                                        "craftEyebrow",
                                                        "Craft Deck Eyebrow",
                                                        "e.g. (04) FROM THE OVEN & BAR",
                                                    ],
                                                    [
                                                        "craftTitle",
                                                        "Craft Deck Heading",
                                                        "e.g. Four ways we craft.",
                                                    ],
                                                    [
                                                        "counterTitle",
                                                        "Counter Feature Heading",
                                                        "e.g. The espresso bar.",
                                                    ],
                                                    [
                                                        "counterSubtitle",
                                                        "Counter Feature Subtitle",
                                                        "e.g. Ten counter seats facing the bar...",
                                                    ],
                                                    [
                                                        "galleryEyebrow",
                                                        "Gallery Eyebrow",
                                                        "e.g. (05) THE ROOM",
                                                    ],
                                                    [
                                                        "galleryTitle",
                                                        "Gallery Heading",
                                                        "e.g. One oven. Warm mornings.",
                                                    ],
                                                    [
                                                        "reviewsEyebrow",
                                                        "Reviews Eyebrow",
                                                        "e.g. Testimonial / GUEST NOTES",
                                                    ],
                                                    [
                                                        "reviewsTitle",
                                                        "Reviews Heading",
                                                        "e.g. What Our Guests Are Saying",
                                                    ],
                                                    [
                                                        "hoursEyebrow",
                                                        "Hours Eyebrow",
                                                        "e.g. Service Hours / (06) TODAY",
                                                    ],
                                                    [
                                                        "hoursTitle",
                                                        "Hours Heading",
                                                        "e.g. Pull up a chair by the bar.",
                                                    ],
                                                ] as Array<
                                                    [
                                                        keyof TemplateCustomCopy,
                                                        string,
                                                        string,
                                                    ]
                                                >
                                            ).map(
                                                ([
                                                    field,
                                                    label,
                                                    placeholder,
                                                ]) => (
                                                    <div key={field}>
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            {label}
                                                        </Label>
                                                        <Input
                                                            value={
                                                                (customCopy[
                                                                    field
                                                                ] as string) ??
                                                                ""
                                                            }
                                                            onChange={e =>
                                                                updateCustomCopy(
                                                                    {
                                                                        [field]:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                            placeholder={
                                                                placeholder
                                                            }
                                                            className="mt-1 h-8 text-xs"
                                                        />
                                                    </div>
                                                ),
                                            )}

                                            <div>
                                                <Label className="text-[11px] text-muted-foreground">
                                                    Marquee Phrases (one per
                                                    line)
                                                </Label>
                                                <Textarea
                                                    rows={3}
                                                    value={(
                                                        customCopy.marqueeItems ??
                                                        []
                                                    ).join("\n")}
                                                    onChange={e => {
                                                        const lines =
                                                            e.target.value
                                                                .split("\n")
                                                                .map(l =>
                                                                    l.trim(),
                                                                )
                                                                .filter(
                                                                    Boolean,
                                                                );
                                                        updateCustomCopy({
                                                            marqueeItems: lines,
                                                        });
                                                    }}
                                                    placeholder={
                                                        "Single-origin pour-overs\nArtisan croissants & sourdough"
                                                    }
                                                    className="mt-1 text-xs"
                                                />
                                            </div>

                                            <div className="space-y-2 pt-1">
                                                <Label className="text-[11px] text-muted-foreground">
                                                    Stats (Number &amp; Label)
                                                </Label>
                                                {[0, 1, 2, 3].map(idx => {
                                                    const cur = customCopy
                                                        .stats?.[idx] ?? {
                                                        num: "",
                                                        label: "",
                                                    };
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="grid grid-cols-5 gap-1.5"
                                                        >
                                                            <Input
                                                                value={cur.num}
                                                                onChange={e => {
                                                                    const base =
                                                                        customCopy.stats ?? [
                                                                            {
                                                                                num: "",
                                                                                label: "",
                                                                            },
                                                                            {
                                                                                num: "",
                                                                                label: "",
                                                                            },
                                                                            {
                                                                                num: "",
                                                                                label: "",
                                                                            },
                                                                            {
                                                                                num: "",
                                                                                label: "",
                                                                            },
                                                                        ];
                                                                    const next =
                                                                        [
                                                                            ...base,
                                                                        ];
                                                                    next[idx] =
                                                                        {
                                                                            ...cur,
                                                                            num: e
                                                                                .target
                                                                                .value,
                                                                        };
                                                                    updateCustomCopy(
                                                                        {
                                                                            stats: next,
                                                                        },
                                                                    );
                                                                }}
                                                                placeholder={`#${idx + 1}`}
                                                                className="col-span-2 h-8 text-xs"
                                                            />
                                                            <Input
                                                                value={
                                                                    cur.label
                                                                }
                                                                onChange={e => {
                                                                    const base =
                                                                        customCopy.stats ?? [
                                                                            {
                                                                                num: "",
                                                                                label: "",
                                                                            },
                                                                            {
                                                                                num: "",
                                                                                label: "",
                                                                            },
                                                                            {
                                                                                num: "",
                                                                                label: "",
                                                                            },
                                                                            {
                                                                                num: "",
                                                                                label: "",
                                                                            },
                                                                        ];
                                                                    const next =
                                                                        [
                                                                            ...base,
                                                                        ];
                                                                    next[idx] =
                                                                        {
                                                                            ...cur,
                                                                            label: e
                                                                                .target
                                                                                .value,
                                                                        };
                                                                    updateCustomCopy(
                                                                        {
                                                                            stats: next,
                                                                        },
                                                                    );
                                                                }}
                                                                placeholder="Stat label"
                                                                className="col-span-3 h-8 text-xs"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="space-y-2 pt-1">
                                                <Label className="text-[11px] text-muted-foreground">
                                                    Why Choose / Craft Cards
                                                    (Title &amp; Description)
                                                </Label>
                                                {[0, 1, 2, 3].map(idx => {
                                                    const cur = customCopy
                                                        .highlights?.[idx] ?? {
                                                        title: "",
                                                        desc: "",
                                                        tag: "",
                                                    };
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="rounded-lg border border-border p-2 space-y-1.5"
                                                        >
                                                            <Input
                                                                value={
                                                                    cur.title
                                                                }
                                                                onChange={e => {
                                                                    const base =
                                                                        customCopy.highlights ?? [
                                                                            {
                                                                                title: "",
                                                                                desc: "",
                                                                                tag: "",
                                                                            },
                                                                            {
                                                                                title: "",
                                                                                desc: "",
                                                                                tag: "",
                                                                            },
                                                                            {
                                                                                title: "",
                                                                                desc: "",
                                                                                tag: "",
                                                                            },
                                                                            {
                                                                                title: "",
                                                                                desc: "",
                                                                                tag: "",
                                                                            },
                                                                        ];
                                                                    const next =
                                                                        [
                                                                            ...base,
                                                                        ];
                                                                    next[idx] =
                                                                        {
                                                                            ...cur,
                                                                            title: e
                                                                                .target
                                                                                .value,
                                                                        };
                                                                    updateCustomCopy(
                                                                        {
                                                                            highlights:
                                                                                next,
                                                                        },
                                                                    );
                                                                }}
                                                                placeholder={`Card ${idx + 1} title`}
                                                                className="h-7 text-xs"
                                                            />
                                                            <Input
                                                                value={cur.desc}
                                                                onChange={e => {
                                                                    const base =
                                                                        customCopy.highlights ?? [
                                                                            {
                                                                                title: "",
                                                                                desc: "",
                                                                                tag: "",
                                                                            },
                                                                            {
                                                                                title: "",
                                                                                desc: "",
                                                                                tag: "",
                                                                            },
                                                                            {
                                                                                title: "",
                                                                                desc: "",
                                                                                tag: "",
                                                                            },
                                                                            {
                                                                                title: "",
                                                                                desc: "",
                                                                                tag: "",
                                                                            },
                                                                        ];
                                                                    const next =
                                                                        [
                                                                            ...base,
                                                                        ];
                                                                    next[idx] =
                                                                        {
                                                                            ...cur,
                                                                            desc: e
                                                                                .target
                                                                                .value,
                                                                        };
                                                                    updateCustomCopy(
                                                                        {
                                                                            highlights:
                                                                                next,
                                                                        },
                                                                    );
                                                                }}
                                                                placeholder={`Card ${idx + 1} description`}
                                                                className="h-7 text-xs"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Shared Business / Restaurant Info */
                                <div className="space-y-3">
                                    <p className="text-[11px] text-muted-foreground">
                                        Shared across all 5 website designs so
                                        you only enter your contact info once.
                                    </p>
                                    <div>
                                        <Label className="text-xs">
                                            Short Tagline
                                        </Label>
                                        <Input
                                            value={profile.tagline ?? ""}
                                            onChange={e =>
                                                setProfile(p => ({
                                                    ...p,
                                                    tagline: e.target.value,
                                                }))
                                            }
                                            placeholder="Fresh Ethiopian & continental dining"
                                            className="mt-1 h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">
                                            Restaurant Story
                                        </Label>
                                        <Textarea
                                            rows={3}
                                            value={profile.story ?? ""}
                                            onChange={e =>
                                                setProfile(p => ({
                                                    ...p,
                                                    story: e.target.value,
                                                }))
                                            }
                                            className="mt-1 text-xs"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">
                                                Phone
                                            </Label>
                                            <Input
                                                value={profile.phone ?? ""}
                                                onChange={e =>
                                                    setProfile(p => ({
                                                        ...p,
                                                        phone: e.target.value,
                                                    }))
                                                }
                                                className="mt-1 h-8 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">
                                                Email
                                            </Label>
                                            <Input
                                                value={profile.email ?? ""}
                                                onChange={e =>
                                                    setProfile(p => ({
                                                        ...p,
                                                        email: e.target.value,
                                                    }))
                                                }
                                                className="mt-1 h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">
                                            Address
                                        </Label>
                                        <Input
                                            value={profile.address ?? ""}
                                            onChange={e =>
                                                setProfile(p => ({
                                                    ...p,
                                                    address: e.target.value,
                                                }))
                                            }
                                            className="mt-1 h-8 text-xs"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">
                                                City
                                            </Label>
                                            <Input
                                                value={profile.city ?? ""}
                                                onChange={e =>
                                                    setProfile(p => ({
                                                        ...p,
                                                        city: e.target.value,
                                                    }))
                                                }
                                                className="mt-1 h-8 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">
                                                Hours
                                            </Label>
                                            <Input
                                                value={profile.hours ?? ""}
                                                onChange={e =>
                                                    setProfile(p => ({
                                                        ...p,
                                                        hours: e.target.value,
                                                    }))
                                                }
                                                className="mt-1 h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-border space-y-2">
                                        <Label className="text-xs font-semibold">
                                            Social Links
                                        </Label>
                                        <Input
                                            placeholder="Instagram URL"
                                            value={profile.instagram ?? ""}
                                            onChange={e =>
                                                setProfile(p => ({
                                                    ...p,
                                                    instagram: e.target.value,
                                                }))
                                            }
                                            className="h-8 text-xs"
                                        />
                                        <Input
                                            placeholder="Telegram URL"
                                            value={profile.telegram ?? ""}
                                            onChange={e =>
                                                setProfile(p => ({
                                                    ...p,
                                                    telegram: e.target.value,
                                                }))
                                            }
                                            className="h-8 text-xs"
                                        />
                                        <Input
                                            placeholder="TikTok URL"
                                            value={profile.tiktok ?? ""}
                                            onChange={e =>
                                                setProfile(p => ({
                                                    ...p,
                                                    tiktok: e.target.value,
                                                }))
                                            }
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                ) : null}

                {/* Live Interactive Preview */}
                <main className="flex-1 overflow-y-auto bg-muted/40 p-2 sm:p-5 flex justify-center">
                    <div
                        className={cn(
                            "@container w-full overflow-hidden bg-background border border-border transition-all h-fit",
                            viewport === "mobile"
                                ? "max-w-[390px] rounded-[28px]"
                                : viewport === "tablet"
                                  ? "max-w-[768px] rounded-2xl"
                                  : "max-w-full rounded-2xl",
                        )}
                    >
                        <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3.5 py-2 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-rose-400/80" />
                                <span className="size-2.5 rounded-full bg-amber-400/80" />
                                <span className="size-2.5 rounded-full bg-emerald-400/80" />
                            </div>
                            <span className="font-mono truncate max-w-[220px] sm:max-w-sm">
                                /r/{slug || "preview"}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider">
                                {viewport}
                            </span>
                        </div>
                        <SiteTemplateRenderer
                            templateId={templateId}
                            slug={slug}
                            tenantName={displayName}
                            config={config}
                            profile={profile}
                            menuItems={menuItems}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}
