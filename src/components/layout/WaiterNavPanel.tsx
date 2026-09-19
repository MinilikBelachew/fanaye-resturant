"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { useWaiterTablesQuery } from "@/context/services/floorApi";
import { performSignOut } from "@/domains/identity/application/signOut";
import SidebarNav from "@/components/layout/SidebarNav";
import { navForRole } from "@/domains/identity/application/nav";
import RoleSwitcher from "@/domains/identity/ui/RoleSwitcher";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
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
    const tTopBar = useTranslations("topbar");
    const { data: floor } = useWaiterTablesQuery("my", {
        skip: !staff,
        pollingInterval: 5000,
    });
    const readyCount =
        floor?.data.reduce((sum, table) => sum + table.readyItemCount, 0) ?? 0;
    if (!staff) return null;

    const extraBadges: Record<string, number> =
        readyCount > 0 ? { "/waiter/ready": readyCount } : {};

    async function logOut() {
        await performSignOut(dispatch);
        router.push("/sign-in");
    }

    if (collapsed) {
        return (
            <div className="flex h-full w-full flex-col bg-card py-3">
                <div className="flex justify-center pb-3 border-b border-border/60">
                    <RoleSwitcher compact />
                </div>
                <SidebarNav
                    collapsed
                    sections={navForRole("waiter")}
                    extraBadges={extraBadges}
                    onNavigate={onNavigate}
                />
                <div className="mt-auto flex justify-center border-t border-border/60 pt-3">
                    <button
                        type="button"
                        title={tTopBar("logOut")}
                        aria-label={tTopBar("logOut")}
                        className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border hover:border-destructive/20 transition-colors"
                        onClick={logOut}
                    >
                        <LogOut className="size-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-border/80 bg-card shadow-sm">
            <div className="shrink-0 p-3 border-b border-border/60">
                <RoleSwitcher />
            </div>
            <SidebarNav
                sections={navForRole("waiter")}
                extraBadges={extraBadges}
                onNavigate={onNavigate}
            />
            <div className="shrink-0 border-t border-border/60 p-3">
                <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border hover:border-destructive/20 border border-transparent transition-all duration-150"
                    onClick={logOut}
                >
                    <LogOut className="size-4 shrink-0" />
                    <span>{tTopBar("logOut")}</span>
                </button>
            </div>
        </div>
    );
}
