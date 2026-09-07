import { redirectStationTab } from "@/domains/fulfillment/application/stationRedirect";

export default async function CakesTabPage({
    params,
}: {
    params: Promise<{ tab: string; locale: string }>;
}) {
    const { tab, locale } = await params;
    return redirectStationTab("cakes", tab, locale);
}
