"use client";

import { useAppSelector } from "@/context/hooks";
import StationTicketActions from "@/domains/fulfillment/ui/StationTicketActions";
import TicketExtras from "@/domains/fulfillment/ui/TicketExtras";
import { homePathForRole } from "@/domains/identity/application/homePath";
import type { StationRole } from "@/domains/identity/domain/role";
import { stationIdForRole } from "@/domains/identity/domain/role";
import {
    displayStatus,
    isItemDelayed,
} from "@/domains/ordering/application/selectors";
import { STATION_STATUS_LABELS } from "@/domains/ordering/domain/order";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

export default function StationTicketDetail({
    role,
    itemId,
}: {
    role: StationRole;
    itemId: string;
}) {
    const stationId = stationIdForRole(role);
    const item = useAppSelector(state =>
        state.ops.items.find(entry => entry.id === itemId),
    );
    const sessions = useAppSelector(state => state.ops.sessions);
    const tables = useAppSelector(state => state.ops.tables);
    const home = homePathForRole(role);

    if (!item || item.stationId !== stationId) {
        return (
            <div>
                <Link href={home} className="text-[14px] text-brand">
                    ← Queue
                </Link>
                <h1 className="mt-3 text-[24px] font-semibold">
                    Ticket not found
                </h1>
                <p className="mt-2 text-slate-gray">
                    This order is not on this station, or it has already been
                    served.
                </p>
            </div>
        );
    }

    const session = sessions.find(entry => entry.id === item.sessionId);
    const table = tables.find(entry => entry.id === session?.tableId);
    const waiter = DEMO_STAFF.find(person => person.id === session?.waiterId);
    const delayed = isItemDelayed(item);
    const hasExtras =
        (item.modifiers?.length ?? 0) > 0 || Boolean(item.instruction?.trim());

    return (
        <div className="mx-auto max-w-2xl">
            <Link href={home} className="text-[14px] text-brand">
                ← Queue
            </Link>
            <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[13px] text-slate-gray">
                        Table {table?.number ?? "—"} ·{" "}
                        {waiter?.name ?? "Waiter"}
                    </p>
                    <h1 className="text-[32px] font-semibold">
                        {item.quantity}× {item.name}
                    </h1>
                </div>
                <span
                    className={cn(
                        "rounded-full px-3 py-1 text-[12px] font-medium",
                        item.status === "ready"
                            ? "bg-accent text-accent-foreground"
                            : delayed
                              ? "bg-destructive/10 text-destructive"
                              : "bg-secondary text-slate-gray",
                    )}
                >
                    {delayed && item.status !== "ready"
                        ? "Delayed"
                        : STATION_STATUS_LABELS[item.status]}
                </span>
            </div>

            <article className="mt-6 rounded-[16px] border border-hairline bg-card p-5 shadow-subtle">
                <p className="text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                    Order detail
                </p>
                {hasExtras ? (
                    <TicketExtras
                        modifiers={item.modifiers}
                        instruction={item.instruction}
                    />
                ) : (
                    <p className="mt-3 text-[14px] text-slate-gray">
                        As listed. No holds or extras.
                    </p>
                )}
                <dl className="mt-5 grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                        <dt className="text-slate-gray">Ticket</dt>
                        <dd className="font-medium">{item.id.slice(-8)}</dd>
                    </div>
                    <div>
                        <dt className="text-slate-gray">Price</dt>
                        <dd className="font-medium">
                            {formatEtb(item.unitPrice * item.quantity)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-slate-gray">Status</dt>
                        <dd className="font-medium">{displayStatus(item)}</dd>
                    </div>
                    <div>
                        <dt className="text-slate-gray">Prep time</dt>
                        <dd className="font-medium">
                            ~{item.expectedPreparationMinutes} min
                        </dd>
                    </div>
                </dl>
                {item.rejectReason ? (
                    <p className="mt-4 text-[13px] text-destructive">
                        {item.rejectReason}
                    </p>
                ) : null}
                <div className="mt-6">
                    <StationTicketActions item={item} />
                </div>
            </article>
        </div>
    );
}
