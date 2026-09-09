"use client";

import { useEffect, useMemo, useState } from "react";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { Loader2, ExternalLink, Globe2 } from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
            theme:
                theme ||
                site?.theme || {
                    primaryColor: "#e85d04",
                    accentColor: "#0f172a",
                    backgroundColor: "#fffaf5",
                    textColor: "#0f172a",
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
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <PageHeader
                    eyebrow="Business"
                    title="Website"
                    description="Arrange sections, set brand colors, then publish a public page."
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
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-[12px] font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
                    >
                        <Globe2 className="size-3.5" />
                        {publishing ? "Publishing…" : "Publish"}
                    </button>
                </div>
            </div>

            <div className="mb-4 grid gap-3 rounded-[16px] border border-hairline bg-card p-4 md:grid-cols-5">
                <label className="space-y-1 text-[12px]">
                    <span className="font-medium text-slate-gray">Public slug</span>
                    <Input
                        value={slug}
                        onChange={e => setSlug(e.target.value.toLowerCase())}
                        placeholder="abyssinia-grill"
                    />
                </label>
                <label className="space-y-1 text-[12px]">
                    <span className="font-medium text-slate-gray">Primary</span>
                    <Input
                        type="color"
                        value={theme.primaryColor}
                        onChange={e =>
                            setTheme({ ...theme, primaryColor: e.target.value })
                        }
                    />
                </label>
                <label className="space-y-1 text-[12px]">
                    <span className="font-medium text-slate-gray">Accent</span>
                    <Input
                        type="color"
                        value={theme.accentColor}
                        onChange={e =>
                            setTheme({ ...theme, accentColor: e.target.value })
                        }
                    />
                </label>
                <label className="space-y-1 text-[12px]">
                    <span className="font-medium text-slate-gray">Background</span>
                    <Input
                        type="color"
                        value={theme.backgroundColor}
                        onChange={e =>
                            setTheme({
                                ...theme,
                                backgroundColor: e.target.value,
                            })
                        }
                    />
                </label>
                <div>
                    <ImageUploadField
                        label="Logo"
                        value={theme.logoUrl || ""}
                        onChange={logoUrl =>
                            setTheme({ ...theme, logoUrl: logoUrl || null })
                        }
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-hairline bg-card">
                <SiteRenderContext.Provider value={renderContext}>
                    <div
                        style={
                            {
                                "--site-font-display":
                                    theme.fontDisplay || "Georgia, serif",
                                "--site-font-body":
                                    theme.fontBody || "system-ui, sans-serif",
                                color: theme.textColor,
                                background: theme.backgroundColor,
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
