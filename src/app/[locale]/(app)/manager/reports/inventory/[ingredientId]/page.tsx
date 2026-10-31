import IngredientDetailPage from "@/domains/finance/ui/IngredientDetailPage";

export default async function ManagerIngredientReportDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ ingredientId: string }>;
    searchParams?: Promise<{ period?: string; from?: string; to?: string }>;
}) {
    const resolvedSearch = searchParams ? await searchParams : {};
    const qs = new URLSearchParams();
    qs.set("section", "inventory");
    if (resolvedSearch.period) qs.set("period", resolvedSearch.period);
    if (resolvedSearch.from) qs.set("from", resolvedSearch.from);
    if (resolvedSearch.to) qs.set("to", resolvedSearch.to);

    return (
        <IngredientDetailPage
            params={params}
            searchParams={searchParams}
            audience="manager"
            backHref={`/manager/reports?${qs.toString()}`}
        />
    );
}
