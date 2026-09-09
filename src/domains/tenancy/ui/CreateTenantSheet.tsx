"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    X,
    Building2,
    MapPin,
    UserCheck,
    UtensilsCrossed,
    Check,
    Loader2,
    Layers,
    Sparkles,
    ChefHat,
    Coffee,
    CakeSlice,
    Wine,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import { useCreateSuperAdminTenantMutation } from "@/context/services/superAdminApi";
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
    maskEthiopianPhone,
    provisionCompanySchema,
    provisionLocationSchema,
    provisionManagerSchema,
    provisionOpsSchema,
    provisionTenantDefaults,
    provisionTenantSchema,
    type ProvisionTenantValues,
} from "@/lib/validators/provisionTenant";
import { cn } from "@/lib/utils";

interface CreateTenantSheetProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const PLANS = [
    {
        code: "STARTER" as const,
        name: "Starter",
        price: "ETB 2,400/mo",
        badge: "1 Branch",
        desc: "Single location & cash ops",
    },
    {
        code: "PRO" as const,
        name: "Pro Tier",
        price: "ETB 6,800/mo",
        badge: "Recommended",
        desc: "Multi-station KDS & analytics",
    },
    {
        code: "GROWTH" as const,
        name: "Growth",
        price: "ETB 14,500/mo",
        badge: "Up to 5 Branches",
        desc: "Multi-branch & daily close",
    },
    {
        code: "ENTERPRISE" as const,
        name: "Enterprise",
        price: "Custom",
        badge: "Unlimited",
        desc: "Dedicated SLA & multi-brand",
    },
];

const STATIONS_PRESET = [
    { id: "KITCHEN", label: "Kitchen Station", icon: ChefHat },
    { id: "BARISTA", label: "Barista Station", icon: Coffee },
    { id: "CAKES", label: "Cakes & Pastry", icon: CakeSlice },
    { id: "SOFT_DRINKS", label: "Soft Drinks & Bar", icon: Wine },
];

const CITIES = ["Addis Ababa", "Hawassa", "Adama", "Bahir Dar", "Dire Dawa"];

type StepId = "company" | "location" | "manager" | "ops";

const STEPS: Array<{
    id: StepId;
    label: string;
    short: string;
    icon: typeof Building2;
    title: string;
    description: string;
}> = [
    {
        id: "company",
        label: "Company & Plan",
        short: "Company",
        icon: Building2,
        title: "Company & subscription",
        description:
            "Brand identity and the SLA plan this restaurant will run on.",
    },
    {
        id: "location",
        label: "Branch & Location",
        short: "Branch",
        icon: MapPin,
        title: "Primary branch",
        description:
            "Flagship location, city, and operating hours for day-one floor ops.",
    },
    {
        id: "manager",
        label: "House Manager",
        short: "Manager",
        icon: UserCheck,
        title: "House manager account",
        description:
            "Login that unlocks staff, shifts, approvals, and daily close.",
    },
    {
        id: "ops",
        label: "Floor & KDS",
        short: "Floor",
        icon: UtensilsCrossed,
        title: "Floor & KDS stations",
        description:
            "Seed tables and the preparation stations that will receive tickets.",
    },
];

const fieldClass =
    "h-11 rounded-[12px] border-hairline bg-card text-[14px] focus-visible:border-brand/40 focus-visible:ring-brand/20";

export default function CreateTenantSheet({
    open,
    onClose,
    onSuccess,
}: CreateTenantSheetProps) {
    const [createTenant, { isLoading }] = useCreateSuperAdminTenantMutation();
    const [activeTab, setActiveTab] = useState<StepId>("company");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const form = useForm<ProvisionTenantValues>({
        defaultValues: provisionTenantDefaults,
        mode: "onSubmit",
    });

    const values = form.watch();
    const stepIndex = STEPS.findIndex(step => step.id === activeTab);
    const currentStep = STEPS[stepIndex] ?? STEPS[0];
    const progress = ((stepIndex + 1) / STEPS.length) * 100;

    const planLabel = useMemo(
        () => PLANS.find(plan => plan.code === values.planCode)?.name ?? values.planCode,
        [values.planCode],
    );

    useEffect(() => {
        if (!open) return;
        form.reset(provisionTenantDefaults);
        setActiveTab("company");
        setErrorMsg(null);
    }, [open, form]);

    if (!open) return null;

    function autofillFromBrand(brandName: string) {
        form.setValue("name", brandName, { shouldDirty: true });
        if (!form.getValues("branchName")?.trim() && brandName.trim()) {
            form.setValue("branchName", `${brandName.trim()} Flagship`);
        }
        if (!form.getValues("branchCode")?.trim() && brandName.trim()) {
            const prefix = brandName
                .trim()
                .slice(0, 3)
                .toUpperCase()
                .replace(/[^A-Z]/g, "ADD");
            form.setValue("branchCode", `${prefix}-1`);
        }
        if (!form.getValues("address")?.trim() && brandName.trim()) {
            form.setValue(
                "address",
                `${brandName.trim()}, ${form.getValues("area") || "Bole"}, ${form.getValues("city") || "Addis Ababa"}`,
            );
        }
    }

    async function goNext() {
        setErrorMsg(null);
        const current = form.getValues();

        if (activeTab === "company") {
            const parsed = provisionCompanySchema.safeParse(current);
            if (!parsed.success) {
                const message = parsed.error.issues[0]?.message || "Check company fields.";
                setErrorMsg(message);
                toast.error(message);
                for (const issue of parsed.error.issues) {
                    const path = issue.path[0];
                    if (typeof path === "string") {
                        form.setError(path as keyof ProvisionTenantValues, {
                            message: issue.message,
                        });
                    }
                }
                return;
            }
            setActiveTab("location");
            return;
        }

        if (activeTab === "location") {
            const parsed = provisionLocationSchema.safeParse(current);
            if (!parsed.success) {
                const message = parsed.error.issues[0]?.message || "Check branch fields.";
                setErrorMsg(message);
                toast.error(message);
                for (const issue of parsed.error.issues) {
                    const path = issue.path[0];
                    if (typeof path === "string") {
                        form.setError(path as keyof ProvisionTenantValues, {
                            message: issue.message,
                        });
                    }
                }
                return;
            }
            setActiveTab("manager");
            return;
        }

        if (activeTab === "manager") {
            const parsed = provisionManagerSchema.safeParse(current);
            if (!parsed.success) {
                const message = parsed.error.issues[0]?.message || "Check manager fields.";
                setErrorMsg(message);
                toast.error(message);
                for (const issue of parsed.error.issues) {
                    const path = issue.path[0];
                    if (typeof path === "string") {
                        form.setError(path as keyof ProvisionTenantValues, {
                            message: issue.message,
                        });
                    }
                }
                return;
            }
            setActiveTab("ops");
        }
    }

    function goBack() {
        setErrorMsg(null);
        if (activeTab === "location") setActiveTab("company");
        if (activeTab === "manager") setActiveTab("location");
        if (activeTab === "ops") setActiveTab("manager");
    }

    async function onSubmit(data: ProvisionTenantValues) {
        setErrorMsg(null);
        const parsed = provisionTenantSchema.safeParse(data);
        if (!parsed.success) {
            const message =
                parsed.error.issues[0]?.message || "Check the form fields.";
            setErrorMsg(message);
            toast.error(message);
            for (const issue of parsed.error.issues) {
                const path = issue.path[0];
                if (typeof path === "string") {
                    form.setError(path as keyof ProvisionTenantValues, {
                        message: issue.message,
                    });
                }
            }
            return;
        }

        const payload = parsed.data;
        try {
            await createTenant({
                name: payload.name.trim(),
                legalName: payload.legalName?.trim() || undefined,
                concept: payload.concept.trim(),
                planCode: payload.planCode,
                city: payload.city.trim(),
                area: payload.area.trim(),
                address: payload.address.trim(),
                phone: payload.managerPhone.trim(),
                email:
                    payload.managerEmail?.trim() ||
                    `hello@${payload.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "") || "restaurant"}.et`,
                managerName: payload.managerName.trim(),
                managerEmail: payload.managerEmail?.trim() || undefined,
                managerPhone: payload.managerPhone.trim(),
                managerPassword: payload.managerPassword,
                branchName: payload.branchName.trim(),
                branchCode: payload.branchCode?.trim() || undefined,
                hours: payload.hours.trim(),
                tableCount: payload.tableCount,
                activeStations: payload.activeStations,
            }).unwrap();

            toast.success("Tenant provisioned", payload.name.trim());
            onSuccess?.();
            onClose();
        } catch (err: unknown) {
            const errObj = err as {
                data?: {
                    message?: string | string[];
                    errors?: Record<string, string>;
                };
            };
            const message = Array.isArray(errObj?.data?.message)
                ? errObj.data.message.join(", ")
                : errObj?.data?.message ||
                  "Failed to provision tenant. Please check required fields.";
            setErrorMsg(message);
            toast.error(message);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <button
                type="button"
                aria-label="Close provision sheet"
                className="fixed inset-0 bg-black/55 backdrop-blur-[3px]"
                onClick={onClose}
            />

            <aside className="relative z-10 flex h-full w-full max-w-[58rem] flex-col border-l border-hairline bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="relative shrink-0 overflow-hidden border-b border-hairline bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_55%),var(--card)] px-7 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="mt-0.5 flex size-11 items-center justify-center rounded-[14px] bg-brand text-white shadow-sm">
                                <Building2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">
                                    Super admin
                                </p>
                                <h2 className="mt-0.5 text-[20px] font-semibold tracking-tight text-foreground">
                                    Provision new tenant
                                </h2>
                                <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-gray">
                                    Create company, branch, manager login, and day-one
                                    floor / KDS setup.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-2 text-slate-gray transition-colors hover:bg-secondary hover:text-foreground"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                    <div className="mt-5 h-1 overflow-hidden rounded-full bg-secondary">
                        <div
                            className="h-full rounded-full bg-brand transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <nav className="shrink-0 border-b border-hairline bg-surface-ivory/70 px-5 py-3 sm:px-7">
                    <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const done = index < stepIndex;
                            const current = step.id === activeTab;
                            return (
                                <li key={step.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setErrorMsg(null);
                                            setActiveTab(step.id);
                                        }}
                                        className={cn(
                                            "flex w-full items-center gap-2.5 rounded-[14px] border px-3 py-2.5 text-left transition-all",
                                            current
                                                ? "border-brand/30 bg-card shadow-xs ring-1 ring-brand/15"
                                                : done
                                                  ? "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                                                  : "border-transparent hover:bg-card/70",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                                                current
                                                    ? "bg-brand text-white"
                                                    : done
                                                      ? "bg-emerald-600 text-white"
                                                      : "bg-secondary text-slate-gray",
                                            )}
                                        >
                                            {done ? (
                                                <Check className="size-3.5 stroke-[3]" />
                                            ) : (
                                                <Icon className="size-3.5" />
                                            )}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-[12px] font-semibold text-foreground">
                                                {index + 1}. {step.short}
                                            </span>
                                            <span className="hidden truncate text-[11px] text-slate-gray sm:block">
                                                {step.label}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </nav>

                {errorMsg ? (
                    <div className="mx-7 mt-4 flex items-center justify-between gap-3 rounded-[14px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
                        <span>{errorMsg}</span>
                        <button
                            type="button"
                            onClick={() => setErrorMsg(null)}
                            className="shrink-0 text-[12px] font-semibold underline"
                        >
                            Dismiss
                        </button>
                    </div>
                ) : null}

                <Form {...form}>
                    <form
                        id="create-tenant-form"
                        onSubmit={form.handleSubmit(values => void onSubmit(values))}
                        className="app-scroll flex min-h-0 flex-1 flex-col overflow-y-auto"
                    >
                        <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_250px]">
                            <div className="space-y-5 px-7 py-6">
                                <div>
                                    <p className="text-[12px] font-medium text-slate-gray">
                                        Step {stepIndex + 1} of {STEPS.length}
                                    </p>
                                    <h3 className="mt-1 text-[18px] font-semibold tracking-tight">
                                        {currentStep.title}
                                    </h3>
                                    <p className="mt-1 max-w-2xl text-[13px] text-slate-gray">
                                        {currentStep.description}
                                    </p>
                                </div>

                                {activeTab === "company" ? (
                                    <div className="space-y-5 animate-in fade-in duration-200">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Restaurant brand name{" "}
                                                        <span className="text-brand">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. Abyssinia Grill & Lounge"
                                                            className={fieldClass}
                                                            {...field}
                                                            onChange={e =>
                                                                autofillFromBrand(
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="legalName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Legal entity name
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g. Abyssinia Hospitality PLC"
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
                                                    <FormItem>
                                                        <FormLabel>
                                                            Culinary concept
                                                        </FormLabel>
                                                        <FormControl>
                                                            <select
                                                                className={cn(
                                                                    fieldClass,
                                                                    "w-full border bg-card px-3",
                                                                )}
                                                                {...field}
                                                            >
                                                                <option value="Casual Dining">
                                                                    Casual Dining
                                                                </option>
                                                                <option value="Fine Dining & Wine Bar">
                                                                    Fine Dining & Wine Bar
                                                                </option>
                                                                <option value="Cafe & Roastery">
                                                                    Cafe & Roastery
                                                                </option>
                                                                <option value="Grill & Bistro">
                                                                    Grill & Bistro
                                                                </option>
                                                                <option value="Lounge & Nightclub">
                                                                    Lounge & Nightclub
                                                                </option>
                                                                <option value="Fast Casual">
                                                                    Fast Casual
                                                                </option>
                                                            </select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <Controller
                                            control={form.control}
                                            name="planCode"
                                            render={({ field }) => (
                                                <div>
                                                    <p className="mb-2.5 text-[13px] font-medium">
                                                        Subscription plan
                                                    </p>
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        {PLANS.map(plan => {
                                                            const selected =
                                                                field.value === plan.code;
                                                            return (
                                                                <button
                                                                    key={plan.code}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        field.onChange(
                                                                            plan.code,
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "relative rounded-[16px] border p-4 text-left transition-all",
                                                                        selected
                                                                            ? "border-brand bg-brand/[0.06] ring-1 ring-brand/30"
                                                                            : "border-hairline bg-card hover:border-foreground/20",
                                                                    )}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2 pr-6">
                                                                        <span className="text-[14px] font-semibold">
                                                                            {plan.name}
                                                                        </span>
                                                                        <span
                                                                            className={cn(
                                                                                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                                                selected
                                                                                    ? "bg-brand text-white"
                                                                                    : "bg-secondary text-slate-gray",
                                                                            )}
                                                                        >
                                                                            {plan.badge}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-2 text-[14px] font-medium text-brand">
                                                                        {plan.price}
                                                                    </p>
                                                                    <p className="mt-1 text-[12px] text-slate-gray">
                                                                        {plan.desc}
                                                                    </p>
                                                                    {selected ? (
                                                                        <span className="absolute top-3.5 right-3 flex size-5 items-center justify-center rounded-full bg-brand text-white">
                                                                            <Check className="size-3 stroke-[3]" />
                                                                        </span>
                                                                    ) : null}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    </div>
                                ) : null}

                                {activeTab === "location" ? (
                                    <div className="space-y-5 animate-in fade-in duration-200">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <FormField
                                                control={form.control}
                                                name="branchName"
                                                render={({ field }) => (
                                                    <FormItem className="sm:col-span-2">
                                                        <FormLabel>
                                                            Primary branch name{" "}
                                                            <span className="text-brand">
                                                                *
                                                            </span>
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
                                                            Branch code
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
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>City</FormLabel>
                                                        <FormControl>
                                                            <select
                                                                className={cn(
                                                                    fieldClass,
                                                                    "w-full border bg-card px-3",
                                                                )}
                                                                {...field}
                                                            >
                                                                {CITIES.map(city => (
                                                                    <option
                                                                        key={city}
                                                                        value={city}
                                                                    >
                                                                        {city}
                                                                    </option>
                                                                ))}
                                                            </select>
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
                                                            Area / district
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
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Street address{" "}
                                                        <span className="text-brand">
                                                            *
                                                        </span>
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
                                                <FormItem>
                                                    <FormLabel>
                                                        Operating hours
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
                                ) : null}

                                {activeTab === "manager" ? (
                                    <div className="space-y-5 animate-in fade-in duration-200">
                                        <FormField
                                            control={form.control}
                                            name="managerName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Full name{" "}
                                                        <span className="text-brand">
                                                            *
                                                        </span>
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
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="managerEmail"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Work email
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
                                                name="managerPhone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Phone{" "}
                                                            <span className="text-brand">
                                                                *
                                                            </span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                inputMode="tel"
                                                                placeholder="+251 91 234 5678"
                                                                className={fieldClass}
                                                                value={field.value}
                                                                onChange={e =>
                                                                    field.onChange(
                                                                        maskEthiopianPhone(
                                                                            e.target
                                                                                .value,
                                                                        ),
                                                                    )
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
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="managerPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Temporary password
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={cn(
                                                                fieldClass,
                                                                "font-mono",
                                                            )}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ) : null}

                                {activeTab === "ops" ? (
                                    <div className="space-y-5 animate-in fade-in duration-200">
                                        <FormField
                                            control={form.control}
                                            name="tableCount"
                                            render={({ field }) => (
                                                <FormItem className="rounded-[16px] border border-hairline bg-card p-4">
                                                    <FormLabel>
                                                        Initial dining tables
                                                    </FormLabel>
                                                    <div className="mt-2 flex flex-wrap items-center gap-3">
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={60}
                                                                className="h-11 w-28 rounded-[12px] text-[16px] font-semibold"
                                                                value={field.value}
                                                                onChange={e =>
                                                                    field.onChange(
                                                                        Number(
                                                                            e.target
                                                                                .value,
                                                                        ) || 1,
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>
                                                        <p className="text-[13px] text-slate-gray">
                                                            Provisions Table 1–
                                                            {values.tableCount} on Main
                                                            Floor.
                                                        </p>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Controller
                                            control={form.control}
                                            name="activeStations"
                                            render={({ field }) => (
                                                <div>
                                                    <p className="mb-2.5 text-[13px] font-medium">
                                                        Active KDS stations
                                                    </p>
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        {STATIONS_PRESET.map(station => {
                                                            const active =
                                                                field.value.includes(
                                                                    station.id,
                                                                );
                                                            const Icon = station.icon;
                                                            return (
                                                                <button
                                                                    key={station.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (active) {
                                                                            if (
                                                                                field
                                                                                    .value
                                                                                    .length ===
                                                                                1
                                                                            )
                                                                                return;
                                                                            field.onChange(
                                                                                field.value.filter(
                                                                                    id =>
                                                                                        id !==
                                                                                        station.id,
                                                                                ),
                                                                            );
                                                                        } else {
                                                                            field.onChange(
                                                                                [
                                                                                    ...field.value,
                                                                                    station.id,
                                                                                ],
                                                                            );
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "flex items-center justify-between rounded-[16px] border p-3.5 text-left transition-all",
                                                                        active
                                                                            ? "border-brand bg-brand/[0.06] ring-1 ring-brand/20"
                                                                            : "border-hairline bg-card hover:border-foreground/20",
                                                                    )}
                                                                >
                                                                    <span className="flex items-center gap-3">
                                                                        <span
                                                                            className={cn(
                                                                                "flex size-10 items-center justify-center rounded-[12px]",
                                                                                active
                                                                                    ? "bg-brand text-white"
                                                                                    : "bg-secondary text-slate-gray",
                                                                            )}
                                                                        >
                                                                            <Icon className="size-4" />
                                                                        </span>
                                                                        <span>
                                                                            <span className="block text-[13px] font-semibold">
                                                                                {
                                                                                    station.label
                                                                                }
                                                                            </span>
                                                                            <span className="block text-[11px] text-slate-gray">
                                                                                KDS display
                                                                                queue
                                                                            </span>
                                                                        </span>
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            "flex size-5 items-center justify-center rounded-md border",
                                                                            active
                                                                                ? "border-brand bg-brand text-white"
                                                                                : "border-hairline bg-secondary",
                                                                        )}
                                                                    >
                                                                        {active ? (
                                                                            <Check className="size-3.5 stroke-[3]" />
                                                                        ) : null}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    {form.formState.errors
                                                        .activeStations ? (
                                                        <p className="mt-2 text-[12px] text-destructive">
                                                            {
                                                                form.formState.errors
                                                                    .activeStations
                                                                    .message
                                                            }
                                                        </p>
                                                    ) : null}
                                                </div>
                                            )}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            <aside className="hidden border-l border-hairline bg-surface-ivory/40 px-5 py-6 lg:block">
                                <div className="sticky top-6 space-y-4">
                                    <div className="flex items-center gap-2 text-[13px] font-semibold">
                                        <Sparkles className="size-4 text-brand" />
                                        Live summary
                                    </div>
                                    <dl className="space-y-3 text-[12px]">
                                        <div>
                                            <dt className="text-slate-gray">
                                                Restaurant
                                            </dt>
                                            <dd className="mt-0.5 font-medium">
                                                {values.name.trim() || "Untitled brand"}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-gray">Plan</dt>
                                            <dd className="mt-0.5 font-medium text-brand">
                                                {planLabel}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-gray">Branch</dt>
                                            <dd className="mt-0.5 font-medium">
                                                {values.branchName.trim() || "Not set"}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-gray">Manager</dt>
                                            <dd className="mt-0.5 font-medium">
                                                {values.managerName.trim() || "Not set"}
                                            </dd>
                                            <dd className="text-slate-gray">
                                                {values.managerPhone}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-gray">
                                                Floor setup
                                            </dt>
                                            <dd className="mt-0.5 font-medium">
                                                {values.tableCount} tables ·{" "}
                                                {values.activeStations.length} stations
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </aside>
                        </div>
                    </form>
                </Form>

                <div className="flex shrink-0 flex-col gap-3 border-t border-hairline bg-card/90 px-7 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="order-3 rounded-[12px] px-3 py-2.5 text-[13px] font-medium text-slate-gray hover:bg-secondary sm:order-1"
                    >
                        Cancel
                    </button>

                    <div className="order-1 flex items-center justify-end gap-2 sm:order-2">
                        {activeTab !== "company" ? (
                            <button
                                type="button"
                                onClick={goBack}
                                className="inline-flex items-center gap-1.5 rounded-[12px] border border-hairline bg-card px-4 py-2.5 text-[13px] font-medium hover:bg-secondary"
                            >
                                <ArrowLeft className="size-3.5" />
                                Back
                            </button>
                        ) : null}

                        {activeTab !== "ops" ? (
                            <button
                                type="button"
                                onClick={() => void goNext()}
                                className="inline-flex min-w-[132px] items-center justify-center gap-1.5 rounded-[12px] bg-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-brand/90"
                            >
                                Next
                                <ArrowRight className="size-3.5" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                form="create-tenant-form"
                                disabled={isLoading}
                                className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-[12px] bg-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Provisioning…
                                    </>
                                ) : (
                                    <>
                                        <Layers className="size-4" />
                                        Provision tenant
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
}
