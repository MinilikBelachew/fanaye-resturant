import { redirectStationTab } from "@/domains/fulfillment/application/stationRedirect";

export default async function BaristaTabPage({
    params,
}: {
    params: Promise<{ tab: string; locale: string }>;
}) {
    const { tab, locale } = await params;
    return redirectStationTab("barista", tab, locale);
}
