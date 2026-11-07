"use client";

import { useState } from "react";
import { Building2, ChefHat, Plus, Store, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";
import AddBranchSheet from "@/domains/tenancy/ui/AddBranchSheet";
import { useListBranchesQuery } from "@/context/services/branchesApi";
import { useAppSelector } from "@/context/hooks";
import { cn } from "@/lib/utils";

export default function BranchesPage() {
    const t = useTranslations("owner");
    const tCommon = useTranslations("common");
    const router = useRouter();
    const session = useAppSelector(state => state.identity.session);
    const [addOpen, setAddOpen] = useState(false);

    const { data: branchesRes, isLoading } = useListBranchesQuery();
    const branches = branchesRes?.data ?? [];
    const atLimit =
        branchesRes != null &&
        branchesRes.activeCount >= branchesRes.maxBranches;

    return (
        <DashboardFrame>
            {/* Header row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Business"
                    title="Branches"
                    description={t("addBranchDesc")}
                />
                <button
                    type="button"
                    disabled={atLimit}
                    onClick={() => setAddOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-[13px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                    <Plus className="size-3.5" />
                    {t("addBranch")}
                </button>
            </div>

            {/* Count line */}
            {branchesRes && (
                <p className="text-[12px] text-slate-gray">
                    {t("branchLimit", {
                        active: branchesRes.activeCount,
                        max: branchesRes.maxBranches,
                    })}
                </p>
            )}

            {/* Loading */}
            {isLoading && <KpiStatsSkeleton />}

            {/* Empty */}
            {!isLoading && branches.length === 0 && (
                <div className="rounded-2xl border border-dashed border-hairline bg-card p-8 text-center text-[13px] text-slate-gray">
                    {t("noBranchesYet")}
                </div>
            )}

            {/* Grid */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {branches.map(branch => {
                    const isActive = branch.id === session?.branchId;
                    const isBakery = branch.serviceMode === "BAKERY";

                    return (
                        <button
                            key={branch.id}
                            type="button"
                            onClick={() =>
                                router.push(
                                    `/owner/branches/${branch.id}` as never,
                                )
                            }
                            className={cn(
                                "group flex flex-col gap-4 rounded-2xl border bg-card p-5 text-left transition-colors hover:border-foreground/20",
                                isActive
                                    ? "border-brand/40"
                                    : "border-hairline",
                            )}
                        >
                            {/* Top row */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "flex size-10 shrink-0 items-center justify-center rounded-xl",
                                            isBakery
                                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                                                : "bg-brand/8 text-brand",
                                        )}
                                    >
                                        {isBakery ? (
                                            <ChefHat className="size-5" />
                                        ) : (
                                            <Store className="size-5" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-semibold leading-tight text-foreground">
                                            {branch.name}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-slate-gray">
                                            {branch.displayCode
                                                ? branch.displayCode
                                                : "—"}
                                            {" · "}
                                            {isBakery ? "Bakery" : "Restaurant"}
                                        </p>
                                    </div>
                                </div>

                                {/* Status pill */}
                                <span
                                    className={cn(
                                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                        isActive
                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                            : branch.status === "ACTIVE"
                                              ? "bg-secondary text-slate-gray"
                                              : "bg-red-50 text-red-600 dark:bg-red-950/40",
                                    )}
                                >
                                    {isActive
                                        ? tCommon("live")
                                        : branch.status === "ACTIVE"
                                          ? "Active"
                                          : "Archived"}
                                </span>
                            </div>

                            {/* Stats row */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {[
                                    {
                                        label: t("tablesCount", {
                                            count: branch.tableCount,
                                        }),
                                    },
                                    {
                                        label: t("stationsCount", {
                                            count: branch.stationCount,
                                        }),
                                    },
                                    {
                                        label: t("staffCountLabel", {
                                            count: branch.staffCount,
                                        }),
                                    },
                                ].map(s => (
                                    <span
                                        key={s.label}
                                        className="text-[12px] text-slate-gray"
                                    >
                                        {s.label}
                                    </span>
                                ))}
                            </div>

                            {/* Manager */}
                            {branch.manager?.name && (
                                <div className="flex items-center gap-2 border-t border-hairline pt-3">
                                    <div className="flex size-6 items-center justify-center rounded-full bg-secondary">
                                        <Users className="size-3.5 text-slate-gray" />
                                    </div>
                                    <p className="text-[12px] text-foreground">
                                        <span className="text-slate-gray">
                                            Manager:{" "}
                                        </span>
                                        {branch.manager.name}
                                    </p>
                                </div>
                            )}
                        </button>
                    );
                })}

                {/* Add new card */}
                {!atLimit && (
                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline bg-card text-slate-gray transition-colors hover:border-foreground/20 hover:text-foreground"
                    >
                        <div className="flex size-9 items-center justify-center rounded-xl border border-hairline bg-background">
                            <Plus className="size-4" />
                        </div>
                        <span className="text-[13px] font-medium">
                            {t("addBranch")}
                        </span>
                    </button>
                )}
            </div>

            <AddBranchSheet open={addOpen} onClose={() => setAddOpen(false)} />
        </DashboardFrame>
    );
}
