import type { CashierPaymentLogItem } from "@/domains/billing/domain/billingApi";
import type { CashDrop } from "@/domains/cash/domain/cashApi";
import type {
    HourlySalesPoint,
    PaymentChannelBreakdownItem,
    RevenueVsCollectionsPoint,
    WeeklyCashMovementPoint,
} from "@/context/services/managerDashboardApi";
import { formatEtb } from "@/lib/money";

const CHANNEL_COLORS = {
    cash: "#e85d04",
    telebirr: "#046645",
    bank: "#0ea5e9",
    other: "#64748b",
};

export type CashierMoneyChannel = "cash" | "telebirr" | "bank" | "other";

export function paymentChannel(
    payment: Pick<CashierPaymentLogItem, "method" | "transferChannel">,
): CashierMoneyChannel {
    if (payment.method === "CASH") return "cash";
    const ch = (payment.transferChannel || "").toUpperCase();
    if (ch.includes("TELEBIRR")) return "telebirr";
    if (ch.includes("BANK") || ch.includes("CBE") || ch.includes("TRANSFER")) {
        return "bank";
    }
    if (payment.method === "TRANSFER") return "bank";
    return "other";
}

export function sumPayments(payments: CashierPaymentLogItem[]) {
    let total = 0;
    let cash = 0;
    let telebirr = 0;
    let bank = 0;
    let other = 0;
    for (const payment of payments) {
        const amount = Number(payment.amount || 0);
        total += amount;
        const channel = paymentChannel(payment);
        if (channel === "cash") cash += amount;
        else if (channel === "telebirr") telebirr += amount;
        else if (channel === "bank") bank += amount;
        else other += amount;
    }
    return { total, cash, telebirr, bank, other, count: payments.length };
}

export function buildPaymentChannels(
    payments: CashierPaymentLogItem[],
): PaymentChannelBreakdownItem[] {
    const sums = sumPayments(payments);
    const rows: Array<{
        id: string;
        name: string;
        amountValue: number;
        color: string;
    }> = [
        {
            id: "cash",
            name: "Cash",
            amountValue: sums.cash,
            color: CHANNEL_COLORS.cash,
        },
        {
            id: "telebirr",
            name: "Telebirr",
            amountValue: sums.telebirr,
            color: CHANNEL_COLORS.telebirr,
        },
        {
            id: "bank",
            name: "Bank / transfer",
            amountValue: sums.bank,
            color: CHANNEL_COLORS.bank,
        },
        {
            id: "other",
            name: "Other",
            amountValue: sums.other,
            color: CHANNEL_COLORS.other,
        },
    ].filter(row => row.amountValue > 0);

    const total = rows.reduce((sum, row) => sum + row.amountValue, 0) || 1;
    return rows.map(row => ({
        ...row,
        sharePercentage: Number(((row.amountValue / total) * 100).toFixed(1)),
        amountFormatted: formatEtb(row.amountValue),
    }));
}

function paymentTime(payment: CashierPaymentLogItem): Date | null {
    const raw =
        payment.settledAt || payment.collectedAt || payment.verifiedAt || null;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
}

function localDayKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function buildHourlyCollections(
    payments: CashierPaymentLogItem[],
): HourlySalesPoint[] {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${String(hour).padStart(2, "0")}:00`,
        billed: 0,
        collected: 0,
    }));
    for (const payment of payments) {
        const time = paymentTime(payment);
        if (!time) continue;
        buckets[time.getHours()].collected += Number(payment.amount || 0);
    }
    return buckets.filter(row => row.collected > 0);
}

export function buildDailyCollectionsTrend(
    payments: CashierPaymentLogItem[],
    days = 7,
): RevenueVsCollectionsPoint[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = new Map<string, { collections: number; gross: number }>();
    for (let i = days - 1; i >= 0; i -= 1) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        map.set(localDayKey(day), { collections: 0, gross: 0 });
    }
    for (const payment of payments) {
        const time = paymentTime(payment);
        if (!time) continue;
        const key = localDayKey(time);
        const row = map.get(key);
        if (!row) continue;
        const amount = Number(payment.amount || 0);
        row.collections += amount;
        row.gross += amount;
    }
    return Array.from(map.entries()).map(([key, row]) => {
        const date = new Date(`${key}T00:00:00`);
        return {
            period: date.toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
            }),
            grossSales: Math.round(row.gross),
            netRevenue: Math.round(row.collections),
            collections: Math.round(row.collections),
        };
    });
}

export function buildWeeklyCashMovement(
    payments: CashierPaymentLogItem[],
    cashDrops: CashDrop[],
    days = 7,
): WeeklyCashMovementPoint[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = new Map<string, { digitalInflow: number; cashDrop: number }>();
    for (let i = days - 1; i >= 0; i -= 1) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        map.set(localDayKey(day), { digitalInflow: 0, cashDrop: 0 });
    }
    for (const payment of payments) {
        const channel = paymentChannel(payment);
        if (channel === "cash") continue;
        const time = paymentTime(payment);
        if (!time) continue;
        const row = map.get(localDayKey(time));
        if (!row) continue;
        row.digitalInflow += Number(payment.amount || 0);
    }
    for (const drop of cashDrops) {
        const raw = drop.receivedAt || drop.initiatedAt;
        const time = new Date(raw);
        if (Number.isNaN(time.getTime())) continue;
        const row = map.get(localDayKey(time));
        if (!row) continue;
        const amount = Number(
            drop.countedAmount ||
                drop.resolutionAmount ||
                drop.declaredAmount ||
                0,
        );
        row.cashDrop += amount;
    }
    return Array.from(map.entries()).map(([key, row]) => {
        const date = new Date(`${key}T00:00:00`);
        return {
            day: date.toLocaleDateString(undefined, { weekday: "short" }),
            digitalInflow: Math.round(row.digitalInflow),
            cashDrop: Math.round(row.cashDrop),
        };
    });
}

export function buildCashierRadar(input: {
    cash: number;
    telebirr: number;
    bank: number;
    pendingBills: number;
    pendingDrops: number;
}) {
    const maxMoney = Math.max(
        input.cash,
        input.telebirr,
        input.bank,
        input.pendingBills,
        input.pendingDrops,
        1,
    );
    const scale = (value: number) =>
        Math.min(100, Math.round((value / maxMoney) * 100));
    return [
        { metric: "Cash", value: scale(input.cash) },
        { metric: "Telebirr", value: scale(input.telebirr) },
        { metric: "Bank", value: scale(input.bank) },
        { metric: "Bill queue", value: scale(input.pendingBills) },
        { metric: "Cash drops", value: scale(input.pendingDrops) },
    ];
}

export function pendingDropTotal(drops: CashDrop[]) {
    return drops
        .filter(drop =>
            ["INITIATED", "PENDING", "IN_TRANSIT", "AWAITING"].includes(
                drop.status.toUpperCase(),
            ),
        )
        .reduce((sum, drop) => sum + Number(drop.declaredAmount || 0), 0);
}
