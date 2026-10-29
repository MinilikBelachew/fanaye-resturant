export type UnitFamily = "mass" | "volume" | "count";

/** Mirrors the backend built-in factor map (see backend src/inventory/units.ts). */
export const BUILT_IN_UNIT_FACTORS: Record<
    string,
    { family: UnitFamily; factor: number }
> = {
    kg: { family: "mass", factor: 1 },
    g: { family: "mass", factor: 0.001 },
    L: { family: "volume", factor: 1 },
    ml: { family: "volume", factor: 0.001 },
    pcs: { family: "count", factor: 1 },
    dozen: { family: "count", factor: 12 },
};

export type TenantConversionRow = {
    fromUnit: string;
    toUnit: string;
    factor: number;
};

/**
 * Convert a typed quantity into the ingredient's base unit.
 * Lookup order mirrors the backend: tenant pair (direct/inverse) →
 * built-in family map. Returns null when no conversion path exists.
 */
export function toBaseQtyClient(
    qty: number,
    fromUnit: string,
    baseUnit: string,
    conversions: TenantConversionRow[] = [],
): number | null {
    if (!fromUnit || !baseUnit) return null;
    if (fromUnit === baseUnit) return qty;

    const direct = conversions.find(
        c => c.fromUnit === fromUnit && c.toUnit === baseUnit,
    );
    if (direct) return qty * direct.factor;

    const inverse = conversions.find(
        c => c.fromUnit === baseUnit && c.toUnit === fromUnit,
    );
    if (inverse && inverse.factor !== 0) return qty / inverse.factor;

    const from = BUILT_IN_UNIT_FACTORS[fromUnit];
    const to = BUILT_IN_UNIT_FACTORS[baseUnit];
    if (from && to && from.family === to.family) {
        return (qty * from.factor) / to.factor;
    }
    return null;
}
