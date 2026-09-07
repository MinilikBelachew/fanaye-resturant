import type { RootState } from "@/context/store";
import {
    isLoggedPayment,
    type Payment,
    type PaymentMethod,
} from "@/domains/payments/domain/payment";

export function selectSessionDue(
    state: RootState,
    sessionId: string,
): number {
    return state.ops.items
        .filter(
            item =>
                item.sessionId === sessionId &&
                item.status !== "cancelled" &&
                item.status !== "draft",
        )
        .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function selectLoggedPayments(state: RootState): Payment[] {
    return state.ops.payments.filter(payment =>
        isLoggedPayment(payment.status),
    );
}

export function selectLoggedPaymentForSession(
    state: RootState,
    sessionId: string,
): Payment | undefined {
    return state.ops.payments.find(
        payment =>
            payment.sessionId === sessionId &&
            isLoggedPayment(payment.status),
    );
}

export function selectPaymentsByMethod(
    payments: Payment[],
    method: PaymentMethod,
): Payment[] {
    return payments.filter(payment => payment.method === method);
}

export function selectPaymentTotals(state: RootState) {
    const logged = selectLoggedPayments(state);
    const sum = (method?: PaymentMethod) =>
        logged
            .filter(payment => (method ? payment.method === method : true))
            .reduce((total, payment) => total + payment.amount, 0);
    return {
        count: logged.length,
        total: sum(),
        cash: sum("cash"),
        telebirr: sum("telebirr"),
        bank: sum("bank"),
        cashCount: logged.filter(payment => payment.method === "cash").length,
        telebirrCount: logged.filter(payment => payment.method === "telebirr")
            .length,
        bankCount: logged.filter(payment => payment.method === "bank").length,
    };
}

export function selectBillRequestSessions(state: RootState) {
    return state.ops.sessions.filter(
        session => session.status === "bill_requested",
    );
}

/** @deprecated Use selectLoggedPayments. Kept for older screens. */
export function selectConfirmedPayments(state: RootState): Payment[] {
    return selectLoggedPayments(state);
}

/** @deprecated Confirm flow removed. */
export function selectPendingPayments(state: RootState): Payment[] {
    return [];
}

/** @deprecated Confirm flow removed. */
export function selectPendingPaymentForSession(
    state: RootState,
    sessionId: string,
): Payment | undefined {
    return selectLoggedPaymentForSession(state, sessionId);
}
