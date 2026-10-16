"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    useGetSuperAdminPermissionsQuery,
    useGetSuperAdminRolePermissionsQuery,
    useGetSuperAdminRolesQuery,
    useSetSuperAdminRolePermissionsMutation,
    type RestaurantRole,
} from "@/context/services/superAdminApi";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function RolesPermissionsBoard() {
    const {
        data: rolesData,
        isLoading: rolesLoading,
        error: rolesError,
        refetch: refetchRoles,
    } = useGetSuperAdminRolesQuery();
    const {
        data: permsData,
        isLoading: permsLoading,
        error: permsError,
        refetch: refetchPerms,
    } = useGetSuperAdminPermissionsQuery();

    const roles = rolesData?.data ?? [];
    const permissions = permsData?.data ?? [];

    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [draftIds, setDraftIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (selectedRoleId != null || roles.length === 0) return;
        const preferred =
            roles.find(role => role.code === "MANAGER") ?? roles[0];
        setSelectedRoleId(preferred.id);
    }, [roles, selectedRoleId]);

    const selectedRole: RestaurantRole | undefined = roles.find(
        role => role.id === selectedRoleId,
    );

    const {
        data: rolePerms,
        isLoading: rolePermsLoading,
        isFetching: rolePermsFetching,
        refetch: refetchRolePerms,
    } = useGetSuperAdminRolePermissionsQuery(selectedRoleId!, {
        skip: selectedRoleId == null,
    });

    const [setRolePermissions, { isLoading: saving }] =
        useSetSuperAdminRolePermissionsMutation();

    useEffect(() => {
        if (!rolePerms) return;
        setDraftIds(new Set(rolePerms.permissionIds));
    }, [rolePerms]);

    const byDomain = useMemo(() => {
        const map = new Map<string, typeof permissions>();
        for (const permission of permissions) {
            const list = map.get(permission.domain) ?? [];
            list.push(permission);
            map.set(permission.domain, list);
        }
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [permissions]);

    const editable = selectedRole?.editable ?? false;
    const dirty = useMemo(() => {
        if (!rolePerms) return false;
        const current = new Set(rolePerms.permissionIds);
        if (current.size !== draftIds.size) return true;
        for (const id of draftIds) {
            if (!current.has(id)) return true;
        }
        return false;
    }, [draftIds, rolePerms]);

    function togglePermission(id: number, checked: boolean) {
        if (!editable) return;
        setDraftIds(prev => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }

    async function handleSave() {
        if (selectedRoleId == null || !editable) return;
        try {
            await setRolePermissions({
                roleId: selectedRoleId,
                permissionIds: [...draftIds],
            }).unwrap();
            toast.success("Permissions updated for this role.");
        } catch (error) {
            const message =
                error &&
                typeof error === "object" &&
                "data" in error &&
                error.data &&
                typeof error.data === "object" &&
                "message" in error.data
                    ? String((error.data as { message: unknown }).message)
                    : "Could not save permissions.";
            toast.error(message);
        }
    }

    function handleReset() {
        if (!rolePerms) return;
        setDraftIds(new Set(rolePerms.permissionIds));
    }

    const loading = rolesLoading || permsLoading;
    const error = rolesError || permsError;

    if (loading) {
        return (
            <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading roles and permissions…
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-3 py-8">
                <p className="text-sm text-destructive">
                    Failed to load roles and permissions.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        void refetchRoles();
                        void refetchPerms();
                    }}
                >
                    <RefreshCw className="size-3.5" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="space-y-1">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Restaurant roles
                </p>
                {roles.map(role => {
                    const active = role.id === selectedRoleId;
                    return (
                        <button
                            key={role.id}
                            type="button"
                            onClick={() => setSelectedRoleId(role.id)}
                            className={cn(
                                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                                active
                                    ? "bg-foreground text-background"
                                    : "hover:bg-muted",
                            )}
                        >
                            <span>{role.name}</span>
                            {!role.editable ? (
                                <Shield className="size-3.5 opacity-70" />
                            ) : null}
                        </button>
                    );
                })}
            </aside>

            <section className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                        <h2 className="text-lg font-medium tracking-tight">
                            {selectedRole?.name ?? "Role"}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {selectedRole?.editable
                                ? "Toggle permissions for this role. Changes apply on the next request after save."
                                : "Owner has full access and cannot be changed here."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={rolePermsFetching}
                            onClick={() => void refetchRolePerms()}
                        >
                            <RefreshCw
                                className={cn(
                                    "size-3.5",
                                    rolePermsFetching && "animate-spin",
                                )}
                            />
                            Refresh
                        </Button>
                        {editable ? (
                            <>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={!dirty || saving}
                                    onClick={handleReset}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={!dirty || saving}
                                    onClick={() => void handleSave()}
                                >
                                    {saving ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : null}
                                    Save
                                </Button>
                            </>
                        ) : null}
                    </div>
                </div>

                {rolePermsLoading ? (
                    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Loading role permissions…
                    </div>
                ) : (
                    <div className="space-y-8">
                        {byDomain.map(([domain, items]) => (
                            <div key={domain} className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {domain}
                                </h3>
                                <ul className="grid gap-2 sm:grid-cols-2">
                                    {items.map(permission => {
                                        const checked = draftIds.has(
                                            permission.id,
                                        );
                                        return (
                                            <li
                                                key={permission.id}
                                                className={cn(
                                                    "flex items-start gap-3 rounded-md border border-transparent px-2 py-2",
                                                    editable &&
                                                        "hover:border-border/80 hover:bg-muted/40",
                                                )}
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    disabled={!editable}
                                                    onCheckedChange={value =>
                                                        togglePermission(
                                                            permission.id,
                                                            value === true,
                                                        )
                                                    }
                                                    id={`perm-${permission.id}`}
                                                    className="mt-0.5"
                                                />
                                                <label
                                                    htmlFor={`perm-${permission.id}`}
                                                    className={cn(
                                                        "min-w-0 cursor-pointer",
                                                        !editable &&
                                                            "cursor-default opacity-80",
                                                    )}
                                                >
                                                    <span className="block font-mono text-xs">
                                                        {permission.code}
                                                    </span>
                                                    {permission.description ? (
                                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                                            {
                                                                permission.description
                                                            }
                                                        </span>
                                                    ) : null}
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
