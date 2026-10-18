const QTY_FORMAT = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
});

const ETB_FORMAT = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatEtb(amount: number): string {
    const n = Number(amount);
    if (!Number.isFinite(n)) return "ETB 0.00";
    return `ETB ${ETB_FORMAT.format(n)}`;
}

/** Quantity / on-hand with thousands separators (e.g. 1,000). */
export function formatQty(amount: number): string {
    const n = Number(amount);
    if (!Number.isFinite(n)) return "0";
    return QTY_FORMAT.format(n);
}
