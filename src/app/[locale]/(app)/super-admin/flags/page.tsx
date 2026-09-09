"use client";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    useGetSuperAdminFlagsQuery,
    useUpdateSuperAdminFlagMutation,
} from "@/context/services/superAdminApi";
import { toast } from "@/lib/toast";

export default function FlagsPage() {
    const { data, isLoading, error, refetch } = useGetSuperAdminFlagsQuery();
    const [updateFlag, { isLoading: saving }] =
        useUpdateSuperAdminFlagMutation();
    const flags = data?.data ?? [];

    async function onToggle(key: string, enabled: boolean) {
        try {
            await updateFlag({ key, enabled }).unwrap();
            toast.success(
                enabled ? "Flag enabled" : "Flag disabled",
                key,
            );
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Could not update feature flag.";
            toast.error(message);
        }
    }

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Platform"
                title="Feature flags"
                description="Toggle platform capabilities. Changes are audited and apply across the network."
            />

            {error && (
                <div className="rounded-[16px] border border-destructive/20 bg-destructive/10 p-4 text-[13px] text-destructive">
                    Unable to load feature flags.
                </div>
            )}

            <div className="overflow-hidden rounded-[16px] border border-hairline bg-card">
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-slate-gray">
                        <Loader2 className="size-4 animate-spin text-brand" />
                        Loading flags…
                    </div>
                ) : (
                    <ul>
                        {flags.map(flag => (
                            <li
                                key={flag.key}
                                className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-4 last:border-0"
                            >
                                <div>
                                    <p className="font-medium">{flag.name}</p>
                                    <p className="text-[13px] text-slate-gray">
                                        {flag.scope} · {flag.key}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge
                                        variant={
                                            flag.enabled
                                                ? "success"
                                                : "secondary"
                                        }
                                    >
                                        {flag.enabled ? "On" : "Off"}
                                    </Badge>
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() =>
                                            void onToggle(
                                                flag.key,
                                                !flag.enabled,
                                            )
                                        }
                                        className="rounded-xl border border-hairline px-3 py-1.5 text-[12px] font-medium hover:bg-surface-ivory disabled:opacity-60"
                                    >
                                        {flag.enabled ? "Disable" : "Enable"}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </DashboardFrame>
    );
}
