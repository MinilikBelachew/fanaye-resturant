"use client";

import { useEffect, useState } from "react";
import {
    useGetSuperAdminTalentRequestQuery,
    useUpdateSuperAdminTalentRequestMutation,
    type TalentRequestStatus,
} from "@/context/services/talentApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import { Link } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import {
    ArrowLeft,
    Building2,
    Calendar,
    Mail,
    MapPin,
    Phone,
} from "lucide-react";
import {
    ALLOWED_TALENT_REQUEST_TRANSITIONS,
    TALENT_REQUEST_STATUS_META,
    TalentRequestStatusBadge,
} from "./TalentShared";

function formatDt(iso: string | null) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function SuperAdminTalentRequestDetail({ id }: { id: string }) {
    const {
        data: req,
        isLoading,
        isError,
    } = useGetSuperAdminTalentRequestQuery(id);
    const [updateRequest, { isLoading: isUpdating }] =
        useUpdateSuperAdminTalentRequestMutation();

    const [status, setStatus] = useState<TalentRequestStatus>("CONTACTED");
    const [adminNotes, setAdminNotes] = useState("");

    useEffect(() => {
        if (!req) return;
        setStatus(req.status);
        setAdminNotes(req.adminNotes ?? "");
    }, [req]);

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                Loading talent request details...
            </div>
        );
    }

    if (isError || !req) {
        return (
            <div className="space-y-4 rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Talent request not found.
                </p>
                <Link
                    href="/super-admin/talent"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Talent
                </Link>
            </div>
        );
    }

    const nextLegal = ALLOWED_TALENT_REQUEST_TRANSITIONS[req.status] ?? [];
    const isTerminal = nextLegal.length === 0;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateRequest({
                id: req.id,
                status,
                adminNotes: adminNotes.trim() || undefined,
            }).unwrap();
            toast.success("Talent request updated.");
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to update request.";
            toast.error(msg);
        }
    };

    const timeline = [
        { label: "Contacted", at: req.contactedAt },
        { label: "Interviewing", at: req.interviewingAt },
        { label: "Hired", at: req.hiredAt },
        { label: "Cancelled", at: req.cancelledAt },
    ].filter(x => x.at !== null);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <Link
                    href="/super-admin/talent"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Talent
                </Link>
                <TalentRequestStatusBadge status={req.status} />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-start gap-4">
                            {req.talentProfile.photoUrl ? (
                                <img
                                    src={
                                        filePublicUrl(
                                            req.talentProfile.photoUrl,
                                        ) ?? req.talentProfile.photoUrl
                                    }
                                    alt={req.talentProfile.fullName}
                                    className="h-16 w-16 shrink-0 rounded-2xl border border-border object-cover shadow-xs"
                                />
                            ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary-soft text-lg font-bold text-primary">
                                    {req.talentProfile.fullName
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>
                                        {req.tenantName ?? "Restaurant"}
                                    </span>
                                    {req.branchName ? (
                                        <span>• {req.branchName}</span>
                                    ) : null}
                                </div>
                                <h2 className="mt-1 truncate text-xl font-bold text-foreground">
                                    {req.talentProfile.fullName}
                                </h2>
                                <p className="text-xs font-medium text-primary">
                                    {req.talentProfile.roleTitle} •{" "}
                                    {req.talentProfile.yearsExperience} years
                                    experience
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 text-xs sm:grid-cols-3">
                            <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{req.talentProfile.phone}</span>
                            </div>
                            {req.talentProfile.email ? (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{req.talentProfile.email}</span>
                                </div>
                            ) : null}
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{req.talentProfile.location}</span>
                            </div>
                        </div>

                        {req.notes ? (
                            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                                <strong className="text-foreground">
                                    Restaurant Notes:
                                </strong>{" "}
                                <span className="text-muted-foreground">
                                    {req.notes}
                                </span>
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5">
                        <h3 className="text-sm font-semibold text-foreground">
                            Timeline
                        </h3>
                        <div className="mt-3 space-y-2.5">
                            {timeline.map(step => (
                                <div
                                    key={step.label}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-2 font-medium text-foreground">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{step.label}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {formatDt(step.at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-base font-semibold text-foreground">
                        Update Status
                    </h3>
                    <form onSubmit={handleSave} className="mt-4 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                Status
                            </label>
                            <select
                                disabled={isTerminal}
                                value={status}
                                onChange={e =>
                                    setStatus(
                                        e.target.value as TalentRequestStatus,
                                    )
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
                            >
                                <option value={req.status}>
                                    {
                                        TALENT_REQUEST_STATUS_META[req.status]
                                            .label
                                    }{" "}
                                    (Current)
                                </option>
                                {nextLegal.map(st => (
                                    <option key={st} value={st}>
                                        {TALENT_REQUEST_STATUS_META[st].label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                Admin Notes
                            </label>
                            <textarea
                                rows={3}
                                disabled={isTerminal}
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
                            />
                        </div>

                        {!isTerminal ? (
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                            >
                                {isUpdating ? "Saving..." : "Update Request"}
                            </button>
                        ) : (
                            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                                Final status:{" "}
                                {TALENT_REQUEST_STATUS_META[req.status].label}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
