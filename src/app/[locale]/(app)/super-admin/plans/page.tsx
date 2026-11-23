"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import { CreditCard, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    useCreateSuperAdminPlanMutation,
    useDeleteSuperAdminPlanMutation,
    useUpdateSuperAdminPlanMutation,
    type SubscriptionPlan,
} from "@/context/services/superAdminApi";
import { useListPlatformPlansQuery } from "@/context/services/platformPlansApi";
import { toast } from "@/lib/toast";

type PlanForm = {
    name: string;
    code: string;
    maxBranches: string;
};

const EMPTY_FORM: PlanForm = {
    name: "",
    code: "",
    maxBranches: "1",
};

export default function SuperAdminPlansPage() {
    const isAm = useLocale() === "am";
    const { data, isLoading, isFetching, error, refetch } =
        useListPlatformPlansQuery();
    const [createPlan, { isLoading: creating }] =
        useCreateSuperAdminPlanMutation();
    const [updatePlan, { isLoading: updating }] =
        useUpdateSuperAdminPlanMutation();
    const [deletePlan, { isLoading: deleting }] =
        useDeleteSuperAdminPlanMutation();

    const [createOpen, setCreateOpen] = useState(false);
    const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(
        null,
    );
    const [form, setForm] = useState<PlanForm>(EMPTY_FORM);

    const plans = data?.data ?? [];
    const saving = creating || updating;

    function openCreate() {
        setForm(EMPTY_FORM);
        setCreateOpen(true);
    }

    function openEdit(plan: SubscriptionPlan) {
        setForm({
            name: plan.name,
            code: plan.code,
            maxBranches: String(plan.maxBranches),
        });
        setEditPlan(plan);
    }

    function parseMax(raw: string): number | null {
        const next = Number(raw);
        if (!Number.isInteger(next) || next < 1) return null;
        return next;
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        const maxBranches = parseMax(form.maxBranches);
        if (!form.name.trim() || !form.code.trim() || maxBranches == null) {
            toast.error(
                isAm
                    ? "ስም፣ ኮድ እና ቢያንስ 1 የቅርንጫፍ ገደብ ያስፈልጋል።"
                    : "Name, code, and a branch limit of 1 or more are required.",
            );
            return;
        }
        try {
            await createPlan({
                name: form.name.trim(),
                code: form.code.trim(),
                maxBranches,
            }).unwrap();
            toast.success(
                isAm ? "እቅድ ተፈጥሯል" : "Plan created",
                form.name.trim(),
            );
            setCreateOpen(false);
            setForm(EMPTY_FORM);
        } catch (err) {
            toast.fromUnknown(
                err,
                isAm ? "ይህን እቅድ መፍጠር አልተቻለም።" : "Could not create this plan.",
            );
        }
    }

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editPlan) return;
        const maxBranches = parseMax(form.maxBranches);
        if (!form.name.trim() || !form.code.trim() || maxBranches == null) {
            toast.error(
                isAm
                    ? "ስም፣ ኮድ እና ቢያንስ 1 የቅርንጫፍ ገደብ ያስፈልጋል።"
                    : "Name, code, and a branch limit of 1 or more are required.",
            );
            return;
        }
        try {
            await updatePlan({
                id: editPlan.id,
                body: {
                    name: form.name.trim(),
                    code: form.code.trim(),
                    maxBranches,
                },
            }).unwrap();
            toast.success(
                isAm ? "እቅድ ተዘምኗል" : "Plan updated",
                form.name.trim(),
            );
            setEditPlan(null);
        } catch (err) {
            toast.fromUnknown(
                err,
                isAm ? "ይህን እቅድ ማዘመን አልተቻለም።" : "Could not update this plan.",
            );
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        try {
            await deletePlan(deleteTarget.id).unwrap();
            toast.success(
                isAm ? "እቅድ ተሰርዟል" : "Plan deleted",
                deleteTarget.name,
            );
            setDeleteTarget(null);
        } catch (err) {
            toast.fromUnknown(
                err,
                isAm
                    ? "ይህን እቅድ መሰረዝ አልተቻለም። መጀመሪያ ተከራዮችን ወደ ሌላ እቅድ ይቀይሩ።"
                    : "Could not delete this plan. Move tenants off it first.",
            );
        }
    }

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow={isAm ? "ፕላትፎርም" : "Platform"}
                    title={isAm ? "የደንበኝነት እቅዶች" : "Plans"}
                    description={
                        isAm
                            ? "የደንበኝነት እቅዶችን ይፍጠሩ፣ ያርትዑ ወይም ይሰርዙ። የቅርንጫፍ ገደቦች አንድ ሬስቶራንት ተጨማሪ ቅርንጫፍ ሲከፍት ተግባራዊ ይሆናሉ።"
                            : "Create, edit, or delete subscription plans. Branch limits apply when a restaurant adds a location."
                    }
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="h-8 gap-1.5 rounded-full px-3 text-[11px] font-medium"
                    >
                        <RefreshCw
                            className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
                        />
                        {isAm ? "አድስ" : "Refresh"}
                    </Button>
                    <Button
                        size="sm"
                        onClick={openCreate}
                        className="h-8 gap-1.5 rounded-full px-3 text-[11px] font-medium"
                    >
                        <Plus className="size-3.5" />
                        {isAm ? "አዲስ እቅድ" : "New plan"}
                    </Button>
                </div>
            </div>

            {error ? (
                <div className="rounded-[14px] border border-destructive-border bg-destructive-soft p-4 text-xs text-destructive">
                    {isAm
                        ? "እቅዶችን ከአገልጋዩ መጫን አልተቻለም።"
                        : "Could not load plans from the server."}
                </div>
            ) : null}

            {isLoading ? (
                <div className="flex items-center gap-2 py-16 text-[13px] text-slate-gray">
                    <RestorchSpinner className="size-4 " />
                    {isAm ? "እቅዶች በመጫን ላይ…" : "Loading plans…"}
                </div>
            ) : plans.length === 0 ? (
                <div className="rounded-[16px] border border-hairline bg-card px-5 py-10 text-center">
                    <p className="text-[13px] text-slate-gray">
                        {isAm
                            ? "እስካሁን የተፈጠረ እቅድ የለም። የመጀመሪያውን ይፍጠሩ።"
                            : "No plans yet. Create the first one."}
                    </p>
                    <Button
                        size="sm"
                        onClick={openCreate}
                        className="mt-3 h-8 rounded-full px-3 text-[12px]"
                    >
                        {isAm ? "አዲስ እቅድ" : "New plan"}
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {plans.map(plan => (
                        <article
                            key={plan.id}
                            className="rounded-[16px] border border-hairline bg-card p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-9 items-center justify-center rounded-xl border border-hairline bg-secondary">
                                        <CreditCard className="size-4" />
                                    </span>
                                    <div>
                                        <h2 className="text-[15px] font-semibold text-foreground">
                                            {plan.name}
                                        </h2>
                                        <p className="font-mono text-[11px] text-slate-gray">
                                            {plan.code}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="secondary">
                                    {plan.tenantCount}{" "}
                                    {isAm ? "ተከራዮች" : "tenants"}
                                </Badge>
                            </div>

                            <p className="mt-4 text-[12px] text-slate-gray">
                                {isAm ? "ከፍተኛ የቅርንጫፍ ብዛት" : "Max branches"}
                            </p>
                            <p className="text-[18px] font-semibold tabular-nums text-foreground">
                                {plan.maxBranches}
                            </p>

                            <div className="mt-4 flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEdit(plan)}
                                    className="h-8 gap-1.5 rounded-full px-3 text-[12px]"
                                >
                                    <Pencil className="size-3.5" />
                                    {isAm ? "አርትዕ" : "Edit"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteTarget(plan)}
                                    className="h-8 gap-1.5 rounded-full px-3 text-[12px] text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="size-3.5" />
                                    {isAm ? "ሰርዝ" : "Delete"}
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {createOpen ? (
                <PlanModal
                    title={isAm ? "አዲስ እቅድ" : "New plan"}
                    submitLabel={isAm ? "እቅድ ፍጠር" : "Create plan"}
                    saving={saving}
                    form={form}
                    setForm={setForm}
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                    isAm={isAm}
                />
            ) : null}

            {editPlan ? (
                <PlanModal
                    title={
                        isAm ? `${editPlan.name} አርትዕ` : `Edit ${editPlan.name}`
                    }
                    submitLabel={isAm ? "ለውጦችን መዝግብ" : "Save changes"}
                    saving={saving}
                    form={form}
                    setForm={setForm}
                    onClose={() => setEditPlan(null)}
                    onSubmit={handleEdit}
                    isAm={isAm}
                />
            ) : null}

            {deleteTarget ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                    <div
                        className="fixed inset-0"
                        onClick={() => setDeleteTarget(null)}
                    />
                    <div className="relative z-10 w-full max-w-md rounded-[20px] border border-hairline bg-white p-6 shadow-2xl dark:bg-card">
                        <h3 className="text-[16px] font-bold text-foreground">
                            {isAm
                                ? `${deleteTarget.name} ይሰረዝ?`
                                : `Delete ${deleteTarget.name}?`}
                        </h3>
                        <p className="mt-2 text-[13px] text-slate-gray">
                            {isAm
                                ? deleteTarget.tenantCount > 0
                                    ? `ይህ እቅድ በ${deleteTarget.tenantCount} ተከራይ(ዎች) ጥቅም ላይ እየዋለ ነው። መጀመሪያ ወደ ሌላ እቅድ ይቀይሯቸው።`
                                    : "ይህ እርምጃ እቅዱን ያስወግደዋል። ወደ ኋላ መመለስ አይቻልም።"
                                : deleteTarget.tenantCount > 0
                                  ? `This plan is used by ${deleteTarget.tenantCount} tenant(s). Move them to another plan first.`
                                  : "This removes the plan. It cannot be undone."}
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeleteTarget(null)}
                                className="h-9 rounded-xl"
                            >
                                {isAm ? "ይቅር" : "Cancel"}
                            </Button>
                            <Button
                                type="button"
                                disabled={
                                    deleting || deleteTarget.tenantCount > 0
                                }
                                onClick={() => void handleDelete()}
                                className="h-9 rounded-xl bg-destructive text-white hover:bg-destructive/90"
                            >
                                {deleting
                                    ? isAm
                                        ? "በመሰረዝ ላይ…"
                                        : "Deleting…"
                                    : isAm
                                      ? "ሰርዝ"
                                      : "Delete"}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </DashboardFrame>
    );
}

function PlanModal({
    title,
    submitLabel,
    saving,
    form,
    setForm,
    onClose,
    onSubmit,
    isAm = false,
}: {
    title: string;
    submitLabel: string;
    saving: boolean;
    form: PlanForm;
    setForm: React.Dispatch<React.SetStateAction<PlanForm>>;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isAm?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
            <div className="fixed inset-0" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-[20px] border border-hairline bg-white p-6 shadow-2xl dark:bg-card">
                <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
                    <h3 className="text-[16px] font-bold text-foreground">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-7 items-center justify-center rounded-full text-slate-gray hover:bg-secondary"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="space-y-3.5 text-[13px]">
                    <div className="space-y-1">
                        <label className="font-medium text-foreground">
                            {isAm ? "የእቅድ ስም" : "Name"}
                        </label>
                        <Input
                            value={form.name}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            placeholder="Growth"
                            className="h-10 rounded-[10px]"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="font-medium text-foreground">
                            {isAm ? "የእቅድ ኮድ" : "Code"}
                        </label>
                        <Input
                            value={form.code}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    code: e.target.value.toUpperCase(),
                                }))
                            }
                            placeholder="GROWTH"
                            className="h-10 rounded-[10px] font-mono"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="font-medium text-foreground">
                            {isAm ? "ከፍተኛ የቅርንጫፍ ብዛት" : "Max branches"}
                        </label>
                        <Input
                            type="number"
                            min={1}
                            max={200}
                            value={form.maxBranches}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    maxBranches: e.target.value,
                                }))
                            }
                            className="h-10 rounded-[10px]"
                            required
                        />
                        <p className="text-[11px] text-slate-gray">
                            {isAm
                                ? "በዚህ እቅድ ላይ ያሉ ሬስቶራንቶች ከዚህ በላይ ንቁ ቅርንጫፍ መክፈት አይችሉም።"
                                : "Restaurants on this plan cannot open more active locations than this."}
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-9 rounded-xl"
                        >
                            {isAm ? "ይቅር" : "Cancel"}
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="h-9 rounded-xl"
                        >
                            {saving
                                ? isAm
                                    ? "በማስቀመጥ ላይ…"
                                    : "Saving…"
                                : submitLabel}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
