import { redirectStationTab } from "@/domains/fulfillment/application/stationRedirect";

export default async function KitchenTabPage({
    params,
}: {
    params: Promise<{ tab: string; locale: string }>;
}) {
    const { tab, locale } = await params;
    return redirectStationTab("kitchen", tab, locale);
}
