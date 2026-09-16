import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";

export default async function OwnerSettingsPage() {
    const tSettings = await getTranslations("settings");
    const tNav = await getTranslations("appNav");

    const settingsList = [
        { name: tSettings("currency"), value: "ETB" },
        { name: tSettings("timezone"), value: "Africa/Addis_Ababa" },
        {
            name: tSettings("waiterCollects"),
            value: tSettings("waiterCollectsDesc"),
        },
        { name: tSettings("tinaVerify"), value: tSettings("tinaVerifyDesc") },
        { name: tSettings("stations"), value: tSettings("stationsDesc") },
    ];

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow={tNav("business")}
                title={tSettings("title")}
                description={tSettings("description")}
            />
            <ul className="overflow-hidden rounded-[16px] border border-hairline bg-card shadow-subtle">
                {settingsList.map(row => (
                    <li
                        key={row.name}
                        className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-4 last:border-0"
                    >
                        <span className="font-medium text-foreground">
                            {row.name}
                        </span>
                        <Badge variant="secondary">{row.value}</Badge>
                    </li>
                ))}
            </ul>
        </DashboardFrame>
    );
}
