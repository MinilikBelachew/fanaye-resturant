"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
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

export default function DesktopSidebar({ className }: { className?: string }) {
    const staff = useAppSelector(selectCurrentStaff);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const tTopBar = useTranslations("topbar");
    const { collapsed } = useSidebarUi();
    const { counts: liveCounts } = useCurrentStationQueue();
    const counts = staff && isStationRole(staff.role) ? liveCounts : null;
    if (!staff) return null;
    const sections = navForRole(staff.role);

    async function logOut() {
        await performSignOut(dispatch);
        router.push("/sign-in");
    }

    return (
        <aside
            className={cn(
                "flex h-svh shrink-0 flex-col bg-background p-3",
                collapsed ? "w-[88px]" : "w-[270px]",
                className,
            )}
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-muted/50 shadow-sm dark:bg-card">
                <div
                    className={cn(
                        "flex shrink-0 flex-col",
                        collapsed ? "items-center px-2.5 pt-4" : "px-4 pt-4",
                    )}
                >
                    <RoleSwitcher compact={collapsed} />
                </div>

                <SidebarNav
                    collapsed={collapsed}
                    sections={sections}
                    badges={counts ?? undefined}
                />

                <div
                    className={cn(
                        "mt-auto shrink-0 border-t border-border",
                        collapsed ? "flex justify-center p-2.5" : "p-3",
                    )}
                >
                    <button
                        type="button"
                        title={tTopBar("logOut")}
                        aria-label={tTopBar("logOut")}
                        className={cn(
                            "flex items-center gap-3 rounded-full text-[13px] text-foreground/80 transition-colors",
                            "hover:bg-background/70 hover:text-destructive",
                            collapsed
                                ? "size-10 justify-center"
                                : "h-9 w-full px-3",
                        )}
                        onClick={logOut}
                    >
                        <LogOut className="size-4 shrink-0 text-muted-foreground" />
                        {collapsed ? null : <span>{tTopBar("logOut")}</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
