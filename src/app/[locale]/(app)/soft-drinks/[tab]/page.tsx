import { redirectStationTab } from "@/domains/fulfillment/application/stationRedirect";

export default async function SoftDrinksTabPage({
    params,
}: {
    params: Promise<{ tab: string; locale: string }>;
}) {
    const { tab, locale } = await params;
    return redirectStationTab("soft_drinks", tab, locale);
}
