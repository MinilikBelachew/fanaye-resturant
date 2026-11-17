"use client";

import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminMarketPricesBoard from "@/domains/market-prices/ui/SuperAdminMarketPricesBoard";

export default function SuperAdminMarketPricesPage() {
    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    eyebrow="Platform • Market Intelligence"
                    title="Market Prices"
                    description="Post daily gebeya prices, manage items, units, categories, and Market Reporter accounts."
                />
                <SuperAdminMarketPricesBoard />
            </div>
        </AppShell>
    );
}
