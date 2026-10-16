"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Clock3,
    Edit3,
    Moon,
    Plus,
    Sparkles,
    Sun,
    Sunrise,
    Sunset,
    Trash2,
    Users,
    X,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useCreateShiftDefinitionMutation,
    useDeleteShiftDefinitionMutation,
    useShiftDefinitionsQuery,
    useUpdateShiftDefinitionMutation,
} from "@/context/services/shiftsApi";
import type { ShiftDefinition } from "@/domains/identity/domain/shift";
import { Link } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatEthiopianLocalTime } from "@/lib/ethiopian-calendar";

interface PresetTemplate {
    id: string;
    name: string;
    icon: typeof Sunrise;
    startLocalTime: string;
    endLocalTime: string;
    description: string;
    tag: string;
}

const PRESET_TEMPLATES: PresetTemplate[] = [
    {
        id: "morning",
        name: "Morning Shift",
        icon: Sunrise,
        startLocalTime: "07:00",
        endLocalTime: "15:00",
        description:
            "Breakfast opening, morning prep, and early lunch cash desk handover.",
        tag: "07:00 – 15:00 (8h)",
    },
    {
        id: "afternoon",
        name: "Afternoon Shift",
        icon: Sunset,
        startLocalTime: "15:00",
        endLocalTime: "23:00",
        description:
            "Afternoon turnover, dinner rush, table coverage, and evening cash balance.",
        tag: "15:00 – 23:00 (8h)",
    },
    {
        id: "night",
        name: "Night / Late Shift",
        icon: Moon,
        startLocalTime: "23:00",
        endLocalTime: "07:00",
        description:
            "Late night operations, closing reconciliation, sanitation & dawn float setup.",
        tag: "23:00 – 07:00 (8h)",
    },
];

function calculateDuration(
    start: string,
    end: string,
): { hours: number; minutes: number; isOvernight: boolean } {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
        return { hours: 0, minutes: 0, isOvernight: false };
    }
    const startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    let isOvernight = false;
    if (endTotal <= startTotal) {
        endTotal += 24 * 60;
        isOvernight = true;
    }
    const diff = endTotal - startTotal;
    return {
        hours: Math.floor(diff / 60),
        minutes: diff % 60,
        isOvernight,
    };
}

export default function ShiftDefinitionsManager({
    basePath = "/manager/staff",
}: {
    basePath?: string;
}) {
    const { data: response, isLoading, refetch } = useShiftDefinitionsQuery();
    const [createShift, { isLoading: creating }] =
        useCreateShiftDefinitionMutation();
    const [updateShift, { isLoading: updating }] =
        useUpdateShiftDefinitionMutation();
    const [deleteShift, { isLoading: deleting }] =
        useDeleteShiftDefinitionMutation();

    const shifts = useMemo(() => response?.data ?? [], [response?.data]);

    // Modal state for Create / Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(
        null,
    );
    const [name, setName] = useState("");
    const [startLocalTime, setStartLocalTime] = useState("08:00");
    const [endLocalTime, setEndLocalTime] = useState("16:00");
    const [formError, setFormError] = useState("");

    // Modal state for Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<ShiftDefinition | null>(
        null,
    );

    const openCreateModal = () => {
        setEditingShift(null);
        setName("");
        setStartLocalTime("08:00");
        setEndLocalTime("16:00");
        setFormError("");
        setModalOpen(true);
    };

    const openEditModal = (shift: ShiftDefinition) => {
        setEditingShift(shift);
        setName(shift.name);
        setStartLocalTime(shift.startLocalTime);
        setEndLocalTime(shift.endLocalTime);
        setFormError("");
        setModalOpen(true);
    };

    const handleApplyPreset = async (preset: PresetTemplate) => {
        try {
            await createShift({
                name: preset.name,
                startLocalTime: preset.startLocalTime,
                endLocalTime: preset.endLocalTime,
                graceMinutes: 15,
            }).unwrap();
            toast.success(`"${preset.name}" added successfully.`);
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Failed to create shift template";
            toast.error(message);
        }
    };

    const handleSaveShift = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        const trimmedName = name.trim();
        if (!trimmedName) {
            setFormError("Please enter a valid shift name.");
            return;
        }

        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(startLocalTime) || !timeRegex.test(endLocalTime)) {
            setFormError("Time must be in HH:mm format (e.g. 07:00).");
            return;
        }

        try {
            if (editingShift) {
                await updateShift({
                    id: editingShift.id,
                    name: trimmedName,
                    startLocalTime,
                    endLocalTime,
                    graceMinutes: 15,
                }).unwrap();
                toast.success(`Shift "${trimmedName}" updated.`);
            } else {
                await createShift({
                    name: trimmedName,
                    startLocalTime,
                    endLocalTime,
                    graceMinutes: 15,
                }).unwrap();
                toast.success(`Shift "${trimmedName}" created.`);
            }
            setModalOpen(false);
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Failed to save shift definition";
            setFormError(message);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteShift(deleteTarget.id).unwrap();
            toast.success(`Shift "${deleteTarget.name}" removed.`);
            setDeleteTarget(null);
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Failed to remove shift";
            toast.error(message);
        }
    };

    const previewDuration = calculateDuration(startLocalTime, endLocalTime);

    return (
        <DashboardFrame>
            <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header & Sub-Navigation */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <PageHeader
                        compact
                        eyebrow="Staff Management"
                        title="Shift Definitions & Templates"
                        description="Configure operational shifts, start and end times, and station coverage for staff."
                    />
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Button
                            type="button"
                            onClick={openCreateModal}
                            className="gap-2 shadow-xs"
                        >
                            <Plus className="size-4" />
                            Create Custom Shift
                        </Button>
                    </div>
                </div>

                {/* Sub-tabs to easily switch between Directory and Shifts */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline pb-3">
                    <Link
                        href={basePath}
                        className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-normal text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <Users className="size-3.5" />
                        Staff Directory
                    </Link>
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3.5 py-1.5 text-xs font-normal text-brand">
                        <Clock3 className="size-3.5" />
                        Shift Templates & Hours
                    </span>
                    <Link
                        href={`${basePath}/schedule`}
                        className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-normal text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <Calendar className="size-3.5" />
                        Weekly Shift Roster
                    </Link>
                </div>

                {/* 1-Click Quick Preset Templates */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-brand" />
                            <h2 className="text-sm font-normal tracking-tight text-foreground">
                                Recommended 1-Click Shift Templates
                            </h2>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            POS Standard 8-Hour Rotations
                        </span>
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-3">
                        {PRESET_TEMPLATES.map(preset => {
                            const IconComponent = preset.icon;
                            const isInstalled = shifts.some(
                                s =>
                                    s.name.toLowerCase().includes(preset.id) ||
                                    (s.startLocalTime ===
                                        preset.startLocalTime &&
                                        s.endLocalTime === preset.endLocalTime),
                            );

                            return (
                                <div
                                    key={preset.id}
                                    className="relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-hairline bg-card p-4.5 transition-all duration-200 hover:border-brand/40 hover:shadow-subtle"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                                                    <IconComponent className="size-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-normal tracking-tight text-foreground">
                                                        {preset.name}
                                                    </h3>
                                                    <span className="text-[11px] font-normal text-slate-gray">
                                                        {preset.tag}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="rounded-md border border-hairline bg-secondary/50 px-2 py-0.5 text-[11px] font-mono font-normal text-foreground">
                                                    {preset.startLocalTime} –{" "}
                                                    {preset.endLocalTime}
                                                </span>
                                                <span className="text-[10px] font-normal text-slate-gray">
                                                    {
                                                        formatEthiopianLocalTime(
                                                            preset.startLocalTime,
                                                        ).formattedAm
                                                    }{" "}
                                                    –{" "}
                                                    {
                                                        formatEthiopianLocalTime(
                                                            preset.endLocalTime,
                                                        ).formattedAm
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                                            {preset.description}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-hairline/60 flex items-center justify-between">
                                        <span className="text-[11px] font-normal text-muted-foreground flex items-center gap-1">
                                            <Clock className="size-3 text-slate-gray" />
                                            8 Hours
                                        </span>
                                        {isInstalled ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="size-3.5" />
                                                Active Template
                                            </span>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs font-normal gap-1.5"
                                                disabled={creating}
                                                onClick={() =>
                                                    handleApplyPreset(preset)
                                                }
                                            >
                                                <Plus className="size-3" />
                                                Add Template
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Active Shifts Table / List */}
                <div className="rounded-[22px] border border-hairline bg-card shadow-subtle overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4 sm:px-6 bg-secondary/30">
                        <div>
                            <h3 className="text-sm font-normal tracking-tight text-foreground">
                                Active Shift Definitions ({shifts.length})
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Shifts assigned to cashiers, floor servers, and
                                order stations in this branch.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={openCreateModal}
                            className="h-8 text-xs font-normal gap-1.5"
                        >
                            <Plus className="size-3.5" />
                            Add Custom Shift
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                            Loading shift definitions...
                        </div>
                    ) : shifts.length === 0 ? (
                        <div className="p-10 text-center space-y-3">
                            <Clock3 className="size-10 text-muted-foreground/40 mx-auto" />
                            <p className="text-sm font-normal text-foreground">
                                No shift definitions created yet.
                            </p>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Click any of the 1-click templates above
                                (Morning, Afternoon, Night) or create a custom
                                shift schedule.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-hairline">
                            {shifts.map(shift => {
                                const duration = calculateDuration(
                                    shift.startLocalTime,
                                    shift.endLocalTime,
                                );
                                return (
                                    <div
                                        key={shift.id}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4.5 sm:px-6 hover:bg-secondary/20 transition-colors gap-3"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground text-sm">
                                                <Clock3 className="size-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-normal text-foreground">
                                                        {shift.name}
                                                    </p>
                                                    {duration.isOvernight && (
                                                        <span className="rounded-md border border-hairline bg-secondary px-1.5 py-0.5 text-[10px] font-normal text-foreground">
                                                            Overnight
                                                        </span>
                                                    )}
                                                    <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-normal">
                                                        Active
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {duration.hours}h{" "}
                                                    {duration.minutes > 0
                                                        ? `${duration.minutes}m `
                                                        : ""}
                                                    shift window
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-5">
                                            <div className="text-right">
                                                <div className="flex items-center gap-1.5 font-mono text-sm font-normal text-foreground">
                                                    <span>
                                                        {shift.startLocalTime}
                                                    </span>
                                                    <ArrowRight className="size-3 text-muted-foreground" />
                                                    <span>
                                                        {shift.endLocalTime}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    {
                                                        formatEthiopianLocalTime(
                                                            shift.startLocalTime,
                                                        ).formattedAm
                                                    }{" "}
                                                    –{" "}
                                                    {
                                                        formatEthiopianLocalTime(
                                                            shift.endLocalTime,
                                                        ).formattedAm
                                                    }
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditModal(shift)
                                                    }
                                                    className="flex size-8 items-center justify-center rounded-lg border border-hairline text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                                                    title="Edit shift"
                                                >
                                                    <Edit3 className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDeleteTarget(shift)
                                                    }
                                                    className="flex size-8 items-center justify-center rounded-lg border border-hairline text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                                    title="Delete shift"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Guidance / Best Practice Note */}
                <div className="rounded-2xl border border-hairline bg-secondary/30 p-4 text-xs text-foreground flex items-start gap-3">
                    <AlertCircle className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <div>
                        <p className="font-normal text-foreground">
                            Shift Handover & Drawer Continuity
                        </p>
                        <p className="mt-0.5 leading-relaxed text-muted-foreground">
                            Cashiers transitioning between Morning, Afternoon,
                            and Night shifts can use the Handover to Next
                            Cashier feature on the Cashier Shift desk. Handover
                            automatically counts cash, reserves the opening
                            float for the incoming cashier, transfers safe
                            drops, and authenticates the incoming cashier with
                            their PIN in a single continuous flow.
                        </p>
                    </div>
                </div>
            </div>

            {/* Create / Edit Modal Dialog */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-hairline bg-card shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-secondary/30">
                            <div className="flex items-center gap-2.5">
                                <Clock3 className="size-5 text-brand" />
                                <h3 className="text-base font-normal text-foreground">
                                    {editingShift
                                        ? "Edit Shift Definition"
                                        : "Create Custom Shift"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveShift}
                            className="p-6 space-y-4"
                        >
                            {formError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-2">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-normal text-foreground mb-1.5">
                                    Shift Name
                                </label>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Breakfast Rush, Weekend Evening"
                                    required
                                    className="h-10"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-normal text-foreground mb-1.5">
                                        Start Local Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={startLocalTime}
                                        onChange={e =>
                                            setStartLocalTime(e.target.value)
                                        }
                                        required
                                        className="h-10 font-mono text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-normal text-foreground mb-1.5">
                                        End Local Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={endLocalTime}
                                        onChange={e =>
                                            setEndLocalTime(e.target.value)
                                        }
                                        required
                                        className="h-10 font-mono text-xs"
                                    />
                                </div>
                            </div>

                            {/* Ethiopian Local Time preview */}
                            <div className="rounded-xl border border-hairline bg-secondary/30 p-2.5 text-xs text-foreground flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    የኢትዮጵያ ሰዓት (Local Time):
                                </span>
                                <span className="font-normal font-mono text-foreground">
                                    {
                                        formatEthiopianLocalTime(startLocalTime)
                                            .formattedAm
                                    }{" "}
                                    –{" "}
                                    {
                                        formatEthiopianLocalTime(endLocalTime)
                                            .formattedAm
                                    }
                                </span>
                            </div>

                            {/* Duration preview */}
                            <div className="rounded-xl bg-secondary/50 p-3 text-xs flex items-center justify-between text-muted-foreground">
                                <span>Calculated Duration:</span>
                                <span className="font-normal text-foreground flex items-center gap-1.5">
                                    {previewDuration.hours} hours{" "}
                                    {previewDuration.minutes > 0
                                        ? `${previewDuration.minutes}m`
                                        : ""}
                                    {previewDuration.isOvernight && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] py-0 px-1.5 font-normal"
                                        >
                                            Overnight
                                        </Badge>
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-hairline">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={creating || updating}
                                >
                                    {creating || updating
                                        ? "Saving..."
                                        : editingShift
                                          ? "Save Changes"
                                          : "Create Shift"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-hairline bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 mx-auto">
                            <Trash2 className="size-6" />
                        </div>
                        <h4 className="mt-4 text-center text-base font-normal text-foreground">
                            Remove Shift Definition?
                        </h4>
                        <p className="mt-1.5 text-center text-xs text-muted-foreground">
                            Are you sure you want to remove &quot;
                            {deleteTarget.name}&quot; (
                            {deleteTarget.startLocalTime} –{" "}
                            {deleteTarget.endLocalTime})? Current clocked-in
                            sessions will not be affected.
                        </p>

                        <div className="mt-6 flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setDeleteTarget(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                className="flex-1"
                                disabled={deleting}
                                onClick={handleDelete}
                            >
                                {deleting ? "Removing..." : "Confirm Delete"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardFrame>
    );
}
