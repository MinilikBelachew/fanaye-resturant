"use client";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingNavbar from "@/components/landing/LandingNavbar";
import { useGetPublicMarketItemDetailQuery } from "@/context/services/marketPricesApi";
import MarketItemDetailView from "@/domains/market-prices/ui/MarketItemDetailView";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";

export default function PublicMarketItemDetailPage() {
    const params = useParams<{ idOrSlug: string }>();
    const router = useRouter();
    const idOrSlug = params?.idOrSlug ?? "";

    const {
        data: item,
        isLoading,
        error,
    } = useGetPublicMarketItemDetailQuery(idOrSlug, { skip: !idOrSlug });

    return (
        <div className="min-h-screen bg-background text-foreground">
            <LandingNavbar />

            <main className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32">
                {isLoading ? (
                    <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
                ) : error || !item ? (
                    <div className="rounded-2xl border border-border bg-card p-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            Market item not found.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push("/market-prices")}
                            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                        >
                            Back to Market Prices
                        </button>
                    </div>
                ) : (
                    <MarketItemDetailView
                        item={item}
                        onBack={() => router.push("/market-prices")}
                    />
                )}
            </main>

            <LandingFooter />
        </div>
    );
}
