import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { PLATFORM_AUDIT } from "@/domains/tenancy/infrastructure/platformDemo";

export default function PlatformAuditPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Trust"
                title="Platform audit"
                description="Provisioning, plan changes, and support sessions. Floor tickets stay on the tenant."
            />
            <ol className="space-y-3">
                {PLATFORM_AUDIT.map(event => (
                    <li
                        key={`${event.at}-${event.action}`}
                        className="rounded-[16px] border border-hairline bg-white px-5 py-4 shadow-subtle"
                    >
                        <p className="text-[12px] text-steel-gray">
                            {event.at}
                        </p>
                        <p className="mt-1 font-medium">{event.action}</p>
                        <p className="text-[13px] text-slate-gray">
                            {event.actor}
                        </p>
                    </li>
                ))}
            </ol>
        </DashboardFrame>
    );
}
