"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EthiopianPhoneInput } from "@/components/ui/ethiopian-phone-input";
import { PasswordLiveChecks } from "@/components/ui/password-live-checks";
import { Label } from "@/components/ui/label";
import {
    useCreateBranchMutation,
    useListBranchesQuery,
    type CreateBranchBody,
} from "@/context/services/branchesApi";
import { toast } from "@/lib/toast";
import {
    createBranchFormSchema,
    type CreateBranchFormValues,
} from "@/lib/validators/provisionTenant";
import { cn } from "@/lib/utils";

const fieldClass =
    "h-9 rounded-[10px] border-hairline bg-card text-[13px] focus-visible:border-foreground/30 focus-visible:ring-foreground/10";

const defaults: CreateBranchFormValues = {
    name: "",
    displayCode: "",
    tableCount: 8,
    copyFromBranchId: "",
    serviceMode: "RESTAURANT",
    managerName: "",
    managerEmail: "",
    managerPhone: "+251 ",
    managerPassword: "",
};

export default function AddBranchSheet({
    open,
    onClose,
    tenantId,
}: {
    open: boolean;
    onClose: () => void;
    tenantId?: string;
}) {
    const t = useTranslations("owner");
    const { data } = useListBranchesQuery(tenantId ? { tenantId } : undefined, {
        skip: !open,
    });
    const [createBranch, { isLoading }] = useCreateBranchMutation();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const form = useForm<CreateBranchFormValues>({
        defaultValues: defaults,
        mode: "onTouched",
    });

    useEffect(() => {
        if (!open) return;
        form.reset(defaults);
        setErrorMsg(null);
    }, [open]);

    if (!open) return null;

    const atLimit = data != null && data.activeCount >= data.maxBranches;
    const values = form.watch();

    async function onSubmit(raw: CreateBranchFormValues) {
        setErrorMsg(null);
        const parsed = createBranchFormSchema.safeParse(raw);
        if (!parsed.success) {
            const message =
                parsed.error.issues[0]?.message || "Check the form.";
            setErrorMsg(message);
            for (const issue of parsed.error.issues) {
                const path = issue.path[0];
                if (typeof path === "string") {
                    form.setError(path as keyof CreateBranchFormValues, {
                        message: issue.message,
                    });
                }
            }
            return;
        }

        const payload = parsed.data;
        const body: CreateBranchBody = {
            name: payload.name.trim(),
            ...(payload.displayCode?.trim()
                ? { displayCode: payload.displayCode.trim() }
                : {}),
            tableCount:
                payload.serviceMode === "BAKERY" ? 1 : payload.tableCount,
            serviceMode: payload.serviceMode,
            ...(payload.copyFromBranchId
                ? { copyFromBranchId: payload.copyFromBranchId }
                : {}),
            ...(tenantId ? { tenantId } : {}),
            manager: {
                name: payload.managerName.trim(),
                password: payload.managerPassword,
                ...(payload.managerEmail?.trim()
                    ? { email: payload.managerEmail.trim() }
                    : {}),
                phone: payload.managerPhone.trim(),
            },
        };

        try {
            await createBranch(body).unwrap();
            toast.success(t("branchCreated"));
            form.reset(defaults);
            onClose();
        } catch (err) {
            toast.fromUnknown(err, t("branchCreateError"));
            setErrorMsg(t("branchCreateError"));
        }
    }

    const isBakery = values.serviceMode === "BAKERY";

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
                aria-label={t("closeBranchMenu")}
                onClick={onClose}
            />
            <aside className="absolute inset-y-0 right-0 z-10 flex h-full w-[24rem] max-w-[calc(100vw-1rem)] flex-col border-l border-hairline bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-3">
                    <div>
                        <h2 className="text-[16px] font-semibold">
                            {t("addBranchTitle")}
                        </h2>
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            {atLimit
                                ? `Plan limit reached (${data?.activeCount}/${data?.maxBranches} branches).`
                                : t("addBranchDesc")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="app-scroll flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
                        {atLimit ? (
                            <p className="rounded-[10px] border border-hairline bg-secondary/50 px-3 py-2 text-[12px] text-slate-gray">
                                Upgrade the plan or archive a branch before
                                adding another location.
                            </p>
                        ) : null}

                        <div className="space-y-1">
                            <Label htmlFor="branch-name">
                                {t("branchName")}
                            </Label>
                            <Input
                                id="branch-name"
                                className={fieldClass}
                                disabled={atLimit}
                                {...form.register("name")}
                            />
                            {form.formState.errors.name ? (
                                <p className="text-[12px] text-destructive">
                                    {form.formState.errors.name.message}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <Label>Branch type</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {(["RESTAURANT", "BAKERY"] as const).map(
                                    mode => (
                                        <button
                                            key={mode}
                                            type="button"
                                            disabled={atLimit}
                                            onClick={() =>
                                                form.setValue(
                                                    "serviceMode",
                                                    mode,
                                                )
                                            }
                                            className={cn(
                                                "h-9 rounded-[10px] border text-[13px] font-medium",
                                                values.serviceMode === mode
                                                    ? "border-foreground bg-foreground text-background"
                                                    : "border-hairline bg-card",
                                            )}
                                        >
                                            {mode === "BAKERY"
                                                ? "Bakery"
                                                : "Restaurant"}
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>

                        <div
                            className={cn(
                                "grid gap-3",
                                isBakery ? "grid-cols-1" : "grid-cols-2",
                            )}
                        >
                            <div className="space-y-1">
                                <Label htmlFor="branch-code">
                                    {t("branchCode")}
                                </Label>
                                <Input
                                    id="branch-code"
                                    className={cn(fieldClass, "uppercase")}
                                    disabled={atLimit}
                                    placeholder={t("branchCodeHint")}
                                    {...form.register("displayCode")}
                                />
                            </div>
                            {isBakery ? null : (
                                <div className="space-y-1">
                                    <Label htmlFor="table-count">
                                        {t("tableCountSeed")}
                                    </Label>
                                    <Input
                                        id="table-count"
                                        type="number"
                                        min={0}
                                        max={60}
                                        className={fieldClass}
                                        disabled={atLimit}
                                        {...form.register("tableCount", {
                                            valueAsNumber: true,
                                        })}
                                    />
                                    {form.formState.errors.tableCount ? (
                                        <p className="text-[12px] text-destructive">
                                            {
                                                form.formState.errors.tableCount
                                                    .message
                                            }
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {!isBakery && (data?.data.length ?? 0) > 0 ? (
                            <div className="space-y-1">
                                <Label htmlFor="copy-from">
                                    {t("copyFromBranch")}
                                </Label>
                                <select
                                    id="copy-from"
                                    disabled={atLimit}
                                    className={cn(
                                        fieldClass,
                                        "w-full border bg-card px-3",
                                    )}
                                    {...form.register("copyFromBranchId")}
                                >
                                    <option value="">
                                        {t("copyFromNone")}
                                    </option>
                                    {data?.data.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        <div className="border-t border-hairline pt-3.5">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-gray">
                                {t("managerSection")}
                            </p>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="mgr-name">
                                        {t("managerName")}
                                    </Label>
                                    <Input
                                        id="mgr-name"
                                        className={fieldClass}
                                        disabled={atLimit}
                                        {...form.register("managerName")}
                                    />
                                    {form.formState.errors.managerName ? (
                                        <p className="text-[12px] text-destructive">
                                            {
                                                form.formState.errors
                                                    .managerName.message
                                            }
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="mgr-email">
                                        {t("managerEmail")}
                                    </Label>
                                    <Input
                                        id="mgr-email"
                                        type="email"
                                        className={fieldClass}
                                        disabled={atLimit}
                                        {...form.register("managerEmail")}
                                    />
                                    {form.formState.errors.managerEmail ? (
                                        <p className="text-[12px] text-destructive">
                                            {
                                                form.formState.errors
                                                    .managerEmail.message
                                            }
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="mgr-phone">
                                        {t("managerPhone")}
                                    </Label>
                                    <EthiopianPhoneInput
                                        id="mgr-phone"
                                        disabled={atLimit}
                                        value={values.managerPhone}
                                        onChange={value =>
                                            form.setValue(
                                                "managerPhone",
                                                value,
                                                {
                                                    shouldValidate: true,
                                                },
                                            )
                                        }
                                    />
                                    {form.formState.errors.managerPhone ? (
                                        <p className="text-[12px] text-destructive">
                                            {
                                                form.formState.errors
                                                    .managerPhone.message
                                            }
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="mgr-pass">
                                        {t("managerPassword")}
                                    </Label>
                                    <Input
                                        id="mgr-pass"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Min. 8 characters"
                                        className={cn(fieldClass, "font-mono")}
                                        disabled={atLimit}
                                        {...form.register("managerPassword")}
                                    />
                                    {form.formState.errors.managerPassword ? (
                                        <p className="text-[12px] text-destructive">
                                            {
                                                form.formState.errors
                                                    .managerPassword.message
                                            }
                                        </p>
                                    ) : null}
                                    <PasswordLiveChecks
                                        value={values.managerPassword}
                                    />
                                </div>
                            </div>
                        </div>

                        {errorMsg ? (
                            <p className="rounded-[10px] border border-destructive/20 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                                {errorMsg}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-hairline px-5 py-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-8 rounded-full px-3 text-[12px] font-medium text-slate-gray hover:bg-secondary"
                        >
                            {t("closeBranchMenu")}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || atLimit}
                            className="inline-flex h-8 min-w-[108px] items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-[12px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    {t("creatingBranch")}
                                </>
                            ) : (
                                t("createBranch")
                            )}
                        </button>
                    </div>
                </form>
            </aside>
        </div>
    );
}
