"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
    useAdminModifierGroupsQuery,
    useCreateAdminModifierGroupMutation,
    useDeleteAdminModifierGroupMutation,
    useUpdateAdminModifierGroupMutation,
} from "@/context/services/menuApi";
import { catalogModifiersToApi } from "@/domains/catalog/application/mapAdminMenu";
import type { AdminModifierGroup, AdminModifierOption } from "@/domains/catalog/domain/menuApi";
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
import { cn } from "@/lib/utils";
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
    const { data: groupsData, isLoading: loadingGroups } =
        useAdminModifierGroupsQuery(undefined, { skip: !isOpen });
    const [createGroup, { isLoading: creating }] =
        useCreateAdminModifierGroupMutation();
    const [updateGroup, { isLoading: updating }] =
        useUpdateAdminModifierGroupMutation();
    const [deleteGroup] = useDeleteAdminModifierGroupMutation();

    const [view, setView] = useState<"list" | "form">("list");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [optionName, setOptionName] = useState("");
    const [optionDelta, setOptionDelta] = useState("0");
    const [optionError, setOptionError] = useState("");

    const groups = groupsData?.data ?? [];

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
        if (!isOpen) {
            setView("list");
            setEditingId(null);
            return;
        }
        form.reset({ name: "", kind: "included", options: [] });
        setOptionName("");
        setOptionDelta("0");
        setOptionError("");
    }, [isOpen, form]);

    if (!isOpen) return null;

    function handleAddClick() {
        setEditingId(null);
        form.reset({ name: "", kind: "included", options: [] });
        setView("form");
    }

    function handleEditClick(group: AdminModifierGroup) {
        setEditingId(group.id);
        const groupKind: "included" | "extra" | "choice" =
            group.kind === "choice" || group.kind === "extra"
                ? group.kind
                : "included";

        const mappedOptions: ModifierOption[] = (group.options || []).map(
            (o: AdminModifierOption) => {
                let cleanName = o.name || "";
                if (
                    groupKind === "included" &&
                    cleanName.toLowerCase().startsWith("no ")
                ) {
                    cleanName = cleanName.slice(3).trim();
                }
                return {
                    id: o.id || createId("modopt"),
                    name: cleanName,
                    ticketLabel:
                        groupKind === "included"
                            ? `No ${cleanName.toLowerCase()}`
                            : cleanName,
                    priceDelta: Number(o.priceDelta) || 0,
                };
            },
        );

        form.reset({
            name: group.name,
            kind: groupKind,
            options: mappedOptions,
        });
        setView("form");
    }

    async function handleDeleteClick(id: string, name: string) {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await deleteGroup({ id }).unwrap();
            toast.success("Modifier group deleted");
        } catch (err) {
            toast.fromUnknown(err, "Failed to delete modifier group");
        }
    }

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
                    id: editingId || createId("modgroup"),
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

            if (editingId) {
                await updateGroup({ id: editingId, body: payload }).unwrap();
                toast.success("Modifier group updated", values.name);
            } else {
                await createGroup(payload).unwrap();
                toast.success(t("modifierSaved"), values.name);
            }
            setEditingId(null);
            setView("list");
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

    const isSaving = creating || updating;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
            <div className="flex h-full w-full max-w-md flex-col border-l border-hairline bg-card shadow-xl animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                    <div className="flex items-center gap-3">
                        {view === "form" && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setView("list");
                                }}
                                className="rounded-full p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground"
                            >
                                <ArrowLeft className="size-4" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-[17px] font-semibold tracking-tight">
                                {view === "list"
                                    ? "Manage Modifiers"
                                    : editingId
                                      ? "Edit Modifier Group"
                                      : t("addModifierTitle")}
                            </h2>
                            <p className="text-[12px] text-slate-gray">
                                {view === "list"
                                    ? "Edit or delete your saved modifier groups"
                                    : t("addModifierSubtitle")}
                            </p>
                        </div>
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

                {view === "list" ? (
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        <Button
                            onClick={handleAddClick}
                            className="mb-6 w-full gap-2 rounded-xl border-dashed py-6"
                            variant="outline"
                        >
                            <Plus className="size-4" />
                            Add new modifier group
                        </Button>

                        <div className="space-y-3">
                            {loadingGroups ? (
                                <p className="text-center text-[13px] text-slate-gray py-10">
                                    Loading modifiers...
                                </p>
                            ) : groups.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-[13px] text-slate-gray">
                                        No modifier groups found.
                                    </p>
                                </div>
                            ) : (
                                groups.map(group => (
                                    <div
                                        key={group.id}
                                        className="group flex items-start justify-between rounded-xl border border-hairline bg-surface-ivory p-3.5 transition-colors hover:border-slate-300"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="truncate text-[14px] font-semibold text-foreground">
                                                    {group.name}
                                                </h4>
                                                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-slate-gray">
                                                    {group.kind || "included"}
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-[11px] text-slate-gray">
                                                {group.options
                                                    ?.map((o: AdminModifierOption) => o.name)
                                                    .join(" · ") ||
                                                    "No options configured"}
                                            </p>
                                        </div>
                                        <div className="ml-3 flex shrink-0 items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                title="Edit modifier group"
                                                onClick={() =>
                                                    handleEditClick(group)
                                                }
                                                className="size-8 p-0 text-slate-gray hover:text-foreground"
                                            >
                                                <Edit3 className="size-3.5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                title="Delete modifier group"
                                                onClick={() =>
                                                    handleDeleteClick(
                                                        group.id,
                                                        group.name,
                                                    )
                                                }
                                                className="size-8 p-0 text-slate-gray hover:bg-rose-500/10 hover:text-rose-600"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
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
                                            <FormLabel>
                                                {t("groupName")}
                                            </FormLabel>
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
                                                        className={cn(
                                                            "rounded-[12px] border px-2 py-2 text-left transition-all",
                                                            field.value ===
                                                                entry.value
                                                                ? "border-brand bg-brand/10 ring-1 ring-brand"
                                                                : "border-hairline bg-surface-ivory hover:border-slate-300",
                                                        )}
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
                                            <FormLabel>
                                                {t("options")}
                                            </FormLabel>
                                            {options.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {options.map(opt => (
                                                        <span
                                                            key={opt.id}
                                                            className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface-ivory px-2.5 py-1 text-[12px]"
                                                        >
                                                            <span>
                                                                {kind ===
                                                                "included"
                                                                    ? opt.ticketLabel
                                                                    : opt.name}
                                                            </span>
                                                            {opt.priceDelta >
                                                            0 ? (
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
                                    disabled={isSaving}
                                    className="w-full"
                                >
                                    <Save className="size-4" />
                                    {isSaving
                                        ? t("saving")
                                        : editingId
                                          ? "Update Modifier Group"
                                          : t("saveModifierGroup")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </div>
        </div>
    );
}
