"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import InventoryAnalyticsBoard from "@/domains/inventory/ui/InventoryAnalyticsBoard";
import InventoryCentralAnalyticsBoard from "@/domains/inventory/ui/InventoryCentralAnalyticsBoard";
import { Building2, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OwnerInventoryAnalyticsPage() {
    const t = useTranslations("inventory");
    const [view, setView] = useState<"central" | "branch">("central");

    return (
        <DashboardFrame>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
                <PageHeader
                    title={
                        view === "central"
                            ? t("centralTitle")
                            : t("analyticsTitle")
                    }
                    compact
                />
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-ivory border border-hairline text-xs font-medium">
                    <button
                        type="button"
                        onClick={() => setView("central")}
                        className={cn(
                            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all",
                            view === "central"
                                ? "bg-white text-foreground shadow-sm font-semibold dark:bg-card"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <Building2 className="size-3.5 text-brand" />
                        <span>{t("centralTitle")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("branch")}
                        className={cn(
                            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all",
                            view === "branch"
                                ? "bg-white text-foreground shadow-sm font-semibold dark:bg-card"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <Store className="size-3.5 text-brand" />
                        <span>{t("analyticsTitle")}</span>
                    </button>
                </div>
            </div>

            {view === "central" ? (
                <InventoryCentralAnalyticsBoard />
            ) : (
                <InventoryAnalyticsBoard />
            )}
        </DashboardFrame>
    );
}
