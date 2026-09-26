"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    useGetTenantSiteQuery,
    useUpdateTenantSiteMutation,
} from "@/context/services/siteApi";
import { useGetManagerDashboardQuery } from "@/context/services/managerDashboardApi";
import { useAppSelector } from "@/context/hooks";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import { ImageUploadField } from "@/domains/site/puck/ImageUploadField";
import { toast } from "@/lib/toast";

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

export default function OwnerSettingsPage() {
    const t = useTranslations("owner");
    const tTopBar = useTranslations("topbar");
    const tRoles = useTranslations("roleLabels");
    const session = useAppSelector(state => state.identity.session);
    const staff = useAppSelector(selectCurrentStaff);
    const { data: siteRes, isLoading: siteLoading } = useGetTenantSiteQuery();
    const { data: dash } = useGetManagerDashboardQuery();
    const [updateSite, { isLoading: saving }] = useUpdateTenantSiteMutation();

    const site = siteRes?.data;
    const [tenantName, setTenantName] = useState("");
    const [slug, setSlug] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [slugTouched, setSlugTouched] = useState(false);

    useEffect(() => {
        if (!site) return;
        setTenantName(site.tenantName || "");
        setSlug(site.slug || "");
        setLogoUrl(site.theme?.logoUrl || "");
        setSlugTouched(false);
    }, [site]);

    const dirty = useMemo(() => {
        if (!site) return false;
        return (
            tenantName.trim() !== (site.tenantName || "").trim() ||
            slug.trim() !== (site.slug || "").trim() ||
            (logoUrl || "") !== (site.theme?.logoUrl || "")
        );
    }, [site, tenantName, slug, logoUrl]);

    async function onSave() {
        const name = tenantName.trim();
        if (name.length < 2) {
            toast.error(t("nameMinChars"));
            return;
        }
        const nextSlug = slugify(slug || name);
        if (nextSlug.length < 2) {
            toast.error(t("slugMinChars"));
            return;
        }
        try {
            const result = await updateSite({
                tenantName: name,
                slug: nextSlug,
                theme: {
                    ...(site?.theme ?? {}),
                    logoUrl: logoUrl || null,
                },
            }).unwrap();
            setTenantName(result.data.tenantName);
            setSlug(result.data.slug);
            setLogoUrl(result.data.theme?.logoUrl || "");
            toast.success(t("settingsSaved"));
        } catch (err: unknown) {
            toast.fromUnknown(err, t("settingsSaveError"));
        }
    }

    const roleKey = (staff?.role || "owner").toLowerCase();
    const roleLabel = tRoles.has(roleKey)
        ? tRoles(roleKey)
        : ROLE_LABELS[roleKey] || tRoles("owner");

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Business"
                    title="Settings"
                    description={t("settingsDesc")}
                />
                <Button
                    size="sm"
                    onClick={() => void onSave()}
                    disabled={!dirty || saving || siteLoading}
                    className="self-start gap-2 rounded-full"
                >
                    {saving ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                        <Save className="size-3.5" />
                    )}
                    {saving ? t("saving") : t("saveChanges")}
                </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <section className="space-y-4 rounded-[16px] border border-hairline bg-card p-4 shadow-subtle sm:p-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="restaurant-name">
                            {t("restaurantName")}
                        </Label>
                        <Input
                            id="restaurant-name"
                            value={tenantName}
                            onChange={e => {
                                const next = e.target.value;
                                setTenantName(next);
                                if (!slugTouched) {
                                    setSlug(slugify(next));
                                }
                            }}
                            placeholder={t("restaurantNamePlaceholder")}
                            className="h-10 rounded-xl"
                            disabled={siteLoading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="site-slug">{t("publicSiteSlug")}</Label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <span className="shrink-0 text-[12px] text-slate-gray">
                                /r/
                            </span>
                            <Input
                                id="site-slug"
                                value={slug}
                                onChange={e => {
                                    setSlugTouched(true);
                                    setSlug(slugify(e.target.value));
                                }}
                                placeholder="your-restaurant"
                                className="h-10 rounded-xl font-mono text-[13px]"
                                disabled={siteLoading}
                            />
                        </div>
                        <p className="text-[11px] text-slate-gray">
                            {t("guestsOpenPrefix")}{" "}
                            <span className="font-medium text-foreground">
                                {site?.publicPath || `/r/${slug || "…"}`}
                            </span>
                        </p>
                    </div>

                    <ImageUploadField
                        label={t("restaurantLogo")}
                        value={logoUrl}
                        onChange={setLogoUrl}
                    />
                </section>

                <section className="rounded-[16px] border border-hairline bg-card p-4 shadow-subtle sm:p-5">
                    <h2 className="text-[14px] font-semibold tracking-tight">
                        {t("workspace")}
                    </h2>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {t("workspaceHint")}
                    </p>
                    <ul className="mt-4 space-y-3">
                        {[
                            {
                                name: t("siteStatus"),
                                value:
                                    site?.status || (siteLoading ? "…" : "—"),
                            },
                            {
                                name: t("branch"),
                                value:
                                    dash?.data?.branchName ||
                                    session?.branchName ||
                                    "—",
                            },
                            {
                                name: tTopBar("signedInAs"),
                                value:
                                    session?.displayName || staff?.name || "—",
                            },
                            {
                                name: tTopBar("role"),
                                value: roleLabel,
                            },
                            {
                                name: t("businessDate"),
                                value: dash?.data?.businessDate || "—",
                            },
                        ].map(row => (
                            <li
                                key={row.name}
                                className="flex flex-col gap-1 border-b border-hairline pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                            >
                                <span className="text-[12px] text-slate-gray">
                                    {row.name}
                                </span>
                                <Badge
                                    variant="secondary"
                                    className="max-w-full self-start truncate sm:self-auto"
                                >
                                    {row.value}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </DashboardFrame>
    );
}
