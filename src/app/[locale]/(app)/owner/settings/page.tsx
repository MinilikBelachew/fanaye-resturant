import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";

const SETTINGS = [
    { name: "Currency", value: "ETB" },
    { name: "Timezone", value: "Africa/Addis_Ababa" },
    { name: "Waiter collects", value: "On · default house flow" },
    { name: "TinaVerify", value: "Required on transfer" },
    { name: "Stations", value: "Kitchen, Barista, Cakes, Soft Drinks" },
];

export default function OwnerSettingsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Business"
                title="Settings"
                description="Tenant policies. Floor staff cannot edit these."
            />
            <ul className="overflow-hidden rounded-[16px] border border-hairline bg-white shadow-subtle">
                {SETTINGS.map(row => (
                    <li
                        key={row.name}
                        className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-4 last:border-0"
                    >
                        <span className="font-medium">{row.name}</span>
                        <Badge variant="secondary">{row.value}</Badge>
                    </li>
                ))}
            </ul>
        </DashboardFrame>
    );
}
