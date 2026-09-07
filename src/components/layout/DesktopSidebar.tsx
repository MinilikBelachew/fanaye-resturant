"use client";

import { LogOut } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { signOutDemo } from "@/context/slices/identitySlice";
import SidebarNav from "@/components/layout/SidebarNav";
import { useSidebarUi } from "@/components/layout/SidebarUi";
import { navForRole } from "@/domains/identity/application/nav";
import { isStationRole } from "@/domains/identity/domain/role";
import { stationIdForRole } from "@/domains/identity/domain/role";
import RoleSwitcher from "@/domains/identity/ui/RoleSwitcher";
import {
    selectCurrentStaff,
    selectStationQueueCounts,
} from "@/domains/ordering/application/selectors";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function DesktopSidebar({
    className,
}: {
    className?: string;
}) {
    const staff = useAppSelector(selectCurrentStaff);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { collapsed } = useSidebarUi();
    const counts = useAppSelector(state =>
        staff && isStationRole(staff.role)
            ? selectStationQueueCounts(state, stationIdForRole(staff.role))
            : null,
    );
    if (!staff) return null;
    const sections = navForRole(staff.role);

    function logOut() {
        dispatch(signOutDemo());
        router.push("/sign-in");
    }

    if (collapsed) {
        return (
            <aside
                className={cn(
                    "flex h-svh w-16 shrink-0 flex-col border-r border-hairline bg-white dark:bg-card",
                    className,
                )}
            >
                <div className="flex justify-center py-3">
                    <RoleSwitcher compact />
                </div>
                <SidebarNav
                    collapsed
                    sections={sections}
                    badges={counts ?? undefined}
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
            </aside>
        );
    }

    return (
        <aside
            className={cn(
                "flex h-svh w-[280px] shrink-0 flex-col p-3 bg-white dark:bg-background",
                className,
            )}
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-hairline bg-white dark:bg-card shadow-none">
                <div className="shrink-0 border-b border-dashed border-hairline p-3">
                    <p className="px-2 pb-2 text-[15px] font-semibold tracking-tight">
                        Fanaye
                    </p>
                    <RoleSwitcher />
                </div>
                <SidebarNav
                    sections={sections}
                    badges={counts ?? undefined}
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
        </aside>
    );
}
