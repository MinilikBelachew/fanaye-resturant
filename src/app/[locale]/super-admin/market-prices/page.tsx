"use client";

import { useLocale } from "next-intl";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminMarketPricesBoard from "@/domains/market-prices/ui/SuperAdminMarketPricesBoard";

export default function SuperAdminMarketPricesPage() {
    const isAm = useLocale() === "am";

    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    eyebrow={
                        isAm
                            ? "ፕላትፎርም • የገበያ መረጃ"
                            : "Platform • Market Intelligence"
                    }
                    title={isAm ? "የገበያ ዋጋዎች" : "Market Prices"}
                    description={
                        isAm
                            ? "ዕለታዊ የገበያ ዋጋዎችን ይለጥፉ፣ የምርት ዓይነቶችን፣ መለኪያዎችን፣ ምድቦችን እና የገበያ ሪፖርተር መለያዎችን ያስተዳድሩ።"
                            : "Post daily gebeya prices, manage items, units, categories, and Market Reporter accounts."
                    }
                />
                <SuperAdminMarketPricesBoard />
            </div>
        </AppShell>
    );
}
