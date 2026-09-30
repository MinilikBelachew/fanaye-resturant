"use client";

import { CookingPot, User, Utensils } from "lucide-react";
import { useFloorTablesQuery } from "@/context/services/floorApi";
import { tableNumber } from "@/domains/floor/application/groupFloor";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { LiveFloorSkeleton } from "@/components/custom/molecules/Skeletons";
import { Link, usePathname } from "@/i18n/navigation";

export default function LiveFloorBoard() {
    const tWaiter = useTranslations("waiter");
    const tCommon = useTranslations("common");
    const pathname = usePathname();
    const basePath = pathname.startsWith("/owner/")
        ? "/owner/live"
        : "/manager/live";

    const { data, isLoading } = useFloorTablesQuery(undefined, {
        pollingInterval: 8000,
    });
    const open = (data?.data ?? []).filter(table => table.tableSessionId);

    if (isLoading) {
        return <LiveFloorSkeleton />;
    }

    if (open.length === 0) {
        return (
            <div className="rounded-[16px] border border-hairline bg-card p-6 text-center text-slate-gray">
                <Utensils className="mx-auto mb-2 size-6 text-slate-400" />
                <p className="text-[14px] font-medium text-foreground">
                    {tWaiter("noActiveSessions")}
                </p>
                <p className="mt-0.5 text-[12px]">{tWaiter("allTablesFree")}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {open.map(table => (
                <Link
                    key={table.tableId}
                    href={`${basePath}/${table.tableId}`}
                    className={cn(
                        "flex flex-col justify-between rounded-[16px] border p-4 transition-colors hover:border-primary/50 hover:bg-accent/30",
                        table.mine
                            ? "border-primary/40 bg-accent/40"
                            : "border-amber-200 bg-amber-50/20",
                    )}
                >
                    <div>
                        <p className="text-[12px] font-medium text-slate-gray">
                            {tCommon("table")}
                        </p>
                        <h2 className="text-[24px] font-bold leading-tight">
                            {tableNumber(table)}
                        </h2>
                        <p className="mt-1 text-[12px] text-slate-gray">
                            {table.locationName}
                        </p>
                    </div>
                    <div className="mt-3 space-y-1 text-[13px]">
                        <p className="flex items-center gap-1.5">
                            <User className="size-3.5" />
                            {table.waiterName ?? tCommon("waiter")}
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-gray">
                            <CookingPot className="size-3.5" />
                            {table.cookingItemCount} {tWaiter("cooking")} ·{" "}
                            {table.readyItemCount} {tWaiter("readyCount")}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
