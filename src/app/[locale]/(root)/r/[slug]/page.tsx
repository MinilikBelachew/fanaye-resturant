"use client";

import { use } from "react";
import { RestorchLoader } from "@/components/common/RestorchLoader";
import { useGetPublicSiteQuery } from "@/context/services/siteApi";
import SiteFeedbackWidget from "@/domains/feedback/ui/SiteFeedbackWidget";
import SiteTemplateRenderer from "@/domains/site/templates/SiteTemplateRenderer";
import {
    normalizeTemplateId,
    resolveTemplateConfig,
} from "@/domains/site/templates/restaurantTemplates";

export default function PublicRestaurantSitePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const { data, isLoading, error } = useGetPublicSiteQuery(slug);

    if (isLoading) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-background p-6">
                <RestorchLoader size="md" label="Loading restaurant site…" />
            </div>
        );
    }

    if (error || !data?.data) {
        return (
            <div className="flex min-h-svh flex-col items-center justify-center gap-2 px-6 text-center">
                <h1 className="text-2xl font-normal">Site not found</h1>
                <p className="text-sm text-slate-600">
                    This restaurant has not published a public website yet.
                </p>
            </div>
        );
    }

    const site = data.data;
    const siteData = (site.data ?? {}) as Record<string, unknown>;
    const templateId = normalizeTemplateId(siteData.templateId);
    const config = resolveTemplateConfig(templateId, siteData, site.theme);

    const mergedProfile = {
        ...site.profile,
        phone: site.phone ?? site.profile?.phone ?? null,
        email: site.email ?? site.profile?.email ?? null,
        city: site.city ?? site.profile?.city ?? null,
        address: site.address ?? site.profile?.address ?? null,
        hours: site.hours ?? site.profile?.hours ?? null,
    };

    return (
        <>
            <SiteTemplateRenderer
                templateId={templateId}
                slug={slug}
                tenantName={site.tenantName}
                config={config}
                profile={mergedProfile}
                menuItems={site.menuItems}
                logoUrl={site.theme?.logoUrl}
            />
            <SiteFeedbackWidget slug={slug} />
        </>
    );
}
