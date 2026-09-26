"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { Building2, Loader2, MapPin, UserCheck, X } from "lucide-react";
import {
    type TenantDetail,
    useUpdateSuperAdminTenantMutation,
} from "@/context/services/superAdminApi";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

function planCodeFromLabel(plan: string): EditTenantValues["planCode"] {
    const normalized = plan.trim().toUpperCase();
    if (normalized.includes("STARTER")) return "STARTER";
    if (normalized.includes("GROWTH")) return "GROWTH";
    if (normalized.includes("ENTERPRISE")) return "ENTERPRISE";
    return "PRO";
}

function valuesFromTenant(tenant: TenantDetail): EditTenantValues {
    const primary = tenant.branchesList?.[0];
    return {
        name: tenant.name || "",
        legalName: tenant.legalName || "",
        concept: tenant.concept || "Casual Dining",
        planCode: planCodeFromLabel(tenant.plan || "PRO"),
        branchName: primary?.name || `${tenant.name} Main Branch`,
        branchCode: primary?.displayCode || "",
        city: tenant.city || "Addis Ababa",
        area: tenant.area || "Bole",
        address: tenant.address || "",
        hours: tenant.hours || "08:00 – 23:00",
        managerName: tenant.manager || "",
        managerEmail: tenant.managerEmail || "",
        managerPhone: maskEthiopianPhone(
            tenant.managerPhone || tenant.phone || "+251 9",
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

    const PLANS = useMemo(
        () =>
            [
                { code: "STARTER" as const, name: t("plans.starter.name") },
                { code: "PRO" as const, name: t("plans.pro.name") },
                { code: "GROWTH" as const, name: t("plans.growth.name") },
                {
                    code: "ENTERPRISE" as const,
                    name: t("plans.enterprise.name"),
                },
            ] as const,
        [t],
    );

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
        mode: "onSubmit",
    });

    useEffect(() => {
        if (!open) return;
        form.reset(valuesFromTenant(tenant));
        setErrorMsg(null);
    }, [open, tenant, form]);

    if (!open) return null;

    async function onSubmit(data: EditTenantValues) {
        setErrorMsg(null);
        const parsed = editTenantSchema.safeParse(data);
        if (!parsed.success) {
            const message =
                parsed.error.issues[0]?.message || t("checkFormFields");
            setErrorMsg(message);
            toast.error(message);
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
            toast.error(message);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <button
                type="button"
                aria-label={t("close")}
                className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
                onClick={onClose}
            />
            <aside className="relative z-10 flex h-full w-full max-w-[52rem] flex-col border-l border-hairline bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                            {t("edit.eyebrow")}
                        </p>
                        <h2 className="mt-1 text-[22px] font-bold tracking-tight text-foreground">
                            {tenant.name}
                        </h2>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            {t("edit.subtitle")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-hairline p-2 text-slate-gray hover:bg-surface-ivory"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-foreground">
                                    <Building2 className="size-4 text-brand" />
                                    <h3 className="text-[15px] font-semibold">
                                        {t("edit.sectionCompany")}
                                    </h3>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.brandName")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
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
                                                    <Input {...field} />
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
                                                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px]"
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
                                                <p className="mb-2 text-[13px] font-medium">
                                                    {t("edit.subscriptionPlan")}
                                                </p>
                                                <div className="grid gap-2 sm:grid-cols-4">
                                                    {PLANS.map(plan => (
                                                        <button
                                                            key={plan.code}
                                                            type="button"
                                                            onClick={() =>
                                                                field.onChange(
                                                                    plan.code,
                                                                )
                                                            }
                                                            className={cn(
                                                                "rounded-xl border px-3 py-2.5 text-left text-[13px] transition-colors",
                                                                field.value ===
                                                                    plan.code
                                                                    ? "border-brand bg-brand/5 text-foreground"
                                                                    : "border-hairline text-slate-gray hover:bg-surface-ivory",
                                                            )}
                                                        >
                                                            {plan.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    />
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-foreground">
                                    <MapPin className="size-4 text-brand" />
                                    <h3 className="text-[15px] font-semibold">
                                        {t("edit.sectionLocationBranch")}
                                    </h3>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="branchName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.branchName")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
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
                                                    <Input {...field} />
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
                                                    <Input {...field} />
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
                                                    <Input {...field} />
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
                                                    <Input {...field} />
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
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-foreground">
                                    <UserCheck className="size-4 text-brand" />
                                    <h3 className="text-[15px] font-semibold">
                                        {t("edit.sectionHouseManager")}
                                    </h3>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="managerName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t("edit.managerName")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
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
                                                    <Input
                                                        {...field}
                                                        onChange={e =>
                                                            field.onChange(
                                                                maskEthiopianPhone(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
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
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>

                            {errorMsg && (
                                <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                                    {errorMsg}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-hairline px-6 py-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-hairline px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-surface-ivory"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
                            >
                                {isLoading && (
                                    <Loader2 className="size-4 animate-spin" />
                                )}
                                {t("edit.saveChanges")}
                            </button>
                        </div>
                    </form>
                </Form>
            </aside>
        </div>
    );
}
