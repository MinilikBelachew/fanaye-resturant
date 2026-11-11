"use client";

import { use, useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import {
    ArrowLeft,
    Building2,
    ChefHat,
    Check,
    Pencil,
    Store,
    Users,
    X,
    Clock,
    Hash,
    Globe,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import {
    useListBranchesQuery,
    useUpdateBranchMutation,
    type BranchDto,
} from "@/context/services/branchesApi";
import { useAppSelector } from "@/context/hooks";
import { cn } from "@/lib/utils";

// ── Zod schema for inline edits ───────────────────────────────────────────────
const editSchema = z.object({
    name: z.string().trim().min(2, "Name is required").max(80),
    displayCode: z
        .string()
        .trim()
        .max(8, "Max 8 characters")
        .regex(/^[A-Za-z0-9]*$/, "Letters and numbers only")
        .optional()
        .or(z.literal("")),
    serviceMode: z.enum(["RESTAURANT", "BAKERY"]),
});
type EditValues = z.infer<typeof editSchema>;

// ── Small reusable inline-edit row ───────────────────────────────────────────
function DetailRow({
    icon: Icon,
    label,
    value,
    muted,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    muted?: boolean;
}) {
    return (
        <div className="flex items-start gap-3 py-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Icon className="size-4 text-slate-gray" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-gray">{label}</p>
                <p
                    className={cn(
                        "mt-0.5 text-[14px]",
                        muted
                            ? "text-slate-gray"
                            : "font-medium text-foreground",
                    )}
                >
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BranchDetailPage({
    params,
}: {
    params: Promise<{ branchId: string }>;
}) {
    const { branchId } = use(params);
    const t = useTranslations("owner");
    const tCommon = useTranslations("common");
    const router = useRouter();
    const session = useAppSelector(state => state.identity.session);

    const { data: branchesRes, isLoading } = useListBranchesQuery();
    const [updateBranch, { isLoading: saving }] = useUpdateBranchMutation();

    const branch = branchesRes?.data.find(b => b.id === branchId) as
        | BranchDto
        | undefined;

    const [editing, setEditing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<EditValues>({
        resolver: zodResolver(editSchema),
        defaultValues: {
            name: branch?.name ?? "",
            displayCode: branch?.displayCode ?? "",
            serviceMode:
                (branch?.serviceMode as "RESTAURANT" | "BAKERY") ??
                "RESTAURANT",
        },
    });

    const values = watch();

    function startEdit() {
        reset({
            name: branch?.name ?? "",
            displayCode: branch?.displayCode ?? "",
            serviceMode:
                (branch?.serviceMode as "RESTAURANT" | "BAKERY") ??
                "RESTAURANT",
        });
        setEditing(true);
    }

    async function onSave(data: EditValues) {
        try {
            await updateBranch({
                branchId,
                body: {
                    name: data.name,
                    displayCode: data.displayCode?.toUpperCase() || undefined,
                    serviceMode: data.serviceMode,
                },
            }).unwrap();
            toast.success("Branch updated");
            setEditing(false);
        } catch (err) {
            toast.fromUnknown(err, "Could not update branch");
        }
    }

    const isActiveBranch = session?.branchId === branchId;
    const isBakery = branch?.serviceMode === "BAKERY";

    // ── Loading ──
    if (isLoading) {
        return (
            <DashboardFrame>
                <div className="flex min-h-[200px] items-center justify-center gap-2 text-[13px] text-slate-gray">
                    <RestorchSpinner className="size-4 " />
                    Loading…
                </div>
            </DashboardFrame>
        );
    }

    // ── Not found ──
    if (!branch) {
        return (
            <DashboardFrame>
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-[13px] text-destructive">
                    Branch not found.
                </div>
            </DashboardFrame>
        );
    }

    return (
        <DashboardFrame>
            {/* Back */}
            <button
                type="button"
                onClick={() => router.push("/owner/branches" as never)}
                className="inline-flex items-center gap-1.5 text-[13px] text-slate-gray hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Branches
            </button>

            {/* Hero card */}
            <div className="rounded-2xl border border-hairline bg-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Identity */}
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                "flex size-14 shrink-0 items-center justify-center rounded-2xl",
                                isBakery
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                                    : "bg-brand/8 text-brand",
                            )}
                        >
                            {isBakery ? (
                                <ChefHat className="size-7" />
                            ) : (
                                <Store className="size-7" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
                                    {branch.name}
                                </h1>
                                {isActiveBranch && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        {tCommon("live")}
                                    </span>
                                )}
                                {branch.status === "ACTIVE" &&
                                    !isActiveBranch && (
                                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-slate-gray">
                                            Active
                                        </span>
                                    )}
                            </div>
                            <p className="mt-1 text-[13px] text-slate-gray">
                                {branch.displayCode || "No code"} ·{" "}
                                {isBakery ? "Bakery" : "Restaurant"}
                            </p>
                        </div>
                    </div>

                    {/* Edit button */}
                    {!editing ? (
                        <button
                            type="button"
                            onClick={startEdit}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-hairline bg-card px-4 text-[13px] font-medium hover:border-foreground/20"
                        >
                            <Pencil className="size-3.5" />
                            Edit
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="flex size-9 items-center justify-center rounded-xl border border-hairline hover:bg-secondary"
                            >
                                <X className="size-4 text-slate-gray" />
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={handleSubmit(onSave)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-[13px] font-semibold text-background disabled:opacity-50"
                            >
                                {saving ? (
                                    <RestorchSpinner className="size-3.5 " />
                                ) : (
                                    <Check className="size-3.5" />
                                )}
                                Save
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats strip */}
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-hairline pt-5">
                    {[
                        { label: "Tables", value: String(branch.tableCount) },
                        {
                            label: "Stations",
                            value: String(branch.stationCount),
                        },
                        { label: "Staff", value: String(branch.staffCount) },
                    ].map(s => (
                        <div key={s.label} className="text-center">
                            <p className="text-[22px] font-semibold text-foreground">
                                {s.value}
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* ── Branch info ── */}
                <section className="rounded-2xl border border-hairline bg-card">
                    <div className="border-b border-hairline px-5 py-4">
                        <h2 className="text-[14px] font-semibold">
                            Branch Info
                        </h2>
                    </div>
                    <div className="divide-y divide-hairline px-5">
                        {!editing ? (
                            <>
                                <DetailRow
                                    icon={Building2}
                                    label="Branch name"
                                    value={branch.name}
                                />
                                <DetailRow
                                    icon={Hash}
                                    label="Branch code"
                                    value={branch.displayCode ?? "—"}
                                    muted={!branch.displayCode}
                                />
                                <DetailRow
                                    icon={isBakery ? ChefHat : Store}
                                    label="Type"
                                    value={isBakery ? "Bakery" : "Restaurant"}
                                />
                                <DetailRow
                                    icon={Globe}
                                    label="Timezone"
                                    value={branch.timezone}
                                />
                                <DetailRow
                                    icon={Clock}
                                    label="Created"
                                    value={new Date(
                                        branch.createdAt,
                                    ).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                />
                            </>
                        ) : (
                            <form
                                onSubmit={handleSubmit(onSave)}
                                className="space-y-4 py-5"
                            >
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-name">
                                        Branch name
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        className="h-10 rounded-xl border-hairline"
                                        {...register("name")}
                                    />
                                    {errors.name && (
                                        <p className="text-[11px] text-destructive">
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                {/* Code */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="edit-code">
                                            Branch code
                                        </Label>
                                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-slate-gray">
                                            optional
                                        </span>
                                    </div>
                                    <Input
                                        id="edit-code"
                                        className="h-10 rounded-xl border-hairline uppercase tracking-widest"
                                        maxLength={8}
                                        placeholder="e.g. BOLE"
                                        {...register("displayCode")}
                                    />
                                    <p className="text-[11px] text-slate-gray">
                                        Used on bill numbers & inventory labels
                                    </p>
                                    {errors.displayCode && (
                                        <p className="text-[11px] text-destructive">
                                            {errors.displayCode.message}
                                        </p>
                                    )}
                                </div>

                                {/* Type */}
                                <div className="space-y-1.5">
                                    <Label>Type</Label>
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
                                                onClick={() =>
                                                    setValue(
                                                        "serviceMode",
                                                        mode,
                                                    )
                                                }
                                                className={cn(
                                                    "flex h-10 items-center justify-center gap-2 rounded-xl border text-[13px] font-medium transition-all",
                                                    values.serviceMode === mode
                                                        ? "border-foreground bg-foreground text-background"
                                                        : "border-hairline bg-card",
                                                )}
                                            >
                                                <Icon className="size-4" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </section>

                {/* ── Manager info ── */}
                <section className="rounded-2xl border border-hairline bg-card">
                    <div className="border-b border-hairline px-5 py-4">
                        <h2 className="text-[14px] font-semibold">
                            Branch Manager
                        </h2>
                    </div>
                    <div className="divide-y divide-hairline px-5">
                        {branch.manager?.name ? (
                            <>
                                <div className="flex items-center gap-4 py-4">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-secondary">
                                        <Users className="size-5 text-slate-gray" />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-semibold text-foreground">
                                            {branch.manager.name}
                                        </p>
                                        <p className="text-[12px] text-slate-gray">
                                            Branch Manager
                                        </p>
                                    </div>
                                </div>
                                {branch.manager.email && (
                                    <div className="py-3">
                                        <p className="text-[11px] text-slate-gray">
                                            Email
                                        </p>
                                        <p className="mt-0.5 text-[14px] font-medium text-foreground">
                                            {branch.manager.email}
                                        </p>
                                    </div>
                                )}
                                {branch.manager.phone && (
                                    <div className="py-3">
                                        <p className="text-[11px] text-slate-gray">
                                            Phone
                                        </p>
                                        <p className="mt-0.5 text-[14px] font-medium text-foreground">
                                            {branch.manager.phone}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-8 text-center text-[13px] text-slate-gray">
                                No manager assigned
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </DashboardFrame>
    );
}
