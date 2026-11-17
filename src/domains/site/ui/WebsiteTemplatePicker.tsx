"use client";

import { useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import {
    Check,
    Eye,
    Monitor,
    Pencil,
    Rocket,
    Smartphone,
    Sparkles,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicMenuItem, TenantProfile } from "@/context/services/siteApi";
import SiteTemplateRenderer from "@/domains/site/templates/SiteTemplateRenderer";
import {
    WEBSITE_TEMPLATES,
    resolveTemplateConfig,
    type WebsiteTemplateId,
    type WebsiteTemplateMeta,
} from "@/domains/site/templates/restaurantTemplates";

export default function WebsiteTemplatePicker({
    slug,
    tenantName,
    activeTemplateId,
    draftData,
    profile,
    menuItems = [],
    busy,
    onApply,
    onCancel,
}: {
    slug?: string | null;
    tenantName: string;
    activeTemplateId?: WebsiteTemplateId;
    draftData?: Record<string, unknown> | null;
    profile?: TenantProfile | null;
    menuItems?: PublicMenuItem[];
    busy?: boolean;
    onApply: (
        templateId: WebsiteTemplateId,
        action: "customize" | "publish",
    ) => void;
    onCancel?: () => void;
}) {
    const [selectedId, setSelectedId] = useState<WebsiteTemplateId>(
        activeTemplateId ?? "modern-bistro",
    );
    const [previewTemplate, setPreviewTemplate] =
        useState<WebsiteTemplateMeta | null>(null);
    const [previewViewport, setPreviewViewport] = useState<
        "desktop" | "mobile"
    >("desktop");

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                        <Sparkles className="size-3" />
                        <span>5 Curated Restaurant Websites</span>
                    </span>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                        Choose a Website for {tenantName}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Pick any of the 5 handcrafted designs below. Each
                        website saves its own customizations separately, while
                        your live menu and contact info stay synced.
                    </p>
                </div>

                {onCancel ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        className="self-start sm:self-auto rounded-full"
                    >
                        Back to Customizer
                    </Button>
                ) : null}
            </div>

            {/* 5 Website Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {WEBSITE_TEMPLATES.map(tpl => {
                    const isSelected = selectedId === tpl.id;
                    const isCurrent = activeTemplateId === tpl.id;
                    const cfg = resolveTemplateConfig(tpl.id, draftData);

                    return (
                        <div
                            key={tpl.id}
                            onClick={() => setSelectedId(tpl.id)}
                            className={cn(
                                "group cursor-pointer overflow-hidden rounded-2xl border bg-card transition-all duration-200 flex flex-col justify-between",
                                isSelected
                                    ? "border-orange-500 ring-2 ring-orange-500/30 shadow-lg"
                                    : "border-border hover:border-foreground/30 hover:shadow-md",
                            )}
                        >
                            <div>
                                {/* Visual Hero Thumbnail */}
                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-900">
                                    <img
                                        src={cfg.heroImageUrl}
                                        alt={tpl.name}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                                    <div className="absolute top-3 left-3 flex items-center gap-2">
                                        <span className="rounded-full bg-black/65 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white border border-white/15">
                                            {tpl.category}
                                        </span>
                                        {isCurrent ? (
                                            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                                                Active
                                            </span>
                                        ) : null}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={e => {
                                            e.stopPropagation();
                                            setPreviewTemplate(tpl);
                                        }}
                                        className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-stone-900 shadow-sm hover:bg-white"
                                    >
                                        <Eye className="size-3" />
                                        <span>Live Preview</span>
                                    </button>

                                    <div className="absolute bottom-3 left-3 right-3 text-white">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="size-2.5 rounded-full ring-2 ring-white/40"
                                                style={{
                                                    backgroundColor:
                                                        cfg.accentColor,
                                                }}
                                            />
                                            <h3 className="text-base font-bold leading-tight">
                                                {tpl.name}
                                            </h3>
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-white/80 line-clamp-1">
                                            {tpl.vibe}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 space-y-2">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {tpl.tagline}
                                    </p>
                                </div>
                            </div>

                            <div className="px-4 pb-4 pt-2 border-t border-border/60 flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    disabled={busy}
                                    onClick={e => {
                                        e.stopPropagation();
                                        onApply(tpl.id, "customize");
                                    }}
                                    className="flex-1 rounded-xl text-xs gap-1.5"
                                >
                                    {busy && isSelected ? (
                                        <RestorchSpinner className="size-3.5" />
                                    ) : (
                                        <Pencil className="size-3.5" />
                                    )}
                                    <span>Customize</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={busy}
                                    onClick={e => {
                                        e.stopPropagation();
                                        onApply(tpl.id, "publish");
                                    }}
                                    className="rounded-xl text-xs gap-1.5"
                                >
                                    <Rocket className="size-3.5" />
                                    <span>Publish</span>
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Full-screen Live Preview Modal */}
            {previewTemplate ? (
                <div className="fixed inset-0 z-50 flex flex-col bg-background">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">
                                {previewTemplate.name}
                            </span>
                            <span className="hidden sm:inline text-xs text-muted-foreground">
                                Previewing with {tenantName} & your live menu
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPreviewViewport("desktop")
                                    }
                                    className={cn(
                                        "rounded-md p-1.5 transition",
                                        previewViewport === "desktop"
                                            ? "bg-secondary text-foreground"
                                            : "text-muted-foreground",
                                    )}
                                    title="Desktop"
                                >
                                    <Monitor className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewViewport("mobile")}
                                    className={cn(
                                        "rounded-md p-1.5 transition",
                                        previewViewport === "mobile"
                                            ? "bg-secondary text-foreground"
                                            : "text-muted-foreground",
                                    )}
                                    title="Mobile"
                                >
                                    <Smartphone className="size-4" />
                                </button>
                            </div>

                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    const id = previewTemplate.id;
                                    setPreviewTemplate(null);
                                    onApply(id, "customize");
                                }}
                                className="rounded-xl gap-1.5"
                            >
                                <Check className="size-3.5" />
                                <span>Use This Website</span>
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setPreviewTemplate(null)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-muted/40 p-0 sm:p-6 flex justify-center">
                        <div
                            className={cn(
                                "@container w-full overflow-x-hidden bg-white transition-all",
                                previewViewport === "mobile"
                                    ? "max-w-[390px] rounded-3xl border border-border my-2"
                                    : "max-w-7xl rounded-2xl border border-border",
                            )}
                        >
                            <SiteTemplateRenderer
                                templateId={previewTemplate.id}
                                slug={slug}
                                tenantName={tenantName}
                                config={resolveTemplateConfig(
                                    previewTemplate.id,
                                    draftData,
                                )}
                                profile={profile}
                                menuItems={menuItems}
                            />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
