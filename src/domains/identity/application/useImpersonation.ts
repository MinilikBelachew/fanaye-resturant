"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { api } from "@/context/services";
import { authApi } from "@/context/services/authApi";
import {
    type ImpersonateSessionPayload,
    useImpersonateSuperAdminSessionMutation,
} from "@/context/services/superAdminApi";
import {
    startImpersonation,
    stopImpersonation,
} from "@/context/slices/identitySlice";
import { homePathForRole } from "@/domains/identity/application/homePath";
import { mapRoleCodeToRole } from "@/domains/identity/application/mapAuthToStaff";
import { usePathname, useRouter } from "@/i18n/navigation";
import { toast } from "@/lib/toast";

export function useImpersonation() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const session = useAppSelector(state => state.identity.session);
    const impersonation = useAppSelector(state => state.identity.impersonation);
    const [triggerImpersonate, { isLoading: isStarting }] =
        useImpersonateSuperAdminSessionMutation();
    const [isExiting, setIsExiting] = useState(false);

    const isImpersonating = Boolean(impersonation || session?.impersonatedBy);

    async function impersonate(
        payload: ImpersonateSessionPayload & { returnTo?: string },
    ) {
        try {
            const returnTo =
                payload.returnTo || pathname || "/super-admin/tenants";
            const result = await triggerImpersonate({
                membershipId: payload.membershipId,
                tenantId: payload.tenantId,
                targetRole: payload.targetRole,
                branchId: payload.branchId,
            }).unwrap();

            dispatch(api.util.resetApiState());
            dispatch(
                startImpersonation({
                    token: result.token,
                    tokenExpires: result.tokenExpires,
                    context: result.context,
                    returnTo,
                }),
            );

            const targetRole = mapRoleCodeToRole(
                result.context.roleCode,
                result.context.stationCode,
            );
            const destination = homePathForRole(targetRole);
            toast.success(
                `Viewing as ${result.context.displayName} (${result.context.tenantName || result.context.branchName || result.context.roleCode})`,
            );
            router.push(destination);
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ||
                "Failed to start impersonation session.";
            toast.error(msg);
        }
    }

    async function exitImpersonation() {
        if (isExiting) return;
        setIsExiting(true);
        const returnTo = impersonation?.returnTo || "/super-admin/tenants";
        try {
            dispatch(stopImpersonation());
            dispatch(api.util.resetApiState());
            await dispatch(authApi.endpoints.refresh.initiate()).unwrap();
            await dispatch(
                authApi.endpoints.me.initiate(undefined, {
                    forceRefetch: true,
                }),
            ).unwrap();
            toast.success("Returned to Super Admin session.");
            router.push(returnTo);
        } catch {
            toast.error("Failed to restore session. Please sign in again.");
            router.push("/sign-in");
        } finally {
            setIsExiting(false);
        }
    }

    return {
        isImpersonating,
        impersonation,
        session,
        isStarting,
        isExiting,
        impersonate,
        exitImpersonation,
    };
}
