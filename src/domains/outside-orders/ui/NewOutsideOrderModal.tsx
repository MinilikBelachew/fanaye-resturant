"use client";

import { useState } from "react";
import {
    Building2,
    Coffee,
    Store,
    MapPin,
    X,
    Loader2,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useCreateOutsideOrderMutation,
    type DestinationType,
} from "@/context/services/outsideOrdersApi";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const DEST_TYPES: Array<{
    type: DestinationType;
    label: string;
    icon: typeof Building2;
}> = [
    { type: "BUILDING", label: "Building / Office", icon: Building2 },
    { type: "CAFE", label: "Adjacent Cafe", icon: Coffee },
    { type: "KIOSK", label: "Kiosk / Stand", icon: Store },
    { type: "OTHER", label: "Other Off-Site", icon: MapPin },
];

export default function NewOutsideOrderModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: (outsideOrderId: string) => void;
}) {
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
            toast.error("Please specify destination name or location.");
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

            toast.success("Outside order created.");
            onSuccess(res.data.id);
            onClose();
        } catch (err: any) {
            toast.error(
                err?.data?.message ||
                    "Failed to create outside order. Ensure you are on an active shift.",
            );
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl rounded-2xl border bg-background shadow-2xl animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="size-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                New Outside / Off-Site Order
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Deliver to nearby locations
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
                            Destination Type
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {DEST_TYPES.map(({ type, label, icon: Icon }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setDestinationType(type)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                                        destinationType === type
                                            ? "border-primary bg-primary/5 shadow-sm"
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
                                        {label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Destination Name - REQUIRED */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Destination Name / Specific Room{" "}
                            <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            placeholder="e.g. Next Door Bank 4th Floor, Room 402"
                            value={destinationName}
                            onChange={e => setDestinationName(e.target.value)}
                            required
                            className="h-10"
                        />
                    </div>

                    {/* Delivery / Destination Note - OPTIONAL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            Delivery Note{" "}
                            <span className="text-xs">(Optional)</span>
                        </label>
                        <Input
                            placeholder="e.g. Leave at front security reception"
                            value={destinationNote}
                            onChange={e => setDestinationNote(e.target.value)}
                            className="h-10"
                        />
                    </div>

                    {/* Customer Details - OPTIONAL */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Recipient / Customer Name
                            </label>
                            <Input
                                placeholder="e.g. Dr. Abebe"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Phone Number
                            </label>
                            <Input
                                placeholder="e.g. 0911223344"
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
                                Requires Returnable Materials Tracking
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed">
                                Chef will issue plates, cutlery, warmers, and
                                trays. Waiter picks up with food, delivers, then
                                returns materials for chef audit.
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
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !destinationName.trim()}
                            className="h-10 px-6"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Opening Order...
                                </>
                            ) : (
                                "Open Outside Order"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
