"use client";

import { useWaiterTablesQuery } from "@/context/services/floorApi";
import { useTableSessionOrdersQuery } from "@/context/services/ordersApi";
import type { FloorTable } from "@/domains/floor/domain/floorApi";
import { tableNumber } from "@/domains/floor/application/groupFloor";
import WaiterMarkServedButton from "@/domains/floor/ui/WaiterMarkServedButton";
import { Link } from "@/i18n/navigation";

function ReadyTableBlock({ table }: { table: FloorTable }) {
    const sessionId = table.tableSessionId ?? "";
    const { data, isLoading, isError } = useTableSessionOrdersQuery(sessionId, {
        skip: !sessionId,
        pollingInterval: 5000,
    });
    const readyItems =
        data?.data.flatMap(order =>
            order.items.filter(item => item.state === "READY"),
        ) ?? [];

    return (
        <li className="rounded-[16px] border border-hairline bg-white p-4 dark:bg-card">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-medium">
                        Table {tableNumber(table)} · {table.locationName}
                    </p>
                    <p className="text-[14px] text-slate-gray">
                        {table.readyItemCount} ready to run
                    </p>
                </div>
                <Link
                    href={`/waiter/tables/${table.tableId}`}
                    className="inline-flex h-8 items-center rounded-[48px] border border-hairline px-3 text-sm font-medium"
                >
                    Open table
                </Link>
            </div>
            {isLoading ? (
                <p className="mt-3 text-[13px] text-slate-gray">
                    Loading tickets…
                </p>
            ) : null}
            {isError ? (
                <p className="mt-3 text-[13px] text-red-600">
                    Could not load ready tickets.
                </p>
            ) : null}
            {readyItems.length > 0 ? (
                <ul className="mt-3 space-y-2 border-t border-hairline pt-3">
                    {readyItems.map(item => (
                        <li
                            key={item.orderItemId}
                            className="flex items-center justify-between gap-3"
                        >
                            <div className="min-w-0">
                                <p className="text-[14px] font-medium">
                                    {item.quantity}× {item.itemName}
                                </p>
                                <p className="text-[12px] text-slate-gray">
                                    {item.stationName}
                                </p>
                            </div>
                            <WaiterMarkServedButton
                                item={item}
                                tableSessionId={sessionId}
                            />
                        </li>
                    ))}
                </ul>
            ) : null}
        </li>
    );
}

export default function WaiterNotifications() {
    const { data, isLoading, isError } = useWaiterTablesQuery("my", {
        pollingInterval: 5000,
    });
    const readyTables =
        data?.data.filter(
            table =>
                Boolean(table.tableSessionId) && table.readyItemCount > 0,
        ) ?? [];
    const readyCount = readyTables.reduce(
        (sum, table) => sum + table.readyItemCount,
        0,
    );

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-[24px] font-semibold">Ready alerts</h1>
                <p className="text-[14px] text-slate-gray">
                    Stations notify you when food or drinks are ready to run.
                </p>
            </div>
            {isLoading ? (
                <p className="text-slate-gray">Loading ready tickets…</p>
            ) : null}
            {isError ? (
                <p className="text-red-600">Could not load ready alerts.</p>
            ) : null}
            {!isLoading && !isError && readyTables.length === 0 ? (
                <p className="rounded-[16px] border border-hairline bg-white p-6 text-slate-gray dark:bg-card">
                    No ready tickets yet. When Kitchen, Barista, Cakes, or Soft
                    Drinks marks something ready, it shows up here.
                </p>
            ) : null}
            {readyTables.length > 0 ? (
                <>
                    <p className="mb-3 text-[13px] font-medium text-brand">
                        {readyCount} dish{readyCount === 1 ? "" : "es"} waiting
                    </p>
                    <ul className="space-y-3">
                        {readyTables.map(table => (
                            <ReadyTableBlock
                                key={table.tableId}
                                table={table}
                            />
                        ))}
                    </ul>
                </>
            ) : null}
        </div>
    );
}
