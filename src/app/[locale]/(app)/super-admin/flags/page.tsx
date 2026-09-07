import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { FEATURE_FLAGS } from "@/domains/tenancy/infrastructure/platformDemo";

export default function FlagsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Platform"
                title="Feature flags"
                description="TinaVerify is a platform advantage. Guest QR ordering stays off for this MVP."
            />
            <div className="overflow-hidden rounded-[16px] border border-hairline bg-white shadow-subtle">
                <ul>
                    {FEATURE_FLAGS.map(flag => (
                        <li
                            key={flag.key}
                            className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-4 last:border-0"
                        >
                            <div>
                                <p className="font-medium">{flag.name}</p>
                                <p className="text-[13px] text-slate-gray">
                                    {flag.scope} · {flag.key}
                                </p>
                            </div>
                            <Badge
                                variant={flag.enabled ? "success" : "secondary"}
                            >
                                {flag.enabled ? "On" : "Off"}
                            </Badge>
                        </li>
                    ))}
                </ul>
            </div>
        </DashboardFrame>
    );
}
