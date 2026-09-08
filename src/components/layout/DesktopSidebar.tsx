"use client";

import { LogOut } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { performSignOut } from "@/domains/identity/application/signOut";
import SidebarNav from "@/components/layout/SidebarNav";
import { useSidebarUi } from "@/components/layout/SidebarUi";
import { navForRole } from "@/domains/identity/application/nav";
import { isStationRole } from "@/domains/identity/domain/role";
import { useCurrentStationQueue } from "@/domains/fulfillment/application/useCurrentStationQueue";
import RoleSwitcher from "@/domains/identity/ui/RoleSwitcher";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
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
    const { counts: liveCounts } = useCurrentStationQueue();
    const counts =
        staff && isStationRole(staff.role) ? liveCounts : null;
    if (!staff) return null;
    const sections = navForRole(staff.role);

    async function logOut() {
        await performSignOut(dispatch);
        router.push("/sign-in");
    }

    if (collapsed) {
        return (
            <aside
                className={cn(
                    "flex h-svh w-16 shrink-0 flex-col border-r border-border/80 bg-card py-3",
                    className,
                )}
            >
                <div className="flex justify-center pb-3 border-b border-border/60">
                    <RoleSwitcher compact />
                </div>
                <SidebarNav
                    collapsed
                    sections={sections}
                    badges={counts ?? undefined}
                />
                <div className="mt-auto flex justify-center border-t border-border/60 pt-3">
                    <button
                        type="button"
                        title="Log out"
                        aria-label="Log out"
                        className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border hover:border-destructive/20 transition-colors"
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
                "flex h-svh w-[270px] shrink-0 flex-col p-3 bg-background",
                className,
            )}
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-border/80 bg-card shadow-sm">
                
                {/* User & Role Capsule */}
                <div className="shrink-0 p-3 border-b border-border/60">
                    <RoleSwitcher />
                </div>

                {/* Navigation Tree */}
                <SidebarNav
                    sections={sections}
                    badges={counts ?? undefined}
                />

                {/* Footer Actions */}
                <div className="shrink-0 border-t border-border/60 p-3">
                    <button
                        type="button"
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border hover:border-destructive/20 border border-transparent transition-all duration-150"
                        onClick={logOut}
                    >
                        <LogOut className="size-4 shrink-0" />
                        <span>Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
