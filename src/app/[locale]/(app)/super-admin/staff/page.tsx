"use client";

import { useMemo, useState } from "react";
import { KeyRound, Loader2, Search, ShieldOff, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    useGetSuperAdminStaffQuery,
    useResetSuperAdminStaffPasswordMutation,
    useSuspendSuperAdminStaffMutation,
    type PlatformStaffMember,
} from "@/context/services/superAdminApi";
import { toast } from "@/lib/toast";

function formatLogin(value?: string | null) {
    if (!value) return "Never";
    try {
        return new Date(value).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return value;
    }
}

export default function StaffDirectoryPage() {
    const [q, setQ] = useState("");
    const [passwordTarget, setPasswordTarget] =
        useState<PlatformStaffMember | null>(null);
    const [password, setPassword] = useState("");
    const { data, isLoading, error, refetch } = useGetSuperAdminStaffQuery();
    const [suspendStaff, { isLoading: suspending }] =
        useSuspendSuperAdminStaffMutation();
    const [resetPassword, { isLoading: resetting }] =
        useResetSuperAdminStaffPasswordMutation();

    const rows = useMemo(() => {
        const all = data?.data ?? [];
        const needle = q.trim().toLowerCase();
        if (!needle) return all;
        return all.filter(row =>
            [
                row.displayName,
                row.email,
                row.phone,
                row.tenantName,
                ...row.roles,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(needle),
        );
    }, [data?.data, q]);

    async function onToggleSuspend(row: PlatformStaffMember) {
        const suspended = row.accountStatus !== "SUSPENDED";
        try {
            await suspendStaff({
                membershipId: row.membershipId,
                suspended,
            }).unwrap();
            toast.success(
                suspended ? "User suspended" : "User reactivated",
                row.displayName,
            );
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Could not update staff status.";
            toast.error(message);
        }
    }

    async function onSavePassword() {
        if (!passwordTarget) return;
        if (password.trim().length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        try {
            await resetPassword({
                membershipId: passwordTarget.membershipId,
                password: password.trim(),
            }).unwrap();
            toast.success("Password updated", passwordTarget.displayName);
            setPasswordTarget(null);
            setPassword("");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Could not reset password.";
            toast.error(message);
        }
    }

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Platform"
                title="Staff directory"
                description="Managers and owners across tenants. Suspend access or reset login passwords."
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                    <Input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search name, email, tenant…"
                        className="pl-9"
                    />
                </div>
                <p className="text-[12px] text-slate-gray">
                    {rows.length} manager / owner accounts
                </p>
            </div>

            {error && (
                <div className="rounded-[16px] border border-destructive/20 bg-destructive/10 p-4 text-[13px] text-destructive">
                    Unable to load staff directory.
                </div>
            )}

            <div className="overflow-hidden rounded-[16px] border border-hairline bg-card">
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-slate-gray">
                        <Loader2 className="size-4 animate-spin text-brand" />
                        Loading staff…
                    </div>
                ) : rows.length === 0 ? (
                    <p className="px-5 py-10 text-center text-[13px] text-slate-gray">
                        No manager or owner accounts found yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-hairline">
                        {rows.map(row => {
                            const suspended =
                                row.accountStatus === "SUSPENDED" ||
                                row.membershipStatus === "INACTIVE";
                            return (
                                <li
                                    key={row.membershipId}
                                    className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate font-semibold text-[14px]">
                                                {row.displayName}
                                            </p>
                                            {row.roles.map(role => (
                                                <Badge
                                                    key={role}
                                                    variant="outline"
                                                >
                                                    {role.replace("_", " ")}
                                                </Badge>
                                            ))}
                                            <Badge
                                                variant={
                                                    suspended
                                                        ? "secondary"
                                                        : "success"
                                                }
                                            >
                                                {suspended
                                                    ? "Suspended"
                                                    : "Active"}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-[12px] text-slate-gray">
                                            <Link
                                                href={`/super-admin/tenants/${row.tenantId}`}
                                                className="text-brand hover:underline"
                                            >
                                                {row.tenantName}
                                            </Link>
                                            {row.email ? ` · ${row.email}` : ""}
                                            {row.phone ? ` · ${row.phone}` : ""}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-gray">
                                            Last login:{" "}
                                            {formatLogin(row.lastLoginAt)}
                                            {" · "}
                                            {row.hasPassword
                                                ? "Password set"
                                                : "No password yet"}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            disabled={suspending}
                                            onClick={() =>
                                                void onToggleSuspend(row)
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline px-3 py-2 text-[12px] font-medium hover:bg-surface-ivory"
                                        >
                                            {suspended ? (
                                                <ShieldCheck className="size-3.5 text-brand" />
                                            ) : (
                                                <ShieldOff className="size-3.5 text-destructive" />
                                            )}
                                            {suspended
                                                ? "Reactivate"
                                                : "Suspend"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPasswordTarget(row);
                                                setPassword("");
                                            }}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-[12px] font-semibold text-white hover:bg-brand/90"
                                        >
                                            <KeyRound className="size-3.5" />
                                            Change password
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {passwordTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close"
                        className="absolute inset-0 bg-foreground/40"
                        onClick={() => setPasswordTarget(null)}
                    />
                    <div className="relative z-10 w-full max-w-md rounded-[18px] border border-hairline bg-background p-5 shadow-2xl">
                        <h3 className="text-[16px] font-semibold">
                            Change password
                        </h3>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            Set a new login password for{" "}
                            <strong>{passwordTarget.displayName}</strong> at{" "}
                            {passwordTarget.tenantName}. Active sessions will be
                            revoked.
                        </p>
                        <Input
                            type="password"
                            className="mt-4"
                            placeholder="New password (min 6)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPasswordTarget(null)}
                                className="rounded-xl border border-hairline px-3 py-2 text-[12px] font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={resetting}
                                onClick={() => void onSavePassword()}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
                            >
                                {resetting && (
                                    <Loader2 className="size-3.5 animate-spin" />
                                )}
                                Save password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardFrame>
    );
}
