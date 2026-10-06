"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { Building2, Loader2, MapPin, UserCheck, X } from "lucide-react";
import {
    type TenantDetail,
    useUpdateSuperAdminTenantMutation,
} from "@/context/services/superAdminApi";
import { useListPlatformPlansQuery } from "@/context/services/platformPlansApi";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EthiopianPhoneInput } from "@/components/ui/ethiopian-phone-input";
import { PasswordLiveChecks } from "@/components/ui/password-live-checks";
import { toast } from "@/lib/toast";
import {
    editTenantSchema,
    maskEthiopianPhone,
    type EditTenantValues,
} from "@/lib/validators/provisionTenant";
import { cn } from "@/lib/utils";

interface EditTenantSheetProps {
    open: boolean;
    tenant: TenantDetail;
    onClose: () => void;
    onSuccess?: () => void;
}

const fieldClass =
    "h-9 rounded-[10px] border-hairline bg-card text-[13px] focus-visible:border-foreground/30 focus-visible:ring-foreground/10";

function planCodeFromLabel(plan: string, codes: string[]): string {
    const normalized = plan.trim().toUpperCase();
    const exact = codes.find(code => code === normalized);
    if (exact) return exact;
    const byName = codes.find(code => normalized.includes(code));
    if (byName) return byName;
    return codes[0] ?? "PRO";
}

function valuesFromTenant(
    tenant: TenantDetail,
    codes: string[] = [],
): EditTenantValues {
    const primary = tenant.branchesList?.[0];
    return {
        name: tenant.name || "",
        legalName: tenant.legalName || "",
        concept: tenant.concept || "Casual Dining",
        planCode: planCodeFromLabel(tenant.plan || "PRO", codes),
        branchName: primary?.name || `${tenant.name} Main Branch`,
        branchCode: primary?.displayCode || "",
        city: tenant.city || "Addis Ababa",
        area: tenant.area || "Bole",
        address: tenant.address || "",
        hours: tenant.hours || "08:00 – 23:00",
        managerName: tenant.manager || "",
        managerEmail: tenant.managerEmail || "",
        managerPhone: maskEthiopianPhone(
            tenant.managerPhone || tenant.phone || "+251 ",
        ),
        managerPassword: "",
    };
}

export default function EditTenantSheet({
    open,
    tenant,
    onClose,
    onSuccess,
}: EditTenantSheetProps) {
    const t = useTranslations("tenancy");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [updateTenant, { isLoading }] = useUpdateSuperAdminTenantMutation();
    const { data: plansRes } = useListPlatformPlansQuery(undefined, {
        skip: !open,
    });
    const catalog = plansRes?.data ?? [];

    const CONCEPT_OPTIONS = useMemo(
        () =>
            [
                {
                    value: "Casual Dining",
                    label: t("concepts.casualDining"),
                },
                {
                    value: "Fine Dining",
                    label: t("concepts.fineDining"),
                },
                {
                    value: "Cafe & Roastery",
                    label: t("concepts.cafeRoastery"),
                },
                {
                    value: "Fast Casual",
                    label: t("concepts.fastCasual"),
                },
                {
                    value: "Bar & Grill",
                    label: t("concepts.barGrill"),
                },
                {
                    value: "Hotel Restaurant",
                    label: t("concepts.hotelRestaurant"),
                },
            ] as const,
        [t],
    );

    const form = useForm<EditTenantValues>({
        defaultValues: valuesFromTenant(tenant),
        mode: "onTouched",
    });

    useEffect(() => {
        if (!open) return;
        form.reset(
            valuesFromTenant(
                tenant,
                catalog.map(plan => plan.code),
            ),
        );
        setErrorMsg(null);
    }, [open, tenant, catalog, form]);

    if (!open) return null;

    async function onSubmit(data: EditTenantValues) {
        setErrorMsg(null);
        const parsed = editTenantSchema.safeParse(data);
        if (!parsed.success) {
            const message =
                parsed.error.issues[0]?.message || t("checkFormFields");
            setErrorMsg(message);
            for (const issue of parsed.error.issues) {
                const path = issue.path[0];
                if (typeof path === "string") {
                    form.setError(path as keyof EditTenantValues, {
                        message: issue.message,
                    });
                }
            }
            return;
        }

        const payload = parsed.data;
        try {
            await updateTenant({
                id: tenant.id,
                body: {
                    name: payload.name.trim(),
                    legalName: payload.legalName?.trim() || undefined,
                    concept: payload.concept.trim(),
                    planCode: payload.planCode,
                    city: payload.city.trim(),
                    area: payload.area.trim(),
                    address: payload.address.trim(),
                    hours: payload.hours.trim(),
                    phone: payload.managerPhone.trim(),
                    email:
                        payload.managerEmail?.trim() ||
                        tenant.email?.trim() ||
                        `hello@${
                            payload.name
                                .trim()
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "") || "restaurant"
                        }.et`,
                    managerName: payload.managerName.trim(),
                    managerEmail: payload.managerEmail?.trim() || undefined,
                    managerPhone: payload.managerPhone.trim(),
                    managerPassword:
                        payload.managerPassword?.trim() || undefined,
                    branchName: payload.branchName.trim(),
                    branchCode: payload.branchCode?.trim() || undefined,
                },
            }).unwrap();

            toast.success(t("tenantUpdated"), payload.name.trim());
            onSuccess?.();
            onClose();
        } catch (err: unknown) {
            const errObj = err as {
                data?: { message?: string | string[] };
            };
            const message = Array.isArray(errObj?.data?.message)
                ? errObj.data.message.join(", ")
                : errObj?.data?.message || t("failedToUpdateTenant");
            setErrorMsg(message);
            toast.fromUnknown(err, message);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <button
                type="button"
                aria-label={t("close")}
                className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
                onClick={onClose}
            />
            <aside className="relative z-10 flex h-full w-full max-w-[36rem] flex-col border-l border-hairline bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-gray">
                            {t("edit.eyebrow")}
                        </p>
                        <h2 className="mt-0.5 truncate text-[16px] font-semibold tracking-tight text-foreground">
                            {tenant.name}
                        </h2>
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            {t("edit.subtitle")}
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

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="app-scroll flex-1 space-y-5 overflow-y-auto px-5 py-4">
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-foreground">
                                    <Building2 className="size-3.5 text-slate-gray" />
                                    <h3 className="text-[12px] font-semibold">
                                        {t("edit.sectionCompany")}
                                    </h3>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.brandName")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={fieldClass}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="legalName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.legalName")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={fieldClass}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="concept"
                                        render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel>
                                                    {t("edit.concept")}
                                                </FormLabel>
                                                <FormControl>
                                                    <select
                                                        {...field}
                                                        className={cn(
                                                            fieldClass,
                                                            "w-full border bg-card px-3",
                                                        )}
                                                    >
                                                        {CONCEPT_OPTIONS.map(
                                                            c => (
                                                                <option
                                                                    key={
                                                                        c.value
                                                                    }
                                                                    value={
                                                                        c.value
                                                                    }
                                                                >
                                                                    {c.label}
                                                                </option>
                                                            ),
                                                        )}
                                                        {!CONCEPT_OPTIONS.some(
                                                            c =>
                                                                c.value ===
                                                                field.value,
                                                        ) &&
                                                            field.value && (
                                                                <option
                                                                    value={
                                                                        field.value
                                                                    }
                                                                >
                                                                    {
                                                                        field.value
                                                                    }
                                                                </option>
                                                            )}
                                                    </select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Controller
                                        control={form.control}
                                        name="planCode"
                                        render={({ field }) => (
                                            <div className="sm:col-span-2">
                                                <p className="mb-1.5 text-[13px] font-medium">
                                                    {t("edit.subscriptionPlan")}
                                                </p>
                                                <div className="grid gap-2 sm:grid-cols-3">
                                                    {catalog.map(plan => (
                                                        <button
                                                            key={plan.code}
                                                            type="button"
                                                            onClick={() =>
                                                                field.onChange(
                                                                    plan.code,
                                                                )
                                                            }
                                                            className={cn(
                                                                "rounded-[10px] border px-3 py-2 text-left text-[12px] transition-colors",
                                                                field.value ===
                                                                    plan.code
                                                                    ? "border-foreground bg-secondary/60"
                                                                    : "border-hairline text-slate-gray hover:bg-secondary/40",
                                                            )}
                                                        >
                                                            <span className="block font-medium text-foreground">
                                                                {plan.name}
                                                            </span>
                                                            <span className="mt-0.5 block text-[11px] text-slate-gray">
                                                                {
                                                                    plan.maxBranches
                                                                }{" "}
                                                                {plan.maxBranches ===
                                                                1
                                                                    ? "branch"
                                                                    : "branches"}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    />
                                </div>
                            </section>

                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-foreground">
                                    <MapPin className="size-3.5 text-slate-gray" />
                                    <h3 className="text-[12px] font-semibold">
                                        {t("edit.sectionLocationBranch")}
                                    </h3>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="branchName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.branchName")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={fieldClass}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="branchCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.branchCode")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={cn(
                                                            fieldClass,
                                                            "uppercase",
                                                        )}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.city")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={fieldClass}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="area"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.area")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={fieldClass}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel>
                                                    {t("edit.address")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={fieldClass}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="hours"
                                        render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel>
                                                    {t("edit.operatingHours")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={fieldClass}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>

                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-foreground">
                                    <UserCheck className="size-3.5 text-slate-gray" />
                                    <h3 className="text-[12px] font-semibold">
                                        {t("edit.sectionHouseManager")}
                                    </h3>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="managerName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.managerName")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={fieldClass}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="managerPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.phone")}
                                                </FormLabel>
                                                <FormControl>
                                                    <EthiopianPhoneInput
                                                        value={field.value}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        onBlur={field.onBlur}
                                                        name={field.name}
                                                        ref={field.ref}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="managerEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.loginEmail")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        className={fieldClass}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="managerPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.managerPassword")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        className={cn(
                                                            fieldClass,
                                                            "font-mono",
                                                        )}
                                                        placeholder={t(
                                                            "edit.managerPasswordPlaceholder",
                                                        )}
                                                        autoComplete="new-password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <p className="text-[11px] text-slate-gray">
                                                    {t(
                                                        "edit.managerPasswordHint",
                                                    )}
                                                </p>
                                                {field.value ? (
                                                    <PasswordLiveChecks
                                                        value={field.value}
                                                    />
                                                ) : null}
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>

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
                                {t("cancel")}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-4 text-[12px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : null}
                                {t("edit.saveChanges")}
                            </button>
                        </div>
                    </form>
                </Form>
            </aside>
        </div>
    );
}
