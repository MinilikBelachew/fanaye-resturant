"use client";

import AccountMenu from "@/components/layout/AccountMenu";
import StationTopBarTools from "@/components/layout/StationTopBarTools";
import { useSidebarUi } from "@/components/layout/SidebarUi";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import { navForRole } from "@/domains/identity/application/nav";
import { homePathForRole } from "@/domains/identity/application/homePath";
import { isStationRole } from "@/domains/identity/domain/role";
import { parseQueueFilter } from "@/domains/fulfillment/application/queueFilter";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useAppSelector } from "@/context/hooks";
import { usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

const headerClass =
    "flex h-12 w-full shrink-0 items-center gap-3 border-b border-black/[0.08] bg-white px-4 dark:border-white/[0.1] dark:bg-background md:px-6";

export default function AppTopBar({ className }: { className?: string }) {
    return (
        <Suspense
            fallback={<header className={cn(headerClass, className)} />}
        >
            <AppTopBarInner className={className} />
        </Suspense>
    );
}

function AppTopBarInner({ className }: { className?: string }) {
    const staff = useAppSelector(selectCurrentStaff);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toggle } = useSidebarUi();
    const home = staff ? homePathForRole(staff.role) : "/";
    const sections = staff ? navForRole(staff.role) : [];
    const items = sections.flatMap(section => section.items);
    const isOrderDetail = pathname.includes("/orders/");
    const status = parseQueueFilter(searchParams.get("status"));
    const current =
        items.find(item => {
            if (item.filter) {
                if (isOrderDetail || pathname !== home) return false;
                return item.filter === status;
            }
            return (
                pathname === item.href ||
                (item.href !== home &&
                    !item.href.endsWith("/orders") &&
                    pathname.startsWith(`${item.href}/`))
            );
        }) ?? items.find(item => item.href === home || item.filter === "all");
    const title = isOrderDetail
        ? "Order detail"
        : (current?.label ?? "Dashboard");
    const stationQueue =
        staff && isStationRole(staff.role) && pathname === home;

    return (
        <header className={cn(headerClass, className)}>
            <button
                type="button"
                aria-label="Toggle sidebar"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-foreground/80 hover:bg-secondary"
                onClick={toggle}
            >
                <PanelLeft className="size-4" />
            </button>
            <h1 className="min-w-0 truncate text-[15px] font-medium tracking-tight">
                {title}
            </h1>
            {stationQueue ? (
                <StationTopBarTools
                    notify={false}
                    className="hidden min-w-0 max-w-md flex-1 md:flex"
                />
            ) : null}
            <div className="ml-auto flex shrink-0 items-center gap-1">
                {stationQueue ? (
                    <StationTopBarTools search={false} />
                ) : null}
                <ThemeToggleButton />
                <AccountMenu compact />
            </div>
        </header>
    );
}
