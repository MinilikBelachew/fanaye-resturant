"use client";

import { LogOut } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { signOutDemo } from "@/context/slices/identitySlice";
import SidebarNav from "@/components/layout/SidebarNav";
import { navForRole } from "@/domains/identity/application/nav";
import RoleSwitcher from "@/domains/identity/ui/RoleSwitcher";
import {
    selectCurrentStaff,
    selectUnreadReadyCount,
} from "@/domains/ordering/application/selectors";
import { useRouter } from "@/i18n/navigation";

export default function WaiterNavPanel({
    onNavigate,
    collapsed = false,
}: {
    onNavigate?: () => void;
    collapsed?: boolean;
}) {
    const staff = useAppSelector(selectCurrentStaff);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const unread = useAppSelector(state =>
        staff ? selectUnreadReadyCount(state, staff.id) : 0,
    );
    if (!staff) return null;

    const extraBadges: Record<string, number> =
        unread > 0 ? { "/waiter/notifications": unread } : {};

    function logOut() {
        dispatch(signOutDemo());
        router.push("/sign-in");
    }

    if (collapsed) {
        return (
            <div className="flex h-full w-full flex-col bg-white dark:bg-card">
                <div className="flex justify-center py-3">
                    <RoleSwitcher compact />
                </div>
                <SidebarNav
                    collapsed
                    sections={navForRole("waiter")}
                    extraBadges={extraBadges}
                    onNavigate={onNavigate}
                />
                <div className="mt-auto flex justify-center border-t border-hairline py-3">
                    <button
                        type="button"
                        title="Log out"
                        aria-label="Log out"
                        className="flex size-10 items-center justify-center rounded-full text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                        onClick={logOut}
                    >
                        <LogOut className="size-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[20px] border border-hairline bg-white dark:bg-card shadow-none">
            <div className="shrink-0 border-b border-dashed border-hairline p-3">
                <p className="px-2 pb-2 text-[15px] font-semibold tracking-tight">
                    Fanaye
                </p>
                <RoleSwitcher />
            </div>
            <SidebarNav
                sections={navForRole("waiter")}
                extraBadges={extraBadges}
                onNavigate={onNavigate}
            />
            <div className="shrink-0 border-t border-dashed border-hairline p-3">
                <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-[14px] text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                    onClick={logOut}
                >
                    <LogOut className="size-4" />
                    Log out
                </button>
            </div>
        </div>
    );
}
