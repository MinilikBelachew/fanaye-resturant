"use client";

import { useAppSelector } from "@/context/hooks";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";
import {
    selectBillRequestSessions,
    selectSessionDue,
} from "@/domains/payments/application/selectors";
import { formatEtb } from "@/lib/money";

export default function CashierBillRequests() {
    const billRequests = useAppSelector(selectBillRequestSessions);
    const tables = useAppSelector(state => state.ops.tables);
    const state = useAppSelector(entry => entry);

    if (billRequests.length === 0) {
        return (
            <p className="rounded-[16px] border border-hairline bg-card p-5 text-slate-gray">
                No open bill requests. After a waiter requests the bill, it
                shows here until they collect the total.
            </p>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {billRequests.map(session => {
                const table = tables.find(
                    entry => entry.id === session.tableId,
                );
                const waiter = DEMO_STAFF.find(
                    person => person.id === session.waiterId,
                );
                const due = selectSessionDue(state, session.id);
                return (
                    <article
                        key={session.id}
                        className="rounded-[16px] border border-hairline bg-card p-5"
                    >
                        <p className="text-[13px] text-slate-gray">
                            Table {table?.number ?? "—"} ·{" "}
                            {waiter?.name ?? "Waiter"}
                        </p>
                        <p className="text-[20px] font-semibold">
                            {formatEtb(due)}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            Waiting for the waiter to collect this total.
                        </p>
                    </article>
                );
            })}
        </div>
    );
}
