"use client";

import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Link } from "@/i18n/navigation";
import { Package } from "lucide-react";

export default function StoreHomePage() {
    const t = useTranslations("inventory");

    return (
        <DashboardFrame>
            <PageHeader
                title={t("storeHomeTitle")}
                description={t("storeHomeDescription")}
            />
            <Link
                href="/store/inventory"
                className="flex max-w-md items-center gap-3 rounded-2xl border border-hairline bg-card px-4 py-4 transition-colors hover:bg-surface-ivory"
            >
                <Package className="size-5 text-brand" />
                <div>
                    <p className="text-[14px] font-semibold">{t("title")}</p>
                    <p className="text-[12px] text-slate-gray">
                        {t("storeHomeInventoryHint")}
                    </p>
                </div>
            </Link>
        </DashboardFrame>
    );
}
