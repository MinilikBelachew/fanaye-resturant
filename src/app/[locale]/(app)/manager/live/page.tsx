import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import LiveFloorBoard from "@/domains/floor/ui/LiveFloorBoard";
import { getTranslations } from "next-intl/server";

export default async function ManagerLivePage() {
    const t = await getTranslations("liveOps");

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={t("eyebrow")}
                title={t("title")}
                description={t("description")}
            />
            <LiveFloorBoard />
        </DashboardFrame>
    );
}
