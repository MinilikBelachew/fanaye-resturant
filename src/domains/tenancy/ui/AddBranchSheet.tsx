"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
    Building2,
    ChefHat,
    Info,
    Loader2,
    Lock,
    Mail,
    Store,
    User,
    X,
} from "lucide-react";
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
    "h-10 rounded-xl border-hairline bg-card text-[13px] focus-visible:border-foreground/40 focus-visible:ring-foreground/10 px-3";

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

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-destructive">
            <span className="inline-block size-1 shrink-0 rounded-full bg-destructive" />
            {message}
        </p>
    );
}

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

    const {
        formState: { errors },
        watch,
        register,
        setValue,
        handleSubmit,
        reset,
    } = useForm<CreateBranchFormValues>({
        defaultValues: defaults,
        resolver: zodResolver(createBranchFormSchema) as any,
        mode: "onTouched",
    });

    useEffect(() => {
        if (!open) return;
        reset(defaults);
        setErrorMsg(null);
    }, [open, reset]);

    if (!open) return null;

    const atLimit = data != null && data.activeCount >= data.maxBranches;
    const values = watch();
    const isBakery = values.serviceMode === "BAKERY";

    async function onSubmit(payload: CreateBranchFormValues) {
        setErrorMsg(null);
        const body: CreateBranchBody = {
            name: payload.name.trim(),
            ...(payload.displayCode?.trim()
                ? { displayCode: payload.displayCode.trim().toUpperCase() }
                : {}),
            tableCount: isBakery ? 1 : payload.tableCount,
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
            reset(defaults);
            onClose();
        } catch (err) {
            toast.fromUnknown(err, t("branchCreateError"));
            setErrorMsg(t("branchCreateError"));
        }
    }

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                aria-label={t("closeBranchMenu")}
                onClick={onClose}
            />

            {/* Sheet */}
            <aside className="absolute inset-y-0 right-0 z-10 flex h-full w-[34rem] max-w-[calc(100vw-1rem)] flex-col border-l border-hairline bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-hairline px-6 py-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                            <Building2 className="size-4 text-brand" />
                        </div>
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
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="app-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
                        {/* Plan limit warning */}
                        {atLimit ? (
                            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                                <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                <p className="text-[12px] text-amber-800 dark:text-amber-400">
                                    Upgrade the plan or archive a branch before
                                    adding another location.
                                </p>
                            </div>
                        ) : null}

                        {/* ── Branch Details ── */}
                        <section className="space-y-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-gray">
                                Branch Details
                            </p>

                            {/* Branch name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="branch-name">
                                    {t("branchName")}
                                </Label>
                                <Input
                                    id="branch-name"
                                    className={fieldClass}
                                    disabled={atLimit}
                                    placeholder="e.g. Bole, Piassa, CMC"
                                    {...register("name")}
                                />
                                <FieldError message={errors.name?.message} />
                            </div>

                            {/* Branch type */}
                            <div className="space-y-1.5">
                                <Label>Branch type</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(
                                        [
                                            {
                                                mode: "RESTAURANT",
                                                label: "Restaurant",
                                                icon: Store,
                                            },
                                            {
                                                mode: "BAKERY",
                                                label: "Bakery",
                                                icon: ChefHat,
                                            },
                                        ] as const
                                    ).map(({ mode, label, icon: Icon }) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            disabled={atLimit}
                                            onClick={() =>
                                                setValue("serviceMode", mode)
                                            }
                                            className={cn(
                                                "flex h-11 items-center justify-center gap-2 rounded-xl border text-[13px] font-medium transition-all",
                                                values.serviceMode === mode
                                                    ? "border-foreground bg-foreground text-background shadow-sm"
                                                    : "border-hairline bg-card text-foreground hover:border-foreground/30",
                                            )}
                                        >
                                            <Icon className="size-4" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Branch code + tables */}
                            <div
                                className={cn(
                                    "grid gap-3",
                                    isBakery ? "grid-cols-1" : "grid-cols-2",
                                )}
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="branch-code">
                                            {t("branchCode")}
                                        </Label>
                                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-slate-gray">
                                            optional
                                        </span>
                                    </div>
                                    <Input
                                        id="branch-code"
                                        className={cn(
                                            fieldClass,
                                            "uppercase tracking-widest",
                                        )}
                                        disabled={atLimit}
                                        placeholder={t("branchCodeHint")}
                                        maxLength={8}
                                        {...register("displayCode")}
                                    />
                                    <p className="text-[11px] text-slate-gray">
                                        Used on bill numbers & inventory labels
                                    </p>
                                    <FieldError
                                        message={errors.displayCode?.message}
                                    />
                                </div>

                                {!isBakery && (
                                    <div className="space-y-1.5">
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
                                            {...register("tableCount", {
                                                valueAsNumber: true,
                                            })}
                                        />
                                        <FieldError
                                            message={errors.tableCount?.message}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Copy stations from */}
                            {!isBakery && (data?.data.length ?? 0) > 0 && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="copy-from">
                                        {t("copyFromBranch")}
                                    </Label>
                                    <select
                                        id="copy-from"
                                        disabled={atLimit}
                                        className={cn(
                                            fieldClass,
                                            "w-full border bg-card",
                                        )}
                                        {...register("copyFromBranchId")}
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
                            )}
                        </section>

                        {/* ── Branch Manager ── */}
                        <section className="space-y-4 border-t border-hairline pt-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-gray">
                                {t("managerSection")}
                            </p>

                            <div className="space-y-1.5">
                                <Label htmlFor="mgr-name">
                                    {t("managerName")}
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                    <Input
                                        id="mgr-name"
                                        className={cn(fieldClass, "pl-9")}
                                        disabled={atLimit}
                                        placeholder="Full name"
                                        {...register("managerName")}
                                    />
                                </div>
                                <FieldError
                                    message={errors.managerName?.message}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="mgr-email">
                                        {t("managerEmail")}
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                        <Input
                                            id="mgr-email"
                                            type="email"
                                            className={cn(fieldClass, "pl-9")}
                                            disabled={atLimit}
                                            placeholder="email@example.com"
                                            {...register("managerEmail")}
                                        />
                                    </div>
                                    <FieldError
                                        message={errors.managerEmail?.message}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="mgr-phone">
                                        {t("managerPhone")}
                                    </Label>
                                    <EthiopianPhoneInput
                                        id="mgr-phone"
                                        disabled={atLimit}
                                        value={values.managerPhone}
                                        onChange={value =>
                                            setValue("managerPhone", value, {
                                                shouldValidate: true,
                                            })
                                        }
                                    />
                                    <FieldError
                                        message={errors.managerPhone?.message}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="mgr-pass">
                                    {t("managerPassword")}
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                    <Input
                                        id="mgr-pass"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Min. 8 characters"
                                        className={cn(
                                            fieldClass,
                                            "pl-9 font-mono",
                                        )}
                                        disabled={atLimit}
                                        {...register("managerPassword")}
                                    />
                                </div>
                                <FieldError
                                    message={errors.managerPassword?.message}
                                />
                                <PasswordLiveChecks
                                    value={values.managerPassword}
                                />
                            </div>
                        </section>

                        {/* Submit error */}
                        {errorMsg && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3">
                                <Info className="mt-0.5 size-4 shrink-0 text-destructive" />
                                <p className="text-[12px] text-destructive">
                                    {errorMsg}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 border-t border-hairline px-6 py-4">
                        <p className="text-[11px] text-slate-gray">
                            {data
                                ? `${data.activeCount} / ${data.maxBranches} branches used`
                                : ""}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-9 rounded-xl px-4 text-[13px] font-medium text-slate-gray hover:bg-secondary"
                            >
                                {t("closeBranchMenu")}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || atLimit}
                                className="inline-flex h-9 min-w-[120px] items-center justify-center gap-1.5 rounded-xl bg-foreground px-5 text-[13px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
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
                    </div>
                </form>
            </aside>
        </div>
    );
}
