"use client";

import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/custom/organisms/PageHeader";
import TenantMarketPricesBoard from "@/domains/market-prices/ui/TenantMarketPricesBoard";

export default function StoreMarketPricesPage() {
    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    eyebrow="Supply Intelligence"
                    title="Market Prices"
                    description="Compare daily ingredient prices across local marketplaces (gebeya), averages, and trends."
                />
                <TenantMarketPricesBoard />
            </div>
        </AppShell>
    );
}
