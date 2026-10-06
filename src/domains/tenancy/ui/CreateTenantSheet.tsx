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
    ChefHat,
    Coffee,
    CakeSlice,
    Wine,
    ArrowLeft,
    ArrowRight,
    Plus,
} from "lucide-react";
// lucide icons used by the provision wizard only
import { useCreateSuperAdminTenantMutation } from "@/context/services/superAdminApi";
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
    provisionCompanySchema,
    provisionLocationSchema,
    provisionManagerSchema,
    provisionOpsSchema,
    provisionTenantDefaults,
    provisionTenantSchema,
    type ProvisionTenantValues,
} from "@/lib/validators/provisionTenant";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface CreateTenantSheetProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CITIES = ["Addis Ababa", "Hawassa", "Adama", "Bahir Dar", "Dire Dawa"];

type StepId = "company" | "location" | "manager" | "ops";

const STEP_FIELDS: Record<StepId, (keyof ProvisionTenantValues)[]> = {
    company: ["name", "legalName", "concept", "planCode"],
    location: [
        "branchName",
        "branchCode",
        "city",
        "area",
        "address",
        "hours",
        "serviceMode",
    ],
    manager: [
        "ownerName",
        "ownerEmail",
        "ownerPhone",
        "ownerPassword",
        "managerName",
        "managerEmail",
        "managerPhone",
        "managerPassword",
    ],
    ops: ["tableCount", "activeStations"],
};

const fieldClass =
    "h-9 rounded-[10px] border-hairline bg-card text-[13px] focus-visible:border-foreground/30 focus-visible:ring-foreground/10";

export default function CreateTenantSheet({
    open,
    onClose,
    onSuccess,
}: CreateTenantSheetProps) {
    const t = useTranslations("tenancy");
    const [createTenant, { isLoading }] = useCreateSuperAdminTenantMutation();
    const { data: plansRes, isLoading: plansLoading } =
        useListPlatformPlansQuery(undefined, { skip: !open });
    const catalog = plansRes?.data ?? [];
    const [activeTab, setActiveTab] = useState<StepId>("company");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [customName, setCustomName] = useState("");
    const [customStations, setCustomStations] = useState<
        { code: string; name: string }[]
    >([]);

    const form = useForm<ProvisionTenantValues>({
        defaultValues: provisionTenantDefaults,
        mode: "onTouched",
    });

    const PLANS = catalog;

    const STATIONS_PRESET = useMemo(
        () => [
            {
                id: "KITCHEN" as const,
                label: t("stationsPreset.kitchen"),
                icon: ChefHat,
            },
            {
                id: "BARISTA" as const,
                label: t("stationsPreset.barista"),
                icon: Coffee,
            },
            {
                id: "CAKES" as const,
                label: t("stationsPreset.cakes"),
                icon: CakeSlice,
            },
            {
                id: "SOFT_DRINKS" as const,
                label: t("stationsPreset.softDrinks"),
                icon: Wine,
            },
        ],
        [t],
    );

    const STEPS = useMemo(
        () =>
            [
                {
                    id: "company" as const,
                    label: t("create.steps.company.label"),
                    short: t("create.steps.company.short"),
                    icon: Building2,
                    title: t("create.steps.company.title"),
                    description: t("create.steps.company.description"),
                },
                {
                    id: "location" as const,
                    label: t("create.steps.location.label"),
                    short: t("create.steps.location.short"),
                    icon: MapPin,
                    title: t("create.steps.location.title"),
                    description: t("create.steps.location.description"),
                },
                {
                    id: "manager" as const,
                    label: t("create.steps.manager.label"),
                    short: t("create.steps.manager.short"),
                    icon: UserCheck,
                    title: t("create.steps.manager.title"),
                    description: t("create.steps.manager.description"),
                },
                {
                    id: "ops" as const,
                    label: t("create.steps.ops.label"),
                    short: t("create.steps.ops.short"),
                    icon: UtensilsCrossed,
                    title: t("create.steps.ops.title"),
                    description: t("create.steps.ops.description"),
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
                    value: "Fine Dining & Wine Bar",
                    label: t("concepts.fineDiningWineBar"),
                },
                {
                    value: "Cafe & Roastery",
                    label: t("concepts.cafeRoastery"),
                },
                {
                    value: "Grill & Bistro",
                    label: t("concepts.grillBistro"),
                },
                {
                    value: "Lounge & Nightclub",
                    label: t("concepts.loungeNightclub"),
                },
                {
                    value: "Fast Casual",
                    label: t("concepts.fastCasual"),
                },
            ] as const,
        [t],
    );

    const values = form.watch();
    const stepIndex = STEPS.findIndex(step => step.id === activeTab);
    const currentStep = STEPS[stepIndex] ?? STEPS[0];
    const progress = ((stepIndex + 1) / STEPS.length) * 100;

    useEffect(() => {
        if (!open) return;
        form.reset(provisionTenantDefaults);
        setActiveTab("company");
        setErrorMsg(null);
        setCustomName("");
        setCustomStations([]);
    }, [open, form]);

    useEffect(() => {
        if (!open || catalog.length === 0) return;
        const current = form.getValues("planCode");
        if (!catalog.some(plan => plan.code === current)) {
            form.setValue("planCode", catalog[0].code, {
                shouldValidate: true,
            });
        }
    }, [open, catalog, form]);

    if (!open) return null;

    function stationCodeFromName(name: string): string {
        const used = new Set([
            ...STATIONS_PRESET.map(s => s.id),
            ...customStations.map(s => s.code),
        ]);
        const base =
            name
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, "_")
                .replace(/^_|_$/g, "")
                .slice(0, 20) || "STATION";
        let code = base;
        let n = 2;
        while (used.has(code)) {
            code = `${base}_${n}`;
            n += 1;
        }
        return code;
    }

    function addCustomStation(
        selected: string[],
        setSelected: (next: string[]) => void,
    ) {
        const name = customName.trim();
        if (name.length < 2) {
            setErrorMsg("Enter a station name (at least 2 characters).");
            return;
        }
        const code = stationCodeFromName(name);
        setCustomStations(prev => [...prev, { code, name }]);
        setSelected([...selected, code]);
        setCustomName("");
        setErrorMsg(null);
    }

    function removeCustomStation(
        code: string,
        selected: string[],
        setSelected: (next: string[]) => void,
    ) {
        setCustomStations(prev => prev.filter(s => s.code !== code));
        const next = selected.filter(id => id !== code);
        if (next.length === 0) return;
        setSelected(next);
    }

    function autofillFromBrand(brandName: string) {
        form.setValue("name", brandName, { shouldDirty: true });
        if (!form.getValues("branchName")?.trim() && brandName.trim()) {
            form.setValue(
                "branchName",
                `${brandName.trim()}${t("create.flagshipSuffix")}`,
            );
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
        const fields = STEP_FIELDS[activeTab];
        const valid = await form.trigger(fields);
        if (!valid) {
            const first = fields
                .map(name => form.getFieldState(name).error?.message)
                .find(Boolean);
            setErrorMsg(first || t("create.checkCompanyFields"));
            return;
        }

        if (activeTab === "company") {
            const parsed = provisionCompanySchema.safeParse(form.getValues());
            if (!parsed.success) {
                setErrorMsg(
                    parsed.error.issues[0]?.message ||
                        t("create.checkCompanyFields"),
                );
                return;
            }
            setActiveTab("location");
            return;
        }

        if (activeTab === "location") {
            const parsed = provisionLocationSchema.safeParse(form.getValues());
            if (!parsed.success) {
                setErrorMsg(
                    parsed.error.issues[0]?.message ||
                        t("create.checkBranchFields"),
                );
                return;
            }
            setActiveTab("manager");
            return;
        }

        if (activeTab === "manager") {
            const parsed = provisionManagerSchema.safeParse(form.getValues());
            if (!parsed.success) {
                setErrorMsg(
                    parsed.error.issues[0]?.message ||
                        t("create.checkManagerFields"),
                );
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
        if (activeTab !== "ops") {
            void goNext();
            return;
        }

        setErrorMsg(null);
        const parsed = provisionTenantSchema.safeParse(data);
        if (!parsed.success) {
            const message =
                parsed.error.issues[0]?.message || t("checkFormFields");
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
                    payload.ownerEmail?.trim() ||
                    payload.managerEmail?.trim() ||
                    `hello@${
                        payload.name
                            .trim()
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "") || "restaurant"
                    }.et`,
                ownerName: payload.ownerName.trim(),
                ownerEmail: payload.ownerEmail?.trim() || undefined,
                ownerPhone: payload.ownerPhone.trim(),
                ownerPassword: payload.ownerPassword,
                managerName: payload.managerName.trim(),
                managerEmail: payload.managerEmail?.trim() || undefined,
                managerPhone: payload.managerPhone.trim(),
                managerPassword: payload.managerPassword,
                branchName: payload.branchName.trim(),
                branchCode: payload.branchCode?.trim() || undefined,
                hours: payload.hours.trim(),
                serviceMode: payload.serviceMode,
                tableCount:
                    payload.serviceMode === "BAKERY" ? 1 : payload.tableCount,
                activeStations:
                    payload.serviceMode === "BAKERY"
                        ? ["COUNTER"]
                        : payload.activeStations,
                customStations:
                    customStations.length > 0 ? customStations : undefined,
            }).unwrap();

            toast.success(t("tenantProvisioned"), payload.name.trim());
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
                : errObj?.data?.message || t("failedToProvisionTenant");
            setErrorMsg(message);
            toast.error(message);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <button
                type="button"
                aria-label={t("create.ariaClose")}
                className="fixed inset-0 bg-black/55 backdrop-blur-[3px]"
                onClick={onClose}
            />

            <aside className="relative z-10 flex h-full w-full max-w-[56rem] flex-col border-l border-hairline bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="relative shrink-0 border-b border-hairline bg-card px-5 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                                className="h-full rounded-full bg-foreground transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t("create.ariaClose")}
                            className="rounded-full p-1.5 text-slate-gray transition-colors hover:bg-secondary hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>

                <nav className="shrink-0 border-b border-hairline px-4 py-2.5 sm:px-5">
                    <ol className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const done = index < stepIndex;
                            const current = step.id === activeTab;
                            return (
                                <li key={step.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (index > stepIndex) return;
                                            setErrorMsg(null);
                                            setActiveTab(step.id);
                                        }}
                                        className={cn(
                                            "flex w-full items-center gap-2 rounded-[12px] border px-2.5 py-2 text-left transition-colors",
                                            current
                                                ? "border-hairline bg-card"
                                                : done
                                                  ? "border-transparent bg-secondary/50"
                                                  : "cursor-default border-transparent opacity-60",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                                                current || done
                                                    ? "bg-foreground text-background"
                                                    : "bg-secondary text-slate-gray",
                                            )}
                                        >
                                            {done ? (
                                                <Check className="size-3 stroke-[3]" />
                                            ) : (
                                                <Icon className="size-3" />
                                            )}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-[11px] font-semibold text-foreground">
                                                {index + 1}. {step.short}
                                            </span>
                                            <span className="hidden truncate text-[10px] text-slate-gray sm:block">
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
                    <div className="mx-5 mt-3 flex items-center justify-between gap-3 rounded-[12px] border border-destructive/20 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                        <span>{errorMsg}</span>
                        <button
                            type="button"
                            onClick={() => setErrorMsg(null)}
                            className="shrink-0 text-[12px] font-semibold underline"
                        >
                            {t("dismiss")}
                        </button>
                    </div>
                ) : null}

                <Form {...form}>
                    <form
                        id="create-tenant-form"
                        onSubmit={e => {
                            e.preventDefault();
                            if (activeTab === "ops") {
                                void form.handleSubmit(
                                    values => void onSubmit(values),
                                )();
                            }
                        }}
                        onKeyDown={e => {
                            if (
                                e.key === "Enter" &&
                                (e.target as HTMLElement).tagName === "INPUT"
                            ) {
                                e.preventDefault();
                                if (activeTab !== "ops") {
                                    void goNext();
                                } else {
                                    void form.handleSubmit(
                                        values => void onSubmit(values),
                                    )();
                                }
                            }
                        }}
                        className="app-scroll flex min-h-0 flex-1 flex-col overflow-y-auto"
                    >
                        <div className="space-y-3.5 px-5 py-4">
                            <div>
                                <p className="text-[11px] font-medium text-slate-gray">
                                    {t("create.stepOf", {
                                        current: stepIndex + 1,
                                        total: STEPS.length,
                                    })}
                                </p>
                                <h3 className="mt-0.5 text-[16px] font-semibold tracking-tight">
                                    {currentStep.title}
                                </h3>
                                <p className="mt-0.5 max-w-2xl text-[12px] text-slate-gray">
                                    {currentStep.description}
                                </p>
                            </div>

                            {activeTab === "company" ? (
                                <div className="space-y-3.5 animate-in fade-in duration-200">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t(
                                                        "create.fields.brandName",
                                                    )}{" "}
                                                    <span className="text-foreground">
                                                        *
                                                    </span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t(
                                                            "create.fields.brandNamePlaceholder",
                                                        )}
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

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="legalName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "create.fields.legalName",
                                                        )}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t(
                                                                "create.fields.legalNamePlaceholder",
                                                            )}
                                                            className={
                                                                fieldClass
                                                            }
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
                                                        {t(
                                                            "create.fields.concept",
                                                        )}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <select
                                                            className={cn(
                                                                fieldClass,
                                                                "w-full border bg-card px-3",
                                                            )}
                                                            {...field}
                                                        >
                                                            {CONCEPT_OPTIONS.map(
                                                                option => (
                                                                    <option
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
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
                                                    {t(
                                                        "create.fields.subscriptionPlan",
                                                    )}
                                                </p>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    {plansLoading ? (
                                                        <p className="col-span-full text-[13px] text-slate-gray">
                                                            Loading plansâ€¦
                                                        </p>
                                                    ) : catalog.length === 0 ? (
                                                        <p className="col-span-full text-[13px] text-slate-gray">
                                                            No plans available.
                                                            Seed subscription
                                                            plans first.
                                                        </p>
                                                    ) : (
                                                        PLANS.map(plan => {
                                                            const selected =
                                                                field.value ===
                                                                plan.code;
                                                            return (
                                                                <button
                                                                    key={
                                                                        plan.code
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        field.onChange(
                                                                            plan.code,
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "relative rounded-[16px] border p-4 text-left transition-all",
                                                                        selected
                                                                            ? "border-foreground bg-secondary/60 ring-1 ring-foreground/15"
                                                                            : "border-hairline bg-card hover:border-foreground/20",
                                                                    )}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2 pr-6">
                                                                        <span className="text-[14px] font-semibold">
                                                                            {
                                                                                plan.name
                                                                            }
                                                                        </span>
                                                                        <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-gray">
                                                                            {
                                                                                plan.code
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-2 text-[14px] font-medium text-foreground">
                                                                        {
                                                                            plan.maxBranches
                                                                        }{" "}
                                                                        {plan.maxBranches ===
                                                                        1
                                                                            ? "branch"
                                                                            : "branches"}
                                                                    </p>
                                                                    <p className="mt-1 text-[12px] text-slate-gray">
                                                                        Max
                                                                        locations
                                                                        this
                                                                        restaurant
                                                                        can
                                                                        open.
                                                                    </p>
                                                                    {selected ? (
                                                                        <span className="absolute top-3.5 right-3 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                                                                            <Check className="size-3 stroke-[3]" />
                                                                        </span>
                                                                    ) : null}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    />
                                </div>
                            ) : null}

                            {activeTab === "location" ? (
                                <div className="space-y-3.5 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name="branchName"
                                            render={({ field }) => (
                                                <FormItem className="sm:col-span-2">
                                                    <FormLabel>
                                                        {t(
                                                            "create.fields.branchName",
                                                        )}{" "}
                                                        <span className="text-foreground">
                                                            *
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={
                                                                fieldClass
                                                            }
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
                                                        {t(
                                                            "create.fields.branchCode",
                                                        )}
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
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "create.fields.city",
                                                        )}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <select
                                                            className={cn(
                                                                fieldClass,
                                                                "w-full border bg-card px-3",
                                                            )}
                                                            {...field}
                                                        >
                                                            {CITIES.map(
                                                                city => (
                                                                    <option
                                                                        key={
                                                                            city
                                                                        }
                                                                        value={
                                                                            city
                                                                        }
                                                                    >
                                                                        {city}
                                                                    </option>
                                                                ),
                                                            )}
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
                                                        {t(
                                                            "create.fields.area",
                                                        )}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={
                                                                fieldClass
                                                            }
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
                                                    {t("create.fields.address")}{" "}
                                                    <span className="text-foreground">
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
                                                    {t("create.fields.hours")}
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
                                        name="serviceMode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Branch type
                                                </FormLabel>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(
                                                        [
                                                            [
                                                                "RESTAURANT",
                                                                "Restaurant",
                                                            ],
                                                            [
                                                                "BAKERY",
                                                                "Bakery",
                                                            ],
                                                        ] as const
                                                    ).map(([value, label]) => (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={() =>
                                                                field.onChange(
                                                                    value,
                                                                )
                                                            }
                                                            className={cn(
                                                                "h-9 rounded-[10px] border text-[13px] font-medium",
                                                                field.value ===
                                                                    value
                                                                    ? "border-foreground bg-foreground text-background"
                                                                    : "border-hairline bg-card",
                                                            )}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ) : null}

                            {activeTab === "manager" ? (
                                <div className="grid gap-3 md:grid-cols-2 animate-in fade-in duration-200">
                                    <div className="space-y-3 rounded-[12px] border border-hairline bg-card p-3.5">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-gray">
                                            {t("create.fields.ownerSection")}
                                        </p>
                                        <FormField
                                            control={form.control}
                                            name="ownerName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "create.fields.ownerFullName",
                                                        )}{" "}
                                                        <span className="text-foreground">
                                                            *
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={
                                                                fieldClass
                                                            }
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ownerEmail"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "create.fields.ownerEmail",
                                                        )}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            className={
                                                                fieldClass
                                                            }
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ownerPhone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "create.fields.ownerPhone",
                                                        )}{" "}
                                                        <span className="text-foreground">
                                                            *
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <EthiopianPhoneInput
                                                            value={field.value}
                                                            onChange={
                                                                field.onChange
                                                            }
                                                            onBlur={
                                                                field.onBlur
                                                            }
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
                                            name="ownerPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "create.fields.ownerPassword",
                                                        )}{" "}
                                                        <span className="text-foreground">
                                                            *
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            autoComplete="new-password"
                                                            placeholder="Min. 8 characters"
                                                            className={cn(
                                                                fieldClass,
                                                                "font-mono",
                                                            )}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                    <PasswordLiveChecks
                                                        value={
                                                            values.ownerPassword
                                                        }
                                                    />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-3 rounded-[12px] border border-hairline bg-card p-3.5">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-gray">
                                            {t("create.fields.managerSection")}
                                        </p>
                                        <FormField
                                            control={form.control}
                                            name="managerName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "create.fields.managerFullName",
                                                        )}{" "}
                                                        <span className="text-foreground">
                                                            *
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={
                                                                fieldClass
                                                            }
                                                            {...field}
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
                                                        {t(
                                                            "create.fields.workEmail",
                                                        )}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            className={
                                                                fieldClass
                                                            }
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
                                                        {t(
                                                            "create.fields.phone",
                                                        )}{" "}
                                                        <span className="text-foreground">
                                                            *
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <EthiopianPhoneInput
                                                            value={field.value}
                                                            onChange={
                                                                field.onChange
                                                            }
                                                            onBlur={
                                                                field.onBlur
                                                            }
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
                                            name="managerPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "create.fields.temporaryPassword",
                                                        )}{" "}
                                                        <span className="text-foreground">
                                                            *
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            autoComplete="new-password"
                                                            placeholder="Min. 8 characters"
                                                            className={cn(
                                                                fieldClass,
                                                                "font-mono",
                                                            )}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                    <PasswordLiveChecks
                                                        value={
                                                            values.managerPassword
                                                        }
                                                    />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {activeTab === "ops" ? (
                                <div className="space-y-3.5 animate-in fade-in duration-200">
                                    <FormField
                                        control={form.control}
                                        name="tableCount"
                                        render={({ field }) => (
                                            <FormItem className="rounded-[12px] border border-hairline bg-card p-3">
                                                <FormLabel>
                                                    {t(
                                                        "create.fields.initialTables",
                                                    )}
                                                </FormLabel>
                                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={60}
                                                            className="h-9 w-24 rounded-[10px] text-[13px] font-semibold"
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
                                                        {t(
                                                            "create.fields.initialTablesHint",
                                                            {
                                                                tableCount:
                                                                    values.tableCount,
                                                            },
                                                        )}
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
                                                    {t(
                                                        "create.fields.activeKdsStations",
                                                    )}
                                                </p>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    {STATIONS_PRESET.map(
                                                        station => {
                                                            const active =
                                                                field.value.includes(
                                                                    station.id,
                                                                );
                                                            const Icon =
                                                                station.icon;
                                                            return (
                                                                <button
                                                                    key={
                                                                        station.id
                                                                    }
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (
                                                                            active
                                                                        ) {
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
                                                                        "flex items-center justify-between rounded-[12px] border p-2.5 text-left transition-all",
                                                                        active
                                                                            ? "border-foreground bg-secondary/50"
                                                                            : "border-hairline bg-card hover:border-foreground/20",
                                                                    )}
                                                                >
                                                                    <span className="flex items-center gap-3">
                                                                        <span
                                                                            className={cn(
                                                                                "flex size-8 items-center justify-center rounded-[10px]",
                                                                                active
                                                                                    ? "bg-foreground text-background"
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
                                                                                {t(
                                                                                    "create.fields.kdsQueueHint",
                                                                                )}
                                                                            </span>
                                                                        </span>
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            "flex size-4 items-center justify-center rounded border",
                                                                            active
                                                                                ? "border-foreground bg-foreground text-background"
                                                                                : "border-hairline bg-secondary",
                                                                        )}
                                                                    >
                                                                        {active ? (
                                                                            <Check className="size-3.5 stroke-[3]" />
                                                                        ) : null}
                                                                    </span>
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                                {form.formState.errors
                                                    .activeStations ? (
                                                    <p className="mt-2 text-[12px] text-destructive">
                                                        {
                                                            form.formState
                                                                .errors
                                                                .activeStations
                                                                .message
                                                        }
                                                    </p>
                                                ) : null}

                                                <div className="mt-3 flex gap-2">
                                                    <Input
                                                        value={customName}
                                                        onChange={e =>
                                                            setCustomName(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Custom station name"
                                                        className={fieldClass}
                                                        onKeyDown={e => {
                                                            if (
                                                                e.key ===
                                                                "Enter"
                                                            ) {
                                                                e.preventDefault();
                                                                addCustomStation(
                                                                    field.value,
                                                                    field.onChange,
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            addCustomStation(
                                                                field.value,
                                                                field.onChange,
                                                            )
                                                        }
                                                        className="inline-flex h-9 shrink-0 items-center gap-1 rounded-[10px] border border-hairline px-3 text-[12px] font-medium hover:bg-secondary"
                                                    >
                                                        <Plus className="size-3.5" />
                                                        Add
                                                    </button>
                                                </div>

                                                {customStations.length > 0 ? (
                                                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                        {customStations.map(
                                                            station => {
                                                                const active =
                                                                    field.value.includes(
                                                                        station.code,
                                                                    );
                                                                return (
                                                                    <div
                                                                        key={
                                                                            station.code
                                                                        }
                                                                        className={cn(
                                                                            "flex items-center justify-between rounded-[12px] border px-3 py-2",
                                                                            active
                                                                                ? "border-foreground bg-secondary/50"
                                                                                : "border-hairline",
                                                                        )}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            className="min-w-0 text-left"
                                                                            onClick={() => {
                                                                                if (
                                                                                    active
                                                                                ) {
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
                                                                                                station.code,
                                                                                        ),
                                                                                    );
                                                                                } else {
                                                                                    field.onChange(
                                                                                        [
                                                                                            ...field.value,
                                                                                            station.code,
                                                                                        ],
                                                                                    );
                                                                                }
                                                                            }}
                                                                        >
                                                                            <span className="block truncate text-[13px] font-semibold">
                                                                                {
                                                                                    station.name
                                                                                }
                                                                            </span>
                                                                            <span className="font-mono text-[10px] text-slate-gray">
                                                                                {
                                                                                    station.code
                                                                                }
                                                                            </span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeCustomStation(
                                                                                    station.code,
                                                                                    field.value,
                                                                                    field.onChange,
                                                                                )
                                                                            }
                                                                            className="rounded-full p-1 text-slate-gray hover:bg-secondary hover:text-foreground"
                                                                            aria-label={`Remove ${station.name}`}
                                                                        >
                                                                            <X className="size-3.5" />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </form>
                </Form>

                <div className="flex shrink-0 flex-col gap-2 border-t border-hairline bg-card/90 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="order-3 rounded-full px-3 py-1.5 text-[12px] font-medium text-slate-gray hover:bg-secondary sm:order-1"
                    >
                        {t("cancel")}
                    </button>

                    <div className="order-1 flex items-center justify-end gap-2 sm:order-2">
                        {activeTab !== "company" ? (
                            <button
                                type="button"
                                onClick={goBack}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-hairline bg-card px-3 text-[12px] font-medium hover:bg-secondary"
                            >
                                <ArrowLeft className="size-3.5" />
                                {t("back")}
                            </button>
                        ) : null}

                        {activeTab !== "ops" ? (
                            <button
                                key="btn-step-next"
                                type="button"
                                onClick={() => void goNext()}
                                className="inline-flex h-8 min-w-[96px] items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-[12px] font-semibold text-background hover:bg-foreground/90"
                            >
                                {t("next")}
                                <ArrowRight className="size-3.5" />
                            </button>
                        ) : (
                            <button
                                key="btn-step-submit"
                                type="button"
                                onClick={() => {
                                    void form.handleSubmit(
                                        values => void onSubmit(values),
                                    )();
                                }}
                                disabled={isLoading}
                                className="inline-flex h-8 min-w-[140px] items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-[12px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        {t("create.provisioning")}
                                    </>
                                ) : (
                                    <>
                                        <Layers className="size-3.5" />
                                        {t("create.provisionTenant")}
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
