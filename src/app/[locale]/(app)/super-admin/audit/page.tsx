"use client";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { useGetSuperAdminAuditQuery } from "@/context/services/superAdminApi";

function formatWhen(iso: string) {
    try {
        return new Date(iso).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

export default function PlatformAuditPage() {
    const { data, isLoading, error } = useGetSuperAdminAuditQuery({ limit: 80 });
    const events = data?.data ?? [];

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Trust"
                title="Platform audit"
                description="Provisioning, staff access changes, feature flags, and other platform actions."
            />

            {error && (
                <div className="rounded-[16px] border border-destructive/20 bg-destructive/10 p-4 text-[13px] text-destructive">
                    Unable to load platform audit events.
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-slate-gray">
                    <Loader2 className="size-4 animate-spin text-brand" />
                    Loading audit stream…
                </div>
            ) : events.length === 0 ? (
                <p className="rounded-[16px] border border-hairline bg-card px-5 py-10 text-center text-[13px] text-slate-gray">
                    No platform audit events yet.
                </p>
            ) : (
                <ol className="space-y-3">
                    {events.map(event => (
                        <li
                            key={event.id}
                            className="rounded-[16px] border border-hairline bg-card px-5 py-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[12px] text-slate-gray">
                                    {formatWhen(event.occurredAt)}
                                </p>
                                <Badge
                                    variant={
                                        event.severity === "warning"
                                            ? "secondary"
                                            : event.severity === "success"
                                              ? "success"
                                              : "outline"
                                    }
                                >
                                    {event.action}
                                </Badge>
                            </div>
                            <p className="mt-1 font-medium text-[14px]">
                                {event.entityName}
                            </p>
                            <p className="mt-0.5 text-[13px] text-slate-gray">
                                {event.description}
                            </p>
                        </li>
                    ))}
                </ol>
            )}
        </DashboardFrame>
    );
}
