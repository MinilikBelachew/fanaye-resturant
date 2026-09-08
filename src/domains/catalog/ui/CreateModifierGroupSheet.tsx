"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { useCreateAdminModifierGroupMutation } from "@/context/services/menuApi";
import { catalogModifiersToApi } from "@/domains/catalog/application/mapAdminMenu";
import type {
    ModifierGroupKind,
    ModifierOption,
} from "@/domains/catalog/domain/modifiers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createId } from "@/lib/ids";
import { formatEtb } from "@/lib/money";

interface CreateModifierGroupSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateModifierGroupSheet({
    isOpen,
    onClose,
}: CreateModifierGroupSheetProps) {
    const [createGroup, { isLoading }] = useCreateAdminModifierGroupMutation();
    const [name, setName] = useState("");
    const [kind, setKind] = useState<ModifierGroupKind>("included");
    const [options, setOptions] = useState<ModifierOption[]>([]);
    const [optionName, setOptionName] = useState("");
    const [optionDelta, setOptionDelta] = useState("0");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setName("");
        setKind("included");
        setOptions([]);
        setOptionName("");
        setOptionDelta("0");
        setError("");
    }, [isOpen]);

    if (!isOpen) return null;

    function addOption() {
        const trimmed = optionName.trim();
        if (!trimmed) return;
        const delta = Number(optionDelta) || 0;
        setOptions(prev => [
            ...prev,
            {
                id: createId("modopt"),
                name: trimmed,
                ticketLabel:
                    kind === "included" ? `No ${trimmed.toLowerCase()}` : trimmed,
                priceDelta: delta,
            },
        ]);
        setOptionName("");
        setOptionDelta(kind === "extra" ? "0" : "0");
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!name.trim() || options.length === 0) {
            setError("Add a group name and at least one option.");
            return;
        }
        setError("");
        try {
            const [payload] = catalogModifiersToApi([
                {
                    id: createId("modgroup"),
                    name: name.trim(),
                    kind,
                    min: kind === "choice" ? 1 : 0,
                    max: kind === "choice" ? 1 : Math.max(options.length, 1),
                    options,
                },
            ]);
            await createGroup(payload).unwrap();
            onClose();
        } catch {
            setError("Could not save modifier group. Try again.");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
            <div className="flex h-full w-full max-w-md flex-col border-l border-hairline bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                    <div>
                        <h2 className="text-[17px] font-semibold tracking-tight">
                            Add modifier group
                        </h2>
                        <p className="text-[12px] text-slate-gray">
                            Reusable holds, extras, or choices for menu items.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-gray hover:bg-secondary"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium">
                                Group name
                            </label>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Hold ingredients, Extra toppings, Milk…"
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium">
                                Type
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(
                                    [
                                        {
                                            value: "included",
                                            label: "Hold",
                                            hint: "Remove included items",
                                        },
                                        {
                                            value: "extra",
                                            label: "Extra",
                                            hint: "Add-ons with price",
                                        },
                                        {
                                            value: "choice",
                                            label: "Choice",
                                            hint: "Pick one",
                                        },
                                    ] as const
                                ).map(entry => (
                                    <button
                                        key={entry.value}
                                        type="button"
                                        onClick={() => setKind(entry.value)}
                                        className={
                                            kind === entry.value
                                                ? "rounded-[12px] border border-brand bg-brand/10 px-2 py-2 text-left"
                                                : "rounded-[12px] border border-hairline bg-surface-ivory px-2 py-2 text-left"
                                        }
                                    >
                                        <p className="text-[13px] font-semibold">
                                            {entry.label}
                                        </p>
                                        <p className="text-[11px] text-slate-gray">
                                            {entry.hint}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-medium">
                                Options
                            </label>
                            {options.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {options.map(opt => (
                                        <span
                                            key={opt.id}
                                            className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface-ivory px-2.5 py-1 text-[12px]"
                                        >
                                            <span>
                                                {kind === "included"
                                                    ? opt.ticketLabel
                                                    : opt.name}
                                            </span>
                                            {opt.priceDelta > 0 ? (
                                                <span className="font-medium text-brand">
                                                    +{formatEtb(opt.priceDelta)}
                                                </span>
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOptions(prev =>
                                                        prev.filter(
                                                            o => o.id !== opt.id,
                                                        ),
                                                    )
                                                }
                                                className="text-slate-gray hover:text-destructive"
                                            >
                                                <Trash2 className="size-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[12px] text-slate-gray">
                                    Add options waiters can pick (onion, extra
                                    cheese, oat milk…).
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-dashed border-hairline p-2.5">
                                <Input
                                    value={optionName}
                                    onChange={e => setOptionName(e.target.value)}
                                    placeholder={
                                        kind === "included"
                                            ? "Ingredient (e.g. Onion)"
                                            : "Option name"
                                    }
                                    className="h-8 min-w-[140px] flex-1 text-[12px]"
                                />
                                {kind === "extra" ? (
                                    <Input
                                        value={optionDelta}
                                        onChange={e =>
                                            setOptionDelta(e.target.value)
                                        }
                                        placeholder="+ETB"
                                        className="h-8 w-20 text-[12px]"
                                    />
                                ) : null}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={addOption}
                                    disabled={!optionName.trim()}
                                    className="h-8"
                                >
                                    <Plus className="size-3.5" />
                                    Add
                                </Button>
                            </div>
                        </div>

                        {error ? (
                            <p className="text-[12px] text-destructive">
                                {error}
                            </p>
                        ) : null}
                    </div>

                    <div className="border-t border-hairline px-5 py-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            <Save className="size-4" />
                            {isLoading ? "Saving…" : "Save modifier group"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
