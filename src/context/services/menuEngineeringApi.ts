import { api } from "./index";

export type MenuEngineeringQuadrant =
    | "STAR"
    | "PLOWHORSE"
    | "PUZZLE"
    | "DOG"
    | "UNCLASSIFIED";

export type MenuEngineeringTrendDirection = "RISING" | "FALLING" | "FLAT";

export type MenuEngineeringGranularity = "DAY" | "WEEK";

export interface MenuEngineeringTargets {
    targetFoodCostPercent: number;
    foodCostAlertPercent: number;
}

export interface MenuEngineeringBucket {
    start: string;
    label: string;
}

export interface MenuEngineeringRecipeLine {
    ingredientId: string;
    ingredientName: string;
    quantityPerServing: number;
    unit: string | null;
    baseUnit: string;
    costPerBaseUnit: number;
    costSource: "LEDGER" | "INGREDIENT";
    previousCostPerBaseUnit: number | null;
    costChangePercent: number | null;
    shrinkFactor: number;
    adjustedCostPerBaseUnit: number;
    lineCost: number | null;
    adjustedLineCost: number | null;
}

export interface MenuEngineeringCostDriver {
    ingredientId: string;
    ingredientName: string;
    cost: number;
    percentOfPlateCost: number;
}

export interface MenuEngineeringItem {
    menuItemId: string;
    name: string;
    categoryId: string | null;
    categoryName: string | null;
    stationName: string | null;
    isActive: boolean;
    hasRecipe: boolean;
    costComplete: boolean;
    costIssues: string[];
    price: number;
    plateCost: number | null;
    foodCostPercent: number | null;
    contributionMargin: number | null;
    contributionMarginPercent: number | null;
    quantitySold: number;
    menuMixPercent: number;
    revenue: number;
    totalContribution: number | null;
    quadrant: MenuEngineeringQuadrant;
    popularityIndex: number | null;
    marginIndex: number | null;
    previousQuantitySold: number;
    quantityTrendPercent: number | null;
    previousContributionMargin: number | null;
    marginTrendPercent: number | null;
    series: number[];
    firstHalfQuantity: number;
    secondHalfQuantity: number;
    momentum: MenuEngineeringTrendDirection;
    previousYearQuantitySold: number;
    yearOverYearTrendPercent: number | null;
    suggestedPrice: number | null;
    priceGapPercent: number | null;
    imageUrl: string | null;
    imageKey: string | null;
    foodCostAlert: boolean;
    topCostDriver: MenuEngineeringCostDriver | null;
    usageAdjustedPlateCost: number | null;
    varianceAdjustedMargin: number | null;
    varianceDeltaPercent: number | null;
    recipe: MenuEngineeringRecipeLine[];
}

export interface MenuEngineeringRankedItem {
    menuItemId: string;
    name: string;
    quantitySold: number;
    revenue: number;
}

export interface MenuEngineeringContributionItem {
    menuItemId: string;
    name: string;
    contributionMargin: number | null;
    totalContribution: number | null;
    foodCostPercent: number | null;
}

export interface MenuEngineeringCategory {
    categoryId: string | null;
    categoryName: string;
    itemCount: number;
    quantitySold: number;
    revenue: number;
    totalContribution: number;
}

export interface MenuEngineeringCostSpike {
    ingredientId: string;
    ingredientName: string;
    previousCost: number;
    latestCost: number;
    changePercent: number;
    affectedItemCount: number;
}

export interface MenuEngineeringVarianceItem {
    menuItemId: string;
    name: string;
    plateCost: number;
    adjustedPlateCost: number;
    deltaPercent: number;
}

export interface MenuEngineeringMeta {
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
    previousYearFrom: string;
    previousYearTo: string;
    branchId: string | null;
    branchName: string | null;
    currencyCode: string;
    itemCount: number;
    costedItemCount: number;
    recipeCoveragePercent: number;
    totalQuantitySold: number;
    totalRevenue: number;
    totalContribution: number;
    expectedPopularityPercent: number;
    averageContributionMargin: number;
    minQty: number;
    includeInactive: boolean;
    targets: MenuEngineeringTargets;
    foodCostAlertCount: number;
    granularity: MenuEngineeringGranularity;
    buckets: MenuEngineeringBucket[];
    usageVariancePercent: number;
    usageVarianceCost: number;
}

export interface MenuEngineeringSummary {
    quadrantCounts: Record<MenuEngineeringQuadrant, number>;
    fastestSellers: MenuEngineeringRankedItem[];
    slowestSellers: MenuEngineeringRankedItem[];
    topContributionItems: MenuEngineeringContributionItem[];
    worstContributionItems: MenuEngineeringContributionItem[];
    highestFoodCostItems: MenuEngineeringContributionItem[];
    byCategory: MenuEngineeringCategory[];
    costSpikes: MenuEngineeringCostSpike[];
    varianceAdjustedItems: MenuEngineeringVarianceItem[];
}

export interface MenuEngineeringResponse {
    meta: MenuEngineeringMeta;
    summary: MenuEngineeringSummary;
    items: MenuEngineeringItem[];
}

export interface MenuEngineeringQuery {
    from?: string;
    to?: string;
    branchId?: string;
    categoryId?: string;
    stationId?: string;
    includeInactive?: boolean;
    minQty?: number;
}

export interface UpdateMenuEngineeringTargetsInput {
    targetFoodCostPercent?: number;
    foodCostAlertPercent?: number;
}

export const menuEngineeringApi = api.injectEndpoints({
    endpoints: builder => ({
        getMenuEngineering: builder.query<
            MenuEngineeringResponse,
            MenuEngineeringQuery | void
        >({
            query: params => {
                const search = new URLSearchParams();
                Object.entries(params ?? {}).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        search.set(key, String(value));
                    }
                });
                const qs = search.toString();
                return {
                    url: `/admin/menu-engineering${qs ? `?${qs}` : ""}`,
                    method: "GET",
                };
            },
            providesTags: ["MenuEngineering"],
        }),
        getMenuEngineeringTargets: builder.query<MenuEngineeringTargets, void>({
            query: () => ({
                url: "/admin/menu-engineering/targets",
                method: "GET",
            }),
            providesTags: ["MenuEngineeringTargets"],
        }),
        updateMenuEngineeringTargets: builder.mutation<
            MenuEngineeringTargets,
            UpdateMenuEngineeringTargetsInput
        >({
            query: body => ({
                url: "/admin/menu-engineering/targets",
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["MenuEngineering", "MenuEngineeringTargets"],
        }),
    }),
});

export const {
    useGetMenuEngineeringQuery,
    useGetMenuEngineeringTargetsQuery,
    useUpdateMenuEngineeringTargetsMutation,
} = menuEngineeringApi;
