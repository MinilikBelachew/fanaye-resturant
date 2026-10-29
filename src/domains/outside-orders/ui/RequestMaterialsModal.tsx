"use client";

import { useState } from "react";
import { MessageSquarePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequestMaterialsMutation } from "@/context/services/outsideOrdersApi";
import { toast } from "@/lib/toast";

interface RequestMaterialsModalProps {
    outsideOrderId: string;
    destinationName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RequestMaterialsModal({
    outsideOrderId,
    destinationName,
    onClose,
    onSuccess,
}: RequestMaterialsModalProps) {
    const [requestNote, setRequestNote] = useState("");
    const [sendRequest, { isLoading: isSubmitting }] =
        useRequestMaterialsMutation();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!requestNote.trim()) {
            toast.error("Please describe what materials you need.");
            return;
        }
        try {
            await sendRequest({
                outsideOrderId,
                note: requestNote.trim(),
            }).unwrap();
            toast.success("Material request sent to kitchen.");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to send request.");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl border border-border/80 bg-background p-5">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                        <MessageSquarePlus className="size-4 text-amber-600" />
                        <div>
                            <h3 className="text-sm font-medium">
                                Request Materials
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                For: {destinationName}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded p-1 hover:bg-muted"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                        <p className="text-xs text-amber-700">
                            Chef will review and issue if approved.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                            Material Request *
                        </label>
                        <textarea
                            placeholder="Need 5 plates, 5 forks, 5 knives, 1 warmer"
                            value={requestNote}
                            onChange={e => setRequestNote(e.target.value)}
                            required
                            rows={4}
                            className="w-full rounded-lg border border-border/80 px-3 py-2 text-xs resize-none"
                        />
                    </div>
                    <div className="flex gap-2 border-t border-border/40 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="h-8 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting || !requestNote.trim()}
                            className="h-8 text-xs bg-amber-600 hover:bg-amber-700 flex-1"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Request to Chef"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
