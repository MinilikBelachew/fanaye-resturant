"use client";

import { useState } from "react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminMarketingBoard from "@/domains/marketing/ui/SuperAdminMarketingBoard";
import SuperAdminTestimonialsBoard from "@/domains/marketing/ui/SuperAdminTestimonialsBoard";

export default function SuperAdminMarketingPage() {
    const [tab, setTab] = useState<"campaigns" | "testimonials">("campaigns");

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Platform"
                title={
                    tab === "campaigns"
                        ? "Marketing Requests"
                        : "Landing Testimonials"
                }
                description={
                    tab === "campaigns"
                        ? "Confirm restaurant promotion requests, track delivered views, and bill after completion."
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
                    Marketing Requests
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
                    Landing Testimonials
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
