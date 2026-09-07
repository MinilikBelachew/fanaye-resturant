import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { SUPPORT_TICKETS } from "@/domains/tenancy/infrastructure/platformDemo";

export default function SupportPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Trust"
                title="Authorized support"
                description="Support mode is required before anyone on the platform inspects a tenant floor."
            />
            <div className="overflow-hidden rounded-[16px] border border-hairline bg-white shadow-subtle">
                <table className="w-full text-left text-[14px]">
                    <thead className="border-b border-hairline text-[12px] tracking-[0.06em] text-slate-gray uppercase">
                        <tr>
                            <th className="px-6 py-3 font-medium">Ticket</th>
                            <th className="px-6 py-3 font-medium">Tenant</th>
                            <th className="px-6 py-3 font-medium">Topic</th>
                            <th className="px-6 py-3 font-medium">Priority</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {SUPPORT_TICKETS.map(ticket => (
                            <tr
                                key={ticket.id}
                                className="border-b border-hairline last:border-0"
                            >
                                <td className="px-6 py-3 font-medium">
                                    {ticket.id}
                                </td>
                                <td className="px-6 py-3">{ticket.tenant}</td>
                                <td className="px-6 py-3 text-slate-gray">
                                    {ticket.topic}
                                </td>
                                <td className="px-6 py-3">
                                    <Badge
                                        variant={
                                            ticket.priority === "High"
                                                ? "warning"
                                                : "secondary"
                                        }
                                    >
                                        {ticket.priority}
                                    </Badge>
                                </td>
                                <td className="px-6 py-3">
                                    <Badge
                                        variant={
                                            ticket.status === "Resolved"
                                                ? "success"
                                                : "default"
                                        }
                                    >
                                        {ticket.status}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardFrame>
    );
}
