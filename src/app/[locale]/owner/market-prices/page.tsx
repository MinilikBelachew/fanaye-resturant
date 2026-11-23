"use client";

import { useLocale } from "next-intl";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/custom/organisms/PageHeader";
import TenantMarketPricesBoard from "@/domains/market-prices/ui/TenantMarketPricesBoard";

export default function OwnerMarketPricesPage() {
    const isAm = useLocale() === "am";
    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    eyebrow={isAm ? "የገበያ መረጃ" : "Supply Intelligence"}
                    title={isAm ? "የገበያ ዋጋዎች" : "Market Prices"}
                    description={
                        isAm
                            ? "የእቃዎችን ዕለታዊ ዋጋ በአካባቢው ገበያዎች፣ አማካዮችን እና አዝማሚያዎችን ያወዳድሩ።"
                            : "Compare daily ingredient prices across local marketplaces (gebeya), averages, and trends."
                    }
                />
                <TenantMarketPricesBoard />
            </div>
        </AppShell>
    );
}
