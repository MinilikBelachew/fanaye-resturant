"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { submitPayment } from "@/context/slices/opsSlice";
import CameraCapture from "@/domains/payments/ui/CameraCapture";
import {
    PAYMENT_METHOD_LABELS,
    type PaymentMethod,
} from "@/domains/payments/domain/payment";
import {
    selectLoggedPaymentForSession,
    selectSessionDue,
} from "@/domains/payments/application/selectors";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/money";

export default function WaiterPaymentPanel({
    sessionId,
    waiterId,
    billRequested,
}: {
    sessionId: string;
    waiterId: string;
    billRequested: boolean;
}) {
    const dispatch = useAppDispatch();
    const due = useAppSelector(state => selectSessionDue(state, sessionId));
    const logged = useAppSelector(state =>
        selectLoggedPaymentForSession(state, sessionId),
    );
    const [cameraFor, setCameraFor] = useState<
        Exclude<PaymentMethod, "cash"> | null
    >(null);

    function sendCash() {
        dispatch(
            submitPayment({
                sessionId,
                waiterId,
                method: "cash",
                evidenceDataUrl: null,
            }),
        );
    }

    if (logged) {
        return (
            <div className="rounded-[16px] border border-hairline bg-accent/50 p-4">
                <p className="text-[13px] font-medium text-accent-foreground">
                    Paid · logged to cashier
                </p>
                <p className="mt-1 text-[14px] text-slate-gray">
                    {PAYMENT_METHOD_LABELS[logged.method]} ·{" "}
                    {formatEtb(logged.amount)}
                </p>
            </div>
        );
    }

    if (!billRequested) return null;

    return (
        <>
            <div className="space-y-2">
                <p className="text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                    Collect bill
                </p>
                <Button className="h-11 w-full" onClick={sendCash}>
                    Collect cash · {formatEtb(due)}
                </Button>
                <Button
                    variant="outline"
                    className="h-11 w-full"
                    onClick={() => setCameraFor("bank")}
                >
                    Bank transfer · camera
                </Button>
                <Button
                    variant="outline"
                    className="h-11 w-full"
                    onClick={() => setCameraFor("telebirr")}
                >
                    Telebirr · camera
                </Button>
            </div>
            {cameraFor ? (
                <CameraCapture
                    title={PAYMENT_METHOD_LABELS[cameraFor]}
                    onCancel={() => setCameraFor(null)}
                    onCapture={dataUrl => {
                        dispatch(
                            submitPayment({
                                sessionId,
                                waiterId,
                                method: cameraFor,
                                evidenceDataUrl: dataUrl,
                            }),
                        );
                        setCameraFor(null);
                    }}
                />
            ) : null}
        </>
    );
}
