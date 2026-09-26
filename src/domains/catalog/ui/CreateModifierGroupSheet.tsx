"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateAdminModifierGroupMutation } from "@/context/services/menuApi";
import { catalogModifiersToApi } from "@/domains/catalog/application/mapAdminMenu";
import type { ModifierOption } from "@/domains/catalog/domain/modifiers";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createId } from "@/lib/ids";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import {
    modifierGroupFormSchema,
    modifierOptionDraftSchema,
    type ModifierGroupFormValues,
} from "@/lib/validators/catalog";

interface CreateModifierGroupSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateModifierGroupSheet({
    isOpen,
    onClose,
}: CreateModifierGroupSheetProps) {
    const t = useTranslations("menuSheets");
    const [createGroup, { isLoading }] = useCreateAdminModifierGroupMutation();
    const [optionName, setOptionName] = useState("");
    const [optionDelta, setOptionDelta] = useState("0");
    const [optionError, setOptionError] = useState("");

    const form = useForm<ModifierGroupFormValues>({
        resolver: zodResolver(modifierGroupFormSchema),
        defaultValues: {
            name: "",
            kind: "included",
            options: [],
        },
    });

    const kind = form.watch("kind");
    const options = form.watch("options");

    useEffect(() => {
        if (!isOpen) return;
        form.reset({ name: "", kind: "included", options: [] });
        setOptionName("");
        setOptionDelta("0");
        setOptionError("");
    }, [isOpen, form]);

    if (!isOpen) return null;

    function addOption() {
        const parsed = modifierOptionDraftSchema.safeParse({
            name: optionName,
            priceDelta: optionDelta || "0",
        });
        if (!parsed.success) {
            setOptionError(
                parsed.error.issues[0]?.message || t("invalidOption"),
            );
            return;
        }
        setOptionError("");
        const trimmed = parsed.data.name;
        const delta = kind === "extra" ? parsed.data.priceDelta : 0;
        const next: ModifierOption = {
            id: createId("modopt"),
            name: trimmed,
            ticketLabel:
                kind === "included" ? `No ${trimmed.toLowerCase()}` : trimmed,
            priceDelta: delta,
        };
        form.setValue("options", [...options, next], {
            shouldValidate: true,
            shouldDirty: true,
        });
        setOptionName("");
        setOptionDelta("0");
    }

    async function onSubmit(values: ModifierGroupFormValues) {
        try {
            const [payload] = catalogModifiersToApi([
                {
                    id: createId("modgroup"),
                    name: values.name,
                    kind: values.kind,
                    min: values.kind === "choice" ? 1 : 0,
                    max:
                        values.kind === "choice"
                            ? 1
                            : Math.max(values.options.length, 1),
                    options: values.options,
                },
            ]);
            await createGroup(payload).unwrap();
            toast.success(t("modifierSaved"), values.name);
            onClose();
        } catch (err) {
            toast.fromUnknown(err, t("modifierSaveError"));
        }
    }

    const kindOptions = [
        {
            value: "included" as const,
            label: t("typeHold"),
            hint: t("typeHoldHint"),
        },
        {
            value: "extra" as const,
            label: t("typeExtra"),
            hint: t("typeExtraHint"),
        },
        {
            value: "choice" as const,
            label: t("typeChoice"),
            hint: t("typeChoiceHint"),
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
            <div className="flex h-full w-full max-w-md flex-col border-l border-hairline bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                    <div>
                        <h2 className="text-[17px] font-semibold tracking-tight">
                            {t("addModifierTitle")}
                        </h2>
                        <p className="text-[12px] text-slate-gray">
                            {t("addModifierSubtitle")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-gray hover:bg-secondary"
                        aria-label={t("close")}
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(
                            values => void onSubmit(values),
                        )}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("groupName")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    "groupNamePlaceholder",
                                                )}
                                                className="h-10"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Controller
                                control={form.control}
                                name="kind"
                                render={({ field }) => (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium">
                                            {t("type")}
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {kindOptions.map(entry => (
                                                <button
                                                    key={entry.value}
                                                    type="button"
                                                    onClick={() =>
                                                        field.onChange(
                                                            entry.value,
                                                        )
                                                    }
                                                    className={
                                                        field.value ===
                                                        entry.value
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
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="options"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>{t("options")}</FormLabel>
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
                                                                +
                                                                {formatEtb(
                                                                    opt.priceDelta,
                                                                )}
                                                            </span>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                form.setValue(
                                                                    "options",
                                                                    options.filter(
                                                                        o =>
                                                                            o.id !==
                                                                            opt.id,
                                                                    ),
                                                                    {
                                                                        shouldValidate: true,
                                                                    },
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
                                                {t("optionsHint")}
                                            </p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-dashed border-hairline p-2.5">
                                <Input
                                    value={optionName}
                                    onChange={e =>
                                        setOptionName(e.target.value)
                                    }
                                    placeholder={
                                        kind === "included"
                                            ? t("ingredientPlaceholder")
                                            : t("optionNamePlaceholder")
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
                                    {t("add")}
                                </Button>
                            </div>
                            {optionError ? (
                                <p className="text-[12px] text-destructive">
                                    {optionError}
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
                                {isLoading
                                    ? t("saving")
                                    : t("saveModifierGroup")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
