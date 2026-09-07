"use client";

import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    markAllNotificationsRead,
    markItemServed,
    markNotificationRead,
} from "@/context/slices/opsSlice";
import {
    selectCurrentStaff,
    selectUnreadReadyCount,
} from "@/domains/ordering/application/selectors";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function WaiterNotifications() {
    const staff = useAppSelector(selectCurrentStaff);
    const dispatch = useAppDispatch();
    const notes = useAppSelector(state =>
        state.ops.notifications.filter(
            note => note.waiterId === staff?.id,
        ),
    );
    const unread = useAppSelector(state =>
        staff ? selectUnreadReadyCount(state, staff.id) : 0,
    );

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-[24px] font-semibold">
                        Ready alerts
                    </h1>
                    <p className="text-[14px] text-slate-gray">
                        Stations notify you when food or drinks are ready.
                    </p>
                </div>
                {unread > 0 && staff ? (
                    <button
                        type="button"
                        className="text-[13px] font-medium text-brand"
                        onClick={() =>
                            dispatch(markAllNotificationsRead(staff.id))
                        }
                    >
                        Mark all read
                    </button>
                ) : null}
            </div>
            {notes.length === 0 ? (
                <p className="rounded-[16px] border border-hairline bg-white p-6 text-slate-gray">
                    No ready alerts yet. Send an order, then mark it ready
                    from Kitchen, Barista, Cakes, or Soft Drinks.
                </p>
            ) : (
                <ul className="space-y-3">
                    {notes.map(note => (
                        <li
                            key={note.id}
                            className="rounded-[16px] border border-hairline bg-white p-4"
                        >
                            <p className="font-medium">{note.title}</p>
                            <p className="text-[14px] text-slate-gray">
                                {note.body}
                            </p>
                            <div className="mt-3 flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        dispatch(markItemServed(note.itemId));
                                        dispatch(
                                            markNotificationRead(note.id),
                                        );
                                    }}
                                >
                                    Mark served
                                </Button>
                                <Link
                                    href={`/waiter/tables/${note.tableId}`}
                                    className="inline-flex h-8 items-center rounded-[48px] border border-hairline px-3 text-sm font-medium"
                                    onClick={() =>
                                        dispatch(
                                            markNotificationRead(note.id),
                                        )
                                    }
                                >
                                    Open table
                                </Link>
                            </div>
                            {!note.read ? (
                                <p className="mt-2 text-[12px] text-brand">
                                    New
                                </p>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
