"use client";

import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { useAppSelector } from "@/context/hooks";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";
import { PAYMENT_METHOD_LABELS } from "@/domains/payments/domain/payment";
import { selectLoggedPayments } from "@/domains/payments/application/selectors";
import { formatEtb } from "@/lib/money";

export default function CashierClosedPage() {
    const logged = useAppSelector(selectLoggedPayments);

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Close"
                title="Closed bills"
                description="Closed tables from waiter collections. Reopen needs manager approval."
            />
            <div className="overflow-hidden rounded-[16px] border border-hairline bg-white shadow-subtle">
                {logged.length === 0 ? (
                    <p className="px-6 py-8 text-[14px] text-slate-gray">
                        No closed bills yet. They appear when a waiter collects
                        the total.
                    </p>
                ) : (
                    <table className="w-full text-left text-[14px]">
                        <thead className="border-b border-hairline text-[12px] tracking-[0.06em] text-slate-gray uppercase">
                            <tr>
                                <th className="px-6 py-3 font-medium">
                                    Table
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Waiter
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Total
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Method
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {logged.map(payment => {
                                const waiter = DEMO_STAFF.find(
                                    person => person.id === payment.waiterId,
                                );
                                return (
                                    <tr
                                        key={payment.id}
                                        className="border-b border-hairline last:border-0"
                                    >
                                        <td className="px-6 py-3 font-medium">
                                            {payment.tableNumber}
                                        </td>
                                        <td className="px-6 py-3">
                                            {waiter?.name ?? "Waiter"}
                                        </td>
                                        <td className="px-6 py-3">
                                            {formatEtb(payment.amount)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <Badge>
                                                {
                                                    PAYMENT_METHOD_LABELS[
                                                        payment.method
                                                    ]
                                                }
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardFrame>
    );
}
