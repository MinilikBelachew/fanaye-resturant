"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminMarketingBoard from "@/domains/marketing/ui/SuperAdminMarketingBoard";
import SuperAdminTestimonialsBoard from "@/domains/marketing/ui/SuperAdminTestimonialsBoard";

export default function SuperAdminMarketingPage() {
    const isAm = useLocale() === "am";
    const [tab, setTab] = useState<"campaigns" | "testimonials">("campaigns");

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "ፕላትፎርም" : "Platform"}
                title={
                    tab === "campaigns"
                        ? isAm
                            ? "የግብይት ጥያቄዎች"
                            : "Marketing Requests"
                        : isAm
                          ? "የመድረክ ምስክርነቶች"
                          : "Landing Testimonials"
                }
                description={
                    tab === "campaigns"
                        ? isAm
                            ? "የሬስቶራንት ማስተዋወቂያ ጥያቄዎችን ያረጋግጡ፣ የቀረቡ ዕይታዎችን ይከታተሉ እና ከተጠናቀቀ በኋላ ሂሳብ ይላኩ።"
                            : "Confirm restaurant promotion requests, track delivered views, and bill after completion."
                        : isAm
                          ? "በዋናው ድረ-ገጽ ላይ የሚታዩትን የተረጋገጡ የሬስቶራንት ባለቤቶች ምስክርነቶች ያስተዳድሩ።"
                          : "Manage verified restaurant owner testimonials displayed on the public landing page."
                }
            />

            <div className="mb-5 flex items-center gap-2 border-b border-border/60 pb-3">
                <button
                    type="button"
                    onClick={() => setTab("campaigns")}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        tab === "campaigns"
                            ? "bg-foreground text-background"
                            : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {isAm ? "የግብይት ጥያቄዎች" : "Marketing Requests"}
                </button>
                <button
                    type="button"
                    onClick={() => setTab("testimonials")}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        tab === "testimonials"
                            ? "bg-foreground text-background"
                            : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {isAm ? "የመድረክ ምስክርነቶች" : "Landing Testimonials"}
                </button>
            </div>

            {tab === "campaigns" ? (
                <SuperAdminMarketingBoard />
            ) : (
                <SuperAdminTestimonialsBoard />
            )}
        </DashboardFrame>
    );
}
