"use client";

import { useState } from "react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import ManagerTablesBoard from "@/domains/floor/ui/ManagerTablesBoard";
import ManagerFloorConfig from "@/domains/floor/ui/ManagerFloorConfig";
import { cn } from "@/lib/utils";

export default function ManagerTablesPage() {
    const [mode, setMode] = useState<"live" | "configure">("configure");

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="House"
                title="Tables"
                description="Create places and tables, assign waiters, and monitor the live floor."
            />

            <div className="mb-5 flex w-fit items-center gap-1 rounded-full border border-hairline bg-card p-1">
                <button
                    type="button"
                    onClick={() => setMode("configure")}
                    className={cn(
                        "rounded-full px-4 py-1.5 text-[13px] font-semibold",
                        mode === "configure"
                            ? "bg-foreground text-background"
                            : "text-slate-gray",
                    )}
                >
                    Configure
                </button>
                <button
                    type="button"
                    onClick={() => setMode("live")}
                    className={cn(
                        "rounded-full px-4 py-1.5 text-[13px] font-semibold",
                        mode === "live"
                            ? "bg-foreground text-background"
                            : "text-slate-gray",
                    )}
                >
                    Live floor
                </button>
            </div>

            {mode === "configure" ? (
                <ManagerFloorConfig />
            ) : (
                <ManagerTablesBoard />
            )}
        </DashboardFrame>
    );
}
