"use client";

import { useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import { Building2, Coffee, Store, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useCreateOutsideOrderMutation,
    type DestinationType,
} from "@/context/services/outsideOrdersApi";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useTranslations } from "next-intl";

const DEST_TYPES: Array<{
    type: DestinationType;
    icon: typeof Building2;
}> = [
    { type: "BUILDING", icon: Building2 },
    { type: "CAFE", icon: Coffee },
    { type: "KIOSK", icon: Store },
    { type: "OTHER", icon: MapPin },
];

export default function NewOutsideOrderModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: (outsideOrderId: string) => void;
}) {
    const t = useTranslations("outsideOrders");
    const [destinationType, setDestinationType] =
        useState<DestinationType>("BUILDING");
    const [destinationName, setDestinationName] = useState("");
    const [destinationNote, setDestinationNote] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [requiresMaterialReturn, setRequiresMaterialReturn] = useState(true);

    const [createOrder, { isLoading }] = useCreateOutsideOrderMutation();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!destinationName.trim()) {
            toast.error(t("destNameRequired"));
            return;
        }

        try {
            const res = await createOrder({
                destinationType,
                destinationName: destinationName.trim(),
                destinationNote: destinationNote.trim() || undefined,
                customerName: customerName.trim() || undefined,
                customerPhone: customerPhone.trim() || undefined,
                requiresMaterialReturn,
            }).unwrap();

            toast.success(t("orderCreated"));
            onSuccess(res.data.id);
            onClose();
        } catch (err: any) {
            toast.error(err?.data?.message || t("createError"));
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl rounded-2xl border bg-background shadow-2xl animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary-soft flex items-center justify-center">
                            <Building2 className="size-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                {t("title")}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {t("subtitle")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Destination Type Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t("destTypeLabel")}
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {DEST_TYPES.map(({ type, icon: Icon }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setDestinationType(type)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                                        destinationType === type
                                            ? "border-primary bg-primary-soft shadow-sm"
                                            : "border-border hover:border-border/80 hover:bg-muted/30",
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "size-6 shrink-0",
                                            destinationType === type
                                                ? "text-primary"
                                                : "text-muted-foreground",
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "text-xs font-medium",
                                            destinationType === type
                                                ? "text-primary"
                                                : "text-foreground",
                                        )}
                                    >
                                        {t(`destTypes.${type}` as any)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Destination Name - REQUIRED */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t("destNameLabel")}{" "}
                            <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            placeholder={t("destNamePlaceholder")}
                            value={destinationName}
                            onChange={e => setDestinationName(e.target.value)}
                            required
                            className="h-10"
                        />
                    </div>

                    {/* Delivery / Destination Note - OPTIONAL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            {t("deliveryNoteLabel")}{" "}
                            <span className="text-xs">
                                {t("optionalBadge")}
                            </span>
                        </label>
                        <Input
                            placeholder={t("deliveryNotePlaceholder")}
                            value={destinationNote}
                            onChange={e => setDestinationNote(e.target.value)}
                            className="h-10"
                        />
                    </div>

                    {/* Customer Details - OPTIONAL */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t("recipientNameLabel")}
                            </label>
                            <Input
                                placeholder={t("recipientNamePlaceholder")}
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t("phoneLabel")}
                            </label>
                            <Input
                                placeholder={t("phonePlaceholder")}
                                value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    {/* Returnable Materials Checkbox */}
                    <div className="flex items-start gap-3 rounded-xl border-2 bg-gradient-to-br from-primary/5 to-transparent p-4">
                        <input
                            type="checkbox"
                            id="requiresMaterialReturn"
                            checked={requiresMaterialReturn}
                            onChange={e =>
                                setRequiresMaterialReturn(e.target.checked)
                            }
                            className="mt-0.5 size-5 rounded border-border/80 text-primary focus:ring-2 focus:ring-primary/40"
                        />
                        <label
                            htmlFor="requiresMaterialReturn"
                            className="cursor-pointer space-y-1 flex-1"
                        >
                            <div className="text-sm font-semibold text-foreground">
                                {t("trackingLabel")}
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed">
                                {t("trackingDesc")}
                            </div>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="h-10"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !destinationName.trim()}
                            className="h-10 px-6"
                        >
                            {isLoading ? (
                                <>
                                    <RestorchSpinner className="mr-2 size-4 " />
                                    {t("openingOrder")}
                                </>
                            ) : (
                                t("openOrder")
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
