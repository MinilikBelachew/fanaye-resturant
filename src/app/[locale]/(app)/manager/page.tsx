import { Bot } from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    PaymentChannelsBreakdown,
    PrepDurationBucketsChart,
    RevenueVsCollectionsChart,
    TopDishesLeaderboard,
    WeeklyCashMovementChart,
} from "@/components/custom/organisms/Charts";

export default function ManagerPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="House"
                title="Manager dashboard"
                description="Live station throughput, revenue analytics, and fulfillment channels."
            />

            {/* 1. Top Modern KPI Stat Cards (Image 2 style) */}
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Daily Revenue / Net"
                    value="ETB 48.2k"
                    trend={{
                        value: "+23%",
                        direction: "up",
                        label: "vs yesterday",
                    }}
                    sparkline={{
                        badge: "23%",
                        color: "#e85d04",
                        variant: "wave1",
                    }}
                    tone="brand"
                />
                <KpiCard
                    label="Avg Prep Time / Day"
                    value="7.4 min"
                    trend={{
                        value: "-12%",
                        direction: "up",
                        label: "faster vs last week",
                    }}
                    sparkline={{
                        badge: "18%",
                        color: "#046645",
                        variant: "wave2",
                    }}
                    tone="emerald"
                />
                <KpiCard
                    label="Active Tables / Floor"
                    value="8 / 14"
                    trend={{
                        value: "57%",
                        direction: "neutral",
                        label: "floor capacity",
                    }}
                    sparkline={{
                        badge: "15%",
                        color: "#f97316",
                        variant: "wave3",
                    }}
                    tone="amber"
                />
                <KpiCard
                    label="TinaVerify Transfer Mix"
                    value="89.2%"
                    trend={{
                        value: "+14%",
                        direction: "up",
                        label: "digital verified",
                    }}
                    sparkline={{
                        badge: "94%",
                        color: "#c2410c",
                        variant: "wave4",
                    }}
                    tone="brand"
                />
            </div>

            {/* 2. Main Dashboard Charts (Image 3 Top Row: 2-col Revenue vs Collections + 1-col Payment Channels) */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RevenueVsCollectionsChart />
                </div>
                <div className="lg:col-span-1">
                    <PaymentChannelsBreakdown />
                </div>
            </div>

            {/* 3. Operational Drill-down (Image 3 Bottom Row: 3 equal cards) */}
            <div className="grid gap-4 md:grid-cols-3">
                <PrepDurationBucketsChart />
                <WeeklyCashMovementChart />
                <TopDishesLeaderboard />
            </div>

            {/* 4. Floating AI Assistant Quick-Insight Pill (Image 3 bottom-right style) */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                >
                    <Bot className="size-4 transition-transform group-hover:rotate-12" />
                    <span>Ask Mila AI</span>
                    <span className="flex size-2 rounded-full bg-emerald-300 animate-pulse" />
                </button>
            </div>
        </DashboardFrame>
    );
}
