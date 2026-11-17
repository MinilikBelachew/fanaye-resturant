"use client";

import { useEffect, useMemo, useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { toast } from "@/lib/toast";
import { useAppSelector } from "@/context/hooks";
import {
    useGetTenantSiteQuery,
    usePublishTenantSiteMutation,
    useUpdateTenantSiteMutation,
    type PublicMenuItem,
    type SiteTheme,
} from "@/context/services/siteApi";
import { useListBranchesQuery } from "@/context/services/branchesApi";
import { useAdminMenuItemsQuery } from "@/context/services/menuApi";
import { adminMenuItemToCatalog } from "@/domains/catalog/application/mapAdminMenu";
import WebsiteTemplatePicker from "@/domains/site/ui/WebsiteTemplatePicker";
import TemplateCustomizer, {
    type CustomizationData,
} from "@/domains/site/ui/TemplateCustomizer";
import {
    buildSiteDataPayload,
    getTemplate,
    normalizeTemplateId,
    resolveTemplateConfig,
    type WebsiteTemplateId,
} from "@/domains/site/templates/restaurantTemplates";

type ViewMode = "picker" | "customizer";

export default function WebsiteStudioPage() {
    const session = useAppSelector(state => state.identity.session);
    const { data, isLoading, error, refetch } = useGetTenantSiteQuery();
    const { data: branchesRes } = useListBranchesQuery();
    const { data: menuData } = useAdminMenuItemsQuery();

    const [updateSite, { isLoading: saving }] = useUpdateTenantSiteMutation();
    const [publishSite, { isLoading: publishing }] =
        usePublishTenantSiteMutation();

    const site = data?.data;

    const activeBranch = useMemo(() => {
        const list = branchesRes?.data || [];
        if (session?.branchId) {
            const match = list.find(b => b.id === session.branchId);
            if (match) return match;
        }
        return list[0] || null;
    }, [branchesRes?.data, session?.branchId]);

    const branchName = session?.branchName || activeBranch?.name || null;

    const branchData = useMemo(
        () => ({
            phone: activeBranch?.manager?.phone || session?.phone || null,
            email: activeBranch?.manager?.email || session?.email || null,
            address: site?.profile?.address || null,
            city: site?.profile?.city || null,
            managerName: activeBranch?.manager?.name || null,
        }),
        [activeBranch, session, site?.profile],
    );

    const [viewMode, setViewMode] = useState<ViewMode>("picker");
    const [selectedTemplateId, setSelectedTemplateId] =
        useState<WebsiteTemplateId>("modern-bistro");
    const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

    useEffect(() => {
        if (!site || hasLoadedDraft) return;
        const draftMeta = site.draftData as Record<string, unknown> | null;
        if (draftMeta?.templateId) {
            setSelectedTemplateId(normalizeTemplateId(draftMeta.templateId));
            setViewMode("customizer");
        }
        setHasLoadedDraft(true);
    }, [site, hasLoadedDraft]);

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

    const effectiveTenantName = site?.tenantName || "Restaurant";

    async function handleApplyTemplate(
        tplId: WebsiteTemplateId,
        action: "customize" | "publish",
    ) {
        if (!site) return;
        setSelectedTemplateId(tplId);
        const template = getTemplate(tplId);
        const config = resolveTemplateConfig(tplId, site.draftData, site.theme);

        const nextDraft = buildSiteDataPayload({
            templateId: tplId,
            config,
            existingData: site.draftData,
        });

        const mergedTheme: Partial<SiteTheme> = {
            ...site.theme,
            ...template.defaultTheme,
            accentColor: config.accentColor,
        };

        try {
            await updateSite({
                theme: mergedTheme,
                draftData: nextDraft,
            }).unwrap();

            if (action === "publish") {
                await publishSite().unwrap();
                toast.success(`${template.name} is now live!`);
            } else {
                toast.success(`Loaded ${template.name} for customization.`);
            }
            setViewMode("customizer");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Could not apply template.";
            toast.error(message);
        }
    }

    async function handleSaveCustomization(customData: CustomizationData) {
        if (!site) return;
        const template = getTemplate(selectedTemplateId);

        const nextDraft = buildSiteDataPayload({
            templateId: selectedTemplateId,
            config: customData.config,
            existingData: site.draftData,
        });

        await updateSite({
            theme: {
                ...site.theme,
                ...template.defaultTheme,
                accentColor: customData.config.accentColor,
            },
            profile: customData.profile,
            draftData: nextDraft,
        }).unwrap();

        toast.success("Website draft saved.");
        void refetch();
    }

    async function handlePublishCustomization(customData: CustomizationData) {
        if (!site) return;
        try {
            await handleSaveCustomization(customData);
            await publishSite().unwrap();
            toast.success("Website published live!");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Could not publish website.";
            toast.error(message);
        }
    }

    if (isLoading || !site) {
        return (
            <DashboardFrame>
                <div className="flex min-h-[360px] items-center justify-center gap-2 text-xs text-muted-foreground">
                    <RestorchSpinner className="size-4 text-brand" />
                    <span>Loading Website Studio…</span>
                </div>
            </DashboardFrame>
        );
    }

    if (error) {
        return (
            <DashboardFrame>
                <PageHeader
                    eyebrow="Business"
                    title="Website Studio"
                    description="Choose from 5 handcrafted restaurant websites and customize your own."
                />
                <div className="rounded-2xl border border-destructive-border bg-destructive-soft p-4 text-xs text-destructive">
                    Could not load Website Studio.
                </div>
            </DashboardFrame>
        );
    }

    if (viewMode === "picker") {
        return (
            <DashboardFrame>
                <WebsiteTemplatePicker
                    slug={site.slug}
                    tenantName={effectiveTenantName}
                    activeTemplateId={selectedTemplateId}
                    draftData={site.draftData}
                    profile={site.profile}
                    menuItems={previewMenuItems}
                    busy={saving || publishing}
                    onApply={handleApplyTemplate}
                    onCancel={() => setViewMode("customizer")}
                />
            </DashboardFrame>
        );
    }

    const activeConfig = resolveTemplateConfig(
        selectedTemplateId,
        site.draftData,
        site.theme,
    );

    return (
        <TemplateCustomizer
            key={selectedTemplateId}
            templateId={selectedTemplateId}
            slug={site.slug}
            tenantName={effectiveTenantName}
            branchName={branchName}
            branchData={branchData}
            initialConfig={activeConfig}
            initialProfile={site.profile}
            menuItems={previewMenuItems}
            publicUrl={site.publicPath}
            isPublished={site.status === "PUBLISHED"}
            busy={saving}
            publishing={publishing}
            onSave={handleSaveCustomization}
            onPublish={handlePublishCustomization}
            onBack={() => setViewMode("picker")}
        />
    );
}
