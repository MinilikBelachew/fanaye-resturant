"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
    Ban,
    Calendar,
    CalendarOff,
    Camera,
    Clock,
    Clock3,
    Copy,
    Eye,
    EyeOff,
    Lock,
    Loader2,
    MapPin,
    Moon,
    Phone,
    Plus,
    RotateCcw,
    Sun,
    Sunrise,
    Sunset,
    Trash2,
    Truck,
    User,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { formatEthiopianLocalTime } from "@/lib/ethiopian-calendar";
import { useTranslations } from "next-intl";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { closeAddEditStaff } from "@/context/slices/identitySlice";
import {
    useAdminStaffQuery,
    useAdminShiftFloorQuery,
    useCreateAdminStaffMutation,
    useCreateShiftDefinitionMutation,
    useDeleteAdminStaffMutation,
    useSetWaiterTableCoverageMutation,
    useUpdateAdminStaffMutation,
} from "@/context/services/staffApi";
import { useUploadMenuImageMutation } from "@/context/services/menuApi";
import { useGetStationsQuery } from "@/context/services/stationsApi";
import { filePublicUrl } from "@/domains/catalog/application/menuImages";
import DiningTableVisualCard from "@/domains/identity/ui/DiningTableVisualCard";
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
import { toast } from "@/lib/toast";
import {
    dayShiftsFromForm,
    staffFormDefaults,
    staffFormSchema,
    tableCoveragesFromForm,
    type StaffFormValues,
} from "@/lib/validators/staff";
import {
    shiftDefinitionSchema,
    type ShiftDefinitionFormValues,
} from "@/lib/validators/floor";
import { cn } from "@/lib/utils";

function isUuid(id: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
    );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DAY_LABEL_KEYS: Record<
    (typeof WEEKDAYS)[number],
    "dayMon" | "dayTue" | "dayWed" | "dayThu" | "dayFri" | "daySat" | "daySun"
> = {
    Mon: "dayMon",
    Tue: "dayTue",
    Wed: "dayWed",
    Thu: "dayThu",
    Fri: "dayFri",
    Sat: "daySat",
    Sun: "daySun",
};

function format12HourTime(time24: string): string {
    const [hStr, mStr] = time24.split(":");
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const mm = m < 10 ? `0${m}` : `${m}`;
    return `${h12}:${mm} ${period}`;
}

function formatShiftOptionLabel(shift: {
    name: string;
    startLocalTime: string;
    endLocalTime: string;
}): string {
    const start12 = format12HourTime(shift.startLocalTime);
    const end12 = format12HourTime(shift.endLocalTime);
    const ethStart = formatEthiopianLocalTime(shift.startLocalTime).formattedAm;
    const ethEnd = formatEthiopianLocalTime(shift.endLocalTime).formattedAm;
    return `${shift.name} · ${start12}–${end12} (${ethStart} – ${ethEnd})`;
}

export default function AddEditStaffSheet() {
    const t = useTranslations("managerStaff");
    const tCommon = useTranslations("common");
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(state => state.identity.isAddEditOpen);
    const editingStaff = useAppSelector(state => state.identity.editingStaff);
    const serviceMode = useAppSelector(
        state => state.identity.session?.serviceMode,
    );
    const sessionRoleCode = useAppSelector(
        state => state.identity.session?.roleCode,
    );
    const isEditMode = Boolean(editingStaff && editingStaff.name);

    const [targetBranchId, setTargetBranchId] = useState<string | undefined>();
    useEffect(() => {
        if (!isOpen) return;
        const stored =
            typeof window !== "undefined"
                ? sessionStorage.getItem("fanaye.staffTargetBranchId") ||
                  undefined
                : undefined;
        setTargetBranchId(stored);
    }, [isOpen]);
    const { data: staffData } = useAdminStaffQuery(
        targetBranchId ? { branchId: targetBranchId } : undefined,
        {
            skip: !isOpen,
        },
    );
    const { data: dbStations = [] } = useGetStationsQuery(undefined, {
        skip: !isOpen,
    });
    const shifts = useMemo(() => staffData?.shifts ?? [], [staffData?.shifts]);

    const activeStations = useMemo(() => {
        return dbStations.filter(
            st => st.status !== "INACTIVE" && st.enabled !== false,
        );
    }, [dbStations]);

    const allRoles = useMemo(() => {
        if (serviceMode === "BAKERY") {
            return [
                {
                    id: "cashier",
                    label: t("roleCashier"),
                    description: t("roleCashierDesc"),
                },
            ];
        }

        const canManageStore =
            !sessionRoleCode ||
            sessionRoleCode === "OWNER_ADMIN" ||
            editingStaff?.role === "store_manager";

        const baseRoles = [
            {
                id: "waiter",
                label: t("roleWaiter"),
                description: t("roleWaiterDesc"),
            },
            {
                id: "dispatcher",
                label: t("roleDispatcher"),
                description: t("roleDispatcherDesc"),
            },
            {
                id: "cashier",
                label: t("roleCashier"),
                description: t("roleCashierDesc"),
            },
            {
                id: "driver",
                label: "Driver / Transit",
                description:
                    "Inter-branch stock delivery & fleet transport across all branches",
            },
            ...(canManageStore
                ? [
                      {
                          id: "store_manager",
                          label: t("roleStoreManager"),
                          description: t("roleStoreManagerDesc"),
                      },
                  ]
                : []),
        ];

        const stationRoles = activeStations.map(st => ({
            id: `station:${st.id}`,
            stationId: st.id,
            stationCode: st.code || st.name.toUpperCase().replace(/\s+/g, "_"),
            label: t("stationRoleLabel", { name: st.name }),
            description:
                st.description || t("stationRoleDesc", { name: st.name }),
            isStation: true,
            color: st.color,
        }));

        const fallbackStations =
            activeStations.length === 0
                ? [
                      {
                          id: "kitchen",
                          label: t("fallbackKitchen"),
                          description: t("fallbackKitchenDesc"),
                          isStation: true,
                      },
                      {
                          id: "barista",
                          label: t("fallbackBarista"),
                          description: t("fallbackBaristaDesc"),
                          isStation: true,
                      },
                      {
                          id: "cakes",
                          label: t("fallbackCakes"),
                          description: t("fallbackCakesDesc"),
                          isStation: true,
                      },
                      {
                          id: "soft_drinks",
                          label: t("fallbackSoftDrinks"),
                          description: t("fallbackSoftDrinksDesc"),
                          isStation: true,
                      },
                  ]
                : [];

        return [
            ...baseRoles,
            ...(activeStations.length > 0 ? stationRoles : fallbackStations),
        ];
    }, [activeStations, editingStaff?.role, serviceMode, sessionRoleCode, t]);

    const [saving, setSaving] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [setCoverage] = useSetWaiterTableCoverageMutation();
    const [createStaff] = useCreateAdminStaffMutation();
    const [updateStaffApi] = useUpdateAdminStaffMutation();
    const [deleteStaffApi] = useDeleteAdminStaffMutation();
    const [uploadPhoto, { isLoading: uploadingPhoto }] =
        useUploadMenuImageMutation();
    const [createShift, { isLoading: creatingShift }] =
        useCreateShiftDefinitionMutation();
    const [showNewShift, setShowNewShift] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

    const shiftForm = useForm<ShiftDefinitionFormValues>({
        resolver: zodResolver(shiftDefinitionSchema),
        defaultValues: {
            name: "",
            startLocalTime: "07:00",
            endLocalTime: "15:00",
        },
    });

    async function onCreateShift(values: ShiftDefinitionFormValues) {
        try {
            const created = await createShift(values).unwrap();
            const currentCoverage = form.getValues("coverageShiftId");
            form.setValue("coverageShiftId", created.data.id, {
                shouldValidate: true,
                shouldDirty: true,
            });
            if (!currentCoverage) {
                const map = { ...form.getValues("dayShiftByDay") };
                for (const day of WEEKDAYS) {
                    if (!map[day]) map[day] = created.data.id;
                }
                form.setValue("dayShiftByDay", map, { shouldDirty: true });
            }
            setShowNewShift(false);
            shiftForm.reset({
                name: "",
                startLocalTime: "07:00",
                endLocalTime: "15:00",
            });
            toast.success(
                t("toastShiftCreated"),
                t("toastShiftCreatedBody", {
                    name: created.data.name,
                    start: created.data.startLocalTime,
                    end: created.data.endLocalTime,
                }),
            );
        } catch (err) {
            toast.fromUnknown(err, t("toastShiftCreateError"));
        }
    }

    const form = useForm<StaffFormValues>({
        resolver: zodResolver(staffFormSchema),
        defaultValues: staffFormDefaults,
        mode: "onSubmit",
    });

    const role = form.watch("role");
    const dayShiftByDay = form.watch("dayShiftByDay");
    const coverageShiftId = form.watch("coverageShiftId") || "";
    const nameValue = form.watch("name");

    const [coverageDayCode, setCoverageDayCode] = useState<string>("Mon");
    const [tablesByShiftDay, setTablesByShiftDay] = useState<
        Record<string, Record<string, string[]>>
    >({});

    const usedShiftIds = useMemo(() => {
        return [
            ...new Set(
                WEEKDAYS.map(day => dayShiftByDay?.[day] || "").filter(Boolean),
            ),
        ];
    }, [dayShiftByDay]);

    const assignedTableIds = useMemo(() => {
        if (!coverageShiftId) return [];
        return tablesByShiftDay[coverageShiftId]?.[coverageDayCode] ?? [];
    }, [tablesByShiftDay, coverageShiftId, coverageDayCode]);

    const {
        data: shiftFloor,
        isFetching: floorLoading,
        isError: floorError,
    } = useAdminShiftFloorQuery(
        { shiftId: coverageShiftId, dayCode: coverageDayCode },
        {
            skip: !isOpen || role !== "waiter" || !coverageShiftId,
            pollingInterval:
                isOpen && role === "waiter" && coverageShiftId ? 8000 : 0,
        },
    );

    const editingMembershipId =
        editingStaff && isUuid(editingStaff.id) ? editingStaff.id : null;

    useEffect(() => {
        if (!isOpen) return;
        if (editingStaff) {
            let selectedRole = editingStaff.role || "waiter";
            if (activeStations.length > 0) {
                const match =
                    activeStations.find(
                        st => st.id === editingStaff.stationId,
                    ) ??
                    activeStations.find(
                        st =>
                            st.code?.toLowerCase() ===
                                editingStaff.role?.toLowerCase() ||
                            st.name.toLowerCase() ===
                                editingStaff.role?.toLowerCase(),
                    );
                if (match) {
                    selectedRole = `station:${match.id}`;
                }
            }

            const member = staffData?.data.find(
                row => row.id === editingMembershipId,
            );
            const dayMap: Record<string, string> = {
                Mon: "",
                Tue: "",
                Wed: "",
                Thu: "",
                Fri: "",
                Sat: "",
                Sun: "",
            };
            const dayRows = member?.dayShifts?.length
                ? member.dayShifts
                : (editingStaff.workingDays || []).map(day => ({
                      dayCode: day,
                      shiftDefinitionId:
                          member?.shiftCoverages?.[0]?.shiftDefinitionId || "",
                  }));
            for (const row of dayRows) {
                if (row.dayCode in dayMap && row.shiftDefinitionId) {
                    dayMap[row.dayCode] = row.shiftDefinitionId;
                }
            }
            const initialTablesByShiftDay: Record<
                string,
                Record<string, string[]>
            > = {};
            for (const coverage of member?.shiftCoverages ?? []) {
                const sId = coverage.shiftDefinitionId;
                if (!initialTablesByShiftDay[sId]) {
                    initialTablesByShiftDay[sId] = {};
                }
                const dCode = coverage.dayCode || "Mon";
                initialTablesByShiftDay[sId][dCode] = coverage.tables.map(
                    table => table.tableId,
                );
            }
            for (const sId of Object.keys(initialTablesByShiftDay)) {
                const legacy = initialTablesByShiftDay[sId][""];
                if (legacy && legacy.length > 0) {
                    for (const day of WEEKDAYS) {
                        if (
                            !initialTablesByShiftDay[sId][day] ||
                            initialTablesByShiftDay[sId][day].length === 0
                        ) {
                            initialTablesByShiftDay[sId][day] = [...legacy];
                        }
                    }
                }
            }
            setTablesByShiftDay(initialTablesByShiftDay);

            const flatMap: Record<string, string[]> = {};
            for (const sId of Object.keys(initialTablesByShiftDay)) {
                const set = new Set<string>();
                for (const d of WEEKDAYS) {
                    for (const id of initialTablesByShiftDay[sId]?.[d] || []) {
                        set.add(id);
                    }
                }
                flatMap[sId] = Array.from(set);
            }

            const firstShift =
                Object.values(dayMap).find(Boolean) ||
                member?.shiftCoverages?.[0]?.shiftDefinitionId ||
                "";

            const initialDay =
                WEEKDAYS.find(d => dayMap[d] === firstShift) || "Mon";
            setCoverageDayCode(initialDay);

            form.reset({
                name: editingStaff.name || "",
                role: selectedRole,
                phone: editingStaff.phone || "",
                email: editingStaff.email || "",
                pin: "",
                hireDate: member?.hireDate || "",
                photoId: member?.photoId || "",
                active: editingStaff.active !== false,
                dayShiftByDay: dayMap,
                assignedTablesByShift: flatMap,
                coverageShiftId: firstShift,
                licencePlate: (editingStaff as any).licencePlate || "",
                vehicleDesc: (editingStaff as any).vehicleDesc || "",
            });
            setPhotoPreviewUrl(
                member?.photoPath
                    ? filePublicUrl(member.photoPath) || null
                    : null,
            );
        } else {
            form.reset(staffFormDefaults);
            setTablesByShiftDay({});
            setCoverageDayCode("Mon");
            setPhotoPreviewUrl(null);
        }
    }, [
        editingStaff,
        isOpen,
        form,
        activeStations,
        staffData,
        editingMembershipId,
    ]);

    // Keep coverageShiftId in sync with current day's assigned shift
    useEffect(() => {
        if (!isOpen || role !== "waiter") return;
        const shiftForDay = dayShiftByDay?.[coverageDayCode];
        if (shiftForDay && shiftForDay !== coverageShiftId) {
            form.setValue("coverageShiftId", shiftForDay);
        } else if (!shiftForDay && !coverageShiftId && usedShiftIds[0]) {
            form.setValue("coverageShiftId", usedShiftIds[0]);
        }
    }, [
        isOpen,
        role,
        coverageDayCode,
        dayShiftByDay,
        coverageShiftId,
        usedShiftIds,
        form,
    ]);

    // New staff: default Mon–Sat to the first shift template once loaded
    useEffect(() => {
        if (!isOpen || isEditMode || !shifts[0]?.id) return;
        const map = form.getValues("dayShiftByDay");
        const anySet = WEEKDAYS.some(day => map?.[day]);
        if (anySet) return;
        const next: Record<string, string> = {
            Mon: "",
            Tue: "",
            Wed: "",
            Thu: "",
            Fri: "",
            Sat: "",
            Sun: "",
        };
        for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const) {
            next[day] = shifts[0].id;
        }
        form.setValue("dayShiftByDay", next);
        form.setValue("coverageShiftId", shifts[0].id);
    }, [isOpen, isEditMode, shifts, form]);

    const selectedShift = useMemo(
        () => shifts.find(shift => shift.id === coverageShiftId) ?? null,
        [shifts, coverageShiftId],
    );

    const morningShift = useMemo(
        () =>
            shifts.find(s => s.name.toLowerCase().includes("morn")) ??
            shifts[0] ??
            null,
        [shifts],
    );
    const eveningShift = useMemo(
        () =>
            shifts.find(
                s =>
                    s.name.toLowerCase().includes("eve") ||
                    s.name.toLowerCase().includes("night"),
            ) ?? (shifts.length > 1 ? shifts[1] : null),
        [shifts],
    );

    const scheduledWorkingDaysCount = useMemo(
        () => WEEKDAYS.filter(d => Boolean(dayShiftByDay?.[d])).length,
        [dayShiftByDay],
    );

    const totalWeeklyScheduledHours = useMemo(() => {
        let total = 0;
        for (const d of WEEKDAYS) {
            const shiftId = dayShiftByDay?.[d];
            if (!shiftId) continue;
            const s = shifts.find(item => item.id === shiftId);
            if (!s?.startLocalTime || !s?.endLocalTime) continue;
            const [sh, sm] = s.startLocalTime.split(":").map(Number);
            const [eh, em] = s.endLocalTime.split(":").map(Number);
            const startMin = (sh || 0) * 60 + (sm || 0);
            const endMin = (eh || 0) * 60 + (em || 0);
            const diff =
                endMin >= startMin
                    ? endMin - startMin
                    : 24 * 60 - startMin + endMin;
            total += diff / 60;
        }
        return total;
    }, [dayShiftByDay, shifts]);

    function handleSelectDay(day: string) {
        setCoverageDayCode(day);
        const shiftId = form.getValues("dayShiftByDay")?.[day] || "";
        if (shiftId) {
            form.setValue("coverageShiftId", shiftId, { shouldDirty: true });
        }
    }

    function handleSelectShiftForDay(shiftId: string) {
        const nextMap = {
            ...(form.getValues("dayShiftByDay") || {}),
            [coverageDayCode]: shiftId,
        };
        form.setValue("dayShiftByDay", nextMap, {
            shouldDirty: true,
            shouldValidate: true,
        });
        form.setValue("coverageShiftId", shiftId, { shouldDirty: true });
    }

    function handleSetDayOff() {
        const nextMap = {
            ...(form.getValues("dayShiftByDay") || {}),
            [coverageDayCode]: "",
        };
        form.setValue("dayShiftByDay", nextMap, {
            shouldDirty: true,
            shouldValidate: true,
        });
        form.setValue("coverageShiftId", "", { shouldDirty: true });
    }

    function handleApplyPreset(
        daysToSet: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[],
        shiftIdToApply: string,
    ) {
        const nextMap: Record<string, string> = {
            Mon: "",
            Tue: "",
            Wed: "",
            Thu: "",
            Fri: "",
            Sat: "",
            Sun: "",
        };
        for (const day of WEEKDAYS) {
            if (daysToSet.includes(day)) {
                nextMap[day] = shiftIdToApply;
            }
        }
        form.setValue("dayShiftByDay", nextMap, {
            shouldDirty: true,
            shouldValidate: true,
        });
        if (shiftIdToApply) {
            form.setValue("coverageShiftId", shiftIdToApply, {
                shouldDirty: true,
            });
        } else {
            form.setValue("coverageShiftId", "", {
                shouldDirty: true,
            });
        }
    }

    const assignmentStats = useMemo(() => {
        const tables = shiftFloor?.locations.flatMap(loc => loc.tables) ?? [];
        const assigned = tables.filter(
            table => table.assignedWaiterMembershipId,
        );
        const free = tables.length - assigned.length;
        const mine = assignedTableIds.length;
        return {
            total: tables.length,
            assigned: assigned.length,
            free,
            mine,
        };
    }, [shiftFloor, assignedTableIds]);

    if (!isOpen) return null;

    function handleToggleTable(
        tableId: string,
        ownerId?: string | null,
        ownerName?: string | null,
    ) {
        if (!coverageShiftId) return;
        const current =
            tablesByShiftDay[coverageShiftId]?.[coverageDayCode] ?? [];
        const ownedByOther =
            ownerId &&
            ownerId !== editingMembershipId &&
            !current.includes(tableId);
        if (ownedByOther) {
            const ok = confirm(
                `Table is currently assigned to ${ownerName || "another waiter"} on ${coverageDayCode}. Reassign to ${nameValue?.trim() || "this waiter"}?`,
            );
            if (!ok) return;
        }
        const next = current.includes(tableId)
            ? current.filter(id => id !== tableId)
            : [...current, tableId];

        const nextShiftMap = {
            ...(tablesByShiftDay[coverageShiftId] ?? {}),
            [coverageDayCode]: next,
        };
        const nextState = {
            ...tablesByShiftDay,
            [coverageShiftId]: nextShiftMap,
        };
        setTablesByShiftDay(nextState);

        const flatMap: Record<string, string[]> = {};
        for (const sId of Object.keys(nextState)) {
            const set = new Set<string>();
            for (const d of WEEKDAYS) {
                for (const id of nextState[sId]?.[d] || []) {
                    set.add(id);
                }
            }
            flatMap[sId] = Array.from(set);
        }
        form.setValue("assignedTablesByShift", flatMap, { shouldDirty: true });
    }

    function handleCopyDayToAllDays() {
        if (!coverageShiftId) return;
        const current =
            tablesByShiftDay[coverageShiftId]?.[coverageDayCode] ?? [];
        const nextShiftMap = { ...(tablesByShiftDay[coverageShiftId] ?? {}) };
        for (const day of WEEKDAYS) {
            nextShiftMap[day] = [...current];
        }
        const nextState = {
            ...tablesByShiftDay,
            [coverageShiftId]: nextShiftMap,
        };
        setTablesByShiftDay(nextState);

        const flatMap: Record<string, string[]> = {};
        for (const sId of Object.keys(nextState)) {
            const set = new Set<string>();
            for (const d of WEEKDAYS) {
                for (const id of nextState[sId]?.[d] || []) {
                    set.add(id);
                }
            }
            flatMap[sId] = Array.from(set);
        }
        form.setValue("assignedTablesByShift", flatMap, { shouldDirty: true });

        toast.success(
            "Copied to all days",
            `${current.length} table(s) from ${coverageDayCode} copied to all days for this shift. Click Save to confirm.`,
        );
    }

    function handleClearDayTables() {
        if (!coverageShiftId) return;
        const nextShiftMap = {
            ...(tablesByShiftDay[coverageShiftId] ?? {}),
            [coverageDayCode]: [],
        };
        const nextState = {
            ...tablesByShiftDay,
            [coverageShiftId]: nextShiftMap,
        };
        setTablesByShiftDay(nextState);

        const flatMap: Record<string, string[]> = {};
        for (const sId of Object.keys(nextState)) {
            const set = new Set<string>();
            for (const d of WEEKDAYS) {
                for (const id of nextState[sId]?.[d] || []) {
                    set.add(id);
                }
            }
            flatMap[sId] = Array.from(set);
        }
        form.setValue("assignedTablesByShift", flatMap, { shouldDirty: true });
    }

    async function onSubmit(values: StaffFormValues) {
        let stationCode: string | undefined = undefined;
        let preparationStationId: string | undefined = undefined;
        let apiRole = values.role;

        if (values.role.startsWith("station:")) {
            const rawId = values.role.replace("station:", "");
            const stationMatch = activeStations.find(st => st.id === rawId);
            preparationStationId = stationMatch?.id;
            stationCode = stationMatch?.code || undefined;
            apiRole = "kitchen"; // Backend maps to STATION_OPERATOR
        } else if (
            ["kitchen", "barista", "cakes", "soft_drinks"].includes(values.role)
        ) {
            const stationMatch = activeStations.find(
                st =>
                    st.code?.toLowerCase() === values.role.toLowerCase() ||
                    st.name.toLowerCase().includes(values.role.toLowerCase()),
            );
            preparationStationId = stationMatch?.id;
            stationCode =
                stationMatch?.code ||
                (values.role === "soft_drinks"
                    ? "SOFT_DRINKS"
                    : values.role.toUpperCase());
            apiRole = values.role;
        }

        setSaving(true);
        try {
            if (!isEditMode && !values.pin.trim()) {
                form.setError("pin", {
                    type: "manual",
                    message: t("pinValidationError"),
                });
                setSaving(false);
                return;
            }

            const dayShifts = dayShiftsFromForm(values.dayShiftByDay);
            const tableCoverages: Array<{
                shiftDefinitionId: string;
                dayCode?: string;
                applyToAllDays?: boolean;
                tableIds: string[];
            }> = [];

            if (values.role === "waiter" && usedShiftIds.length > 0) {
                for (const shiftId of usedShiftIds) {
                    const shiftDays = WEEKDAYS.filter(
                        d => values.dayShiftByDay?.[d] === shiftId,
                    );
                    const daysToProcess =
                        shiftDays.length > 0 ? shiftDays : WEEKDAYS;
                    const firstDayTables =
                        tablesByShiftDay[shiftId]?.[daysToProcess[0]] ?? [];
                    const allSame = daysToProcess.every(d => {
                        const list = tablesByShiftDay[shiftId]?.[d] ?? [];
                        return (
                            list.length === firstDayTables.length &&
                            list.every(id => firstDayTables.includes(id))
                        );
                    });

                    if (allSame) {
                        tableCoverages.push({
                            shiftDefinitionId: shiftId,
                            applyToAllDays: true,
                            tableIds: firstDayTables,
                        });
                    } else {
                        for (const day of daysToProcess) {
                            tableCoverages.push({
                                shiftDefinitionId: shiftId,
                                dayCode: day,
                                tableIds:
                                    tablesByShiftDay[shiftId]?.[day] ?? [],
                            });
                        }
                    }
                }
            }

            if (isEditMode && editingMembershipId) {
                await updateStaffApi({
                    membershipId: editingMembershipId,
                    body: {
                        name: values.name.trim(),
                        role: apiRole,
                        phone: values.phone?.trim() || undefined,
                        email: values.email.trim(),
                        ...(values.pin.trim()
                            ? { pin: values.pin.trim() }
                            : {}),
                        active: values.active,
                        dayShifts,
                        stationCode,
                        preparationStationId,
                        ...(tableCoverages.length > 0
                            ? { tableCoverages }
                            : {}),
                        hireDate: values.hireDate || undefined,
                        photoId: values.photoId || null,
                        licencePlate: values.licencePlate?.trim() || undefined,
                        vehicleDesc: values.vehicleDesc?.trim() || undefined,
                    },
                }).unwrap();

                if (values.role === "waiter" && tableCoverages.length > 0) {
                    for (const coverage of tableCoverages) {
                        await setCoverage({
                            membershipId: editingMembershipId,
                            shiftDefinitionId: coverage.shiftDefinitionId,
                            dayCode: coverage.dayCode,
                            applyToAllDays: coverage.applyToAllDays,
                            tableIds: coverage.tableIds,
                        }).unwrap();
                    }
                }
                toast.success(t("toastStaffUpdated"), values.name.trim());
                dispatch(closeAddEditStaff());
            } else {
                const isCentralRole =
                    apiRole === "store_manager" || apiRole === "driver";
                const targetBranchId =
                    !isCentralRole && typeof window !== "undefined"
                        ? sessionStorage.getItem(
                              "fanaye.staffTargetBranchId",
                          ) || undefined
                        : undefined;
                const created = await createStaff({
                    name: values.name.trim(),
                    role: apiRole,
                    phone: values.phone?.trim() || undefined,
                    email: values.email.trim(),
                    pin: values.pin.trim(),
                    active: values.active,
                    dayShifts,
                    stationCode,
                    preparationStationId,
                    ...(tableCoverages.length > 0 ? { tableCoverages } : {}),
                    ...(targetBranchId ? { branchId: targetBranchId } : {}),
                    ...(values.hireDate ? { hireDate: values.hireDate } : {}),
                    ...(values.photoId ? { photoId: values.photoId } : {}),
                    licencePlate: values.licencePlate?.trim() || undefined,
                    vehicleDesc: values.vehicleDesc?.trim() || undefined,
                }).unwrap();
                if (typeof window !== "undefined") {
                    sessionStorage.removeItem("fanaye.staffTargetBranchId");
                }
                if (
                    values.role === "waiter" &&
                    created?.data?.id &&
                    tableCoverages.length > 0
                ) {
                    for (const coverage of tableCoverages) {
                        await setCoverage({
                            membershipId: created.data.id,
                            shiftDefinitionId: coverage.shiftDefinitionId,
                            dayCode: coverage.dayCode,
                            applyToAllDays: coverage.applyToAllDays,
                            tableIds: coverage.tableIds,
                        }).unwrap();
                    }
                }
                toast.success(t("toastStaffRegistered"), values.name.trim());
                dispatch(closeAddEditStaff());
            }
        } catch (err) {
            toast.fromUnknown(
                err,
                isEditMode ? t("toastUpdateError") : t("toastRegisterError"),
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!editingStaff || !editingMembershipId) {
            toast.error(t("toastNotOnServer"));
            return;
        }
        setSaving(true);
        try {
            await deleteStaffApi(editingMembershipId).unwrap();
            toast.success(t("toastStaffDeleted"), editingStaff.name);
            setConfirmDeleteOpen(false);
            dispatch(closeAddEditStaff());
        } catch (err) {
            toast.fromUnknown(err, t("toastStaffDeleteError"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
            <div
                className="fixed inset-0"
                onClick={() => dispatch(closeAddEditStaff())}
            />

            <aside className="relative z-10 flex h-full w-full max-w-2xl lg:max-w-3xl flex-col overflow-hidden border-l border-hairline bg-white shadow-2xl dark:bg-card">
                <div className="flex shrink-0 items-center justify-between border-b border-hairline px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                            <User className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold text-foreground">
                                {isEditMode ? t("editTitle") : t("addTitle")}
                            </h2>
                            <p className="text-[13px] text-slate-gray">
                                {isEditMode
                                    ? t("editSubtitle", {
                                          name: editingStaff?.name ?? "",
                                      })
                                    : t("addSubtitle")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => dispatch(closeAddEditStaff())}
                        className="flex size-8 items-center justify-center rounded-full text-slate-gray hover:bg-secondary"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <Form {...form}>
                    <form
                        id="staff-form"
                        onSubmit={form.handleSubmit(
                            values => void onSubmit(values),
                        )}
                        className="app-scroll flex-1 space-y-6 overflow-y-auto p-6 text-[14px]"
                    >
                        <div className="space-y-4">
                            <h3 className="text-[12px] font-semibold tracking-wider text-slate-gray uppercase">
                                {t("personalRoleDetails")}
                            </h3>

                            <div className="flex items-center gap-4">
                                <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-hairline bg-secondary/40">
                                    {photoPreviewUrl ? (
                                        <img
                                            src={photoPreviewUrl}
                                            alt=""
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-full items-center justify-center text-slate-gray">
                                            <User className="size-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <p className="text-[13px] font-medium text-foreground">
                                        {t("staffPhoto")}
                                    </p>
                                    <p className="text-[12px] text-slate-gray">
                                        {t("staffPhotoHint")}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-hairline bg-card px-2.5 text-[12px] font-medium text-foreground hover:bg-secondary/60">
                                            <Camera className="size-3.5" />
                                            {uploadingPhoto
                                                ? t("uploadingPhoto")
                                                : photoPreviewUrl
                                                  ? t("replacePhoto")
                                                  : t("uploadPhoto")}
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                className="sr-only"
                                                disabled={uploadingPhoto}
                                                onChange={event => {
                                                    const file =
                                                        event.target.files?.[0];
                                                    if (!file) return;
                                                    void (async () => {
                                                        try {
                                                            const uploaded =
                                                                await uploadPhoto(
                                                                    file,
                                                                ).unwrap();
                                                            form.setValue(
                                                                "photoId",
                                                                uploaded.file
                                                                    .id,
                                                                {
                                                                    shouldDirty: true,
                                                                },
                                                            );
                                                            setPhotoPreviewUrl(
                                                                filePublicUrl(
                                                                    uploaded
                                                                        .file
                                                                        .path,
                                                                ) ||
                                                                    URL.createObjectURL(
                                                                        file,
                                                                    ),
                                                            );
                                                        } catch (err) {
                                                            toast.fromUnknown(
                                                                err,
                                                                t(
                                                                    "photoUploadError",
                                                                ),
                                                            );
                                                        }
                                                    })();
                                                    event.target.value = "";
                                                }}
                                            />
                                        </label>
                                        {photoPreviewUrl ? (
                                            <button
                                                type="button"
                                                className="h-8 rounded-lg border border-hairline px-2.5 text-[12px] font-medium text-slate-gray"
                                                onClick={() => {
                                                    form.setValue(
                                                        "photoId",
                                                        "",
                                                        { shouldDirty: true },
                                                    );
                                                    setPhotoPreviewUrl(null);
                                                }}
                                            >
                                                {t("removePhoto")}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("fullName")}{" "}
                                            <span className="text-primary">
                                                *
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    "fullNamePlaceholder",
                                                )}
                                                className="h-10 rounded-[10px]"
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
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("phoneNumber")}
                                            </FormLabel>
                                            <div className="relative">
                                                <Phone className="absolute top-2.5 left-3 size-4 text-slate-gray" />
                                                <FormControl>
                                                    <Input
                                                        placeholder={t(
                                                            "phonePlaceholder",
                                                        )}
                                                        className="h-10 rounded-[10px] pl-9"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("quickAccessPin")}{" "}
                                                {!isEditMode ? (
                                                    <span className="text-primary">
                                                        *
                                                    </span>
                                                ) : null}
                                            </FormLabel>
                                            <div className="relative">
                                                <Lock className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-gray" />
                                                <FormControl>
                                                    <Input
                                                        type={
                                                            showPin
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        maxLength={4}
                                                        autoComplete="new-password"
                                                        placeholder={
                                                            isEditMode
                                                                ? t(
                                                                      "pinPlaceholderEdit",
                                                                  )
                                                                : t(
                                                                      "pinPlaceholder",
                                                                  )
                                                        }
                                                        className="h-10 rounded-[10px] pl-9 pr-10 font-mono tracking-wider"
                                                        {...field}
                                                        onChange={e => {
                                                            const val =
                                                                e.target.value.replace(
                                                                    /\D/g,
                                                                    "",
                                                                );
                                                            field.onChange(val);
                                                        }}
                                                    />
                                                </FormControl>
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() =>
                                                        setShowPin(
                                                            prev => !prev,
                                                        )
                                                    }
                                                    className="absolute top-2.5 right-3 z-10 flex size-5 cursor-pointer items-center justify-center text-slate-gray hover:text-foreground transition-colors"
                                                    title={
                                                        showPin
                                                            ? t("hidePin")
                                                            : t("showPin")
                                                    }
                                                >
                                                    {showPin ? (
                                                        <EyeOff className="size-4" />
                                                    ) : (
                                                        <Eye className="size-4" />
                                                    )}
                                                </button>
                                            </div>
                                            {isEditMode ? (
                                                <p className="text-[12px] text-slate-gray">
                                                    {t("pinResetHint")}
                                                </p>
                                            ) : null}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("email")}{" "}
                                            <span className="text-primary">
                                                *
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder={t(
                                                    "emailPlaceholder",
                                                )}
                                                className="h-10 rounded-[10px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="hireDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("hireDate")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                className="h-10 rounded-[10px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <p className="text-[12px] text-slate-gray">
                                            {t("hireDateHint")}
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("restaurantRole")}{" "}
                                            <span className="text-primary">
                                                *
                                            </span>
                                        </FormLabel>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {allRoles.map(entry => {
                                                const selected =
                                                    field.value === entry.id;
                                                return (
                                                    <button
                                                        key={entry.id}
                                                        type="button"
                                                        onClick={() =>
                                                            field.onChange(
                                                                entry.id,
                                                            )
                                                        }
                                                        className={cn(
                                                            "flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer",
                                                            selected
                                                                ? "border-zinc-300 bg-zinc-900 text-white dark:border-zinc-500 dark:bg-zinc-100 dark:text-zinc-950 font-medium shadow-xs"
                                                                : "border-hairline bg-card/60 text-slate-gray hover:bg-muted",
                                                        )}
                                                    >
                                                        <div className="flex w-full items-center justify-between">
                                                            <span
                                                                className={cn(
                                                                    "text-[13px] font-semibold",
                                                                    selected
                                                                        ? "text-white dark:text-zinc-950"
                                                                        : "text-foreground",
                                                                )}
                                                            >
                                                                {entry.label}
                                                            </span>
                                                            {selected ? (
                                                                <span className="size-2 rounded-full bg-white dark:bg-zinc-950" />
                                                            ) : null}
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                "mt-1 text-[11px] leading-tight",
                                                                selected
                                                                    ? "text-white/80 dark:text-zinc-950/80"
                                                                    : "text-slate-gray",
                                                            )}
                                                        >
                                                            {entry.description}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {role === "driver" ? (
                            <div className="space-y-4 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4.5 dark:border-primary/30 dark:bg-primary/[0.07]">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                                        <Truck className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-semibold text-foreground">
                                            Driver Fleet & Transit Registration
                                        </h4>
                                        <p className="text-[12px] text-slate-gray">
                                            Drivers operate company-wide across
                                            all branches for inter-branch stock
                                            transfers and warehouse pickups.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                                    <FormField
                                        control={form.control}
                                        name="licencePlate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Licence Plate{" "}
                                                    <span className="text-primary">
                                                        *
                                                    </span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. AA-3-B12345"
                                                        className="h-10 rounded-[10px] font-mono uppercase tracking-wider"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="vehicleDesc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Vehicle Model & Type
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Toyota Hilux Van (White)"
                                                        className="h-10 rounded-[10px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="rounded-xl border border-hairline bg-card/70 px-3.5 py-2.5 text-[12px] text-slate-gray flex items-center justify-between">
                                    <span>
                                        Assigned runs are delivered via the
                                        mobile Driver Portal at{" "}
                                        <span className="font-semibold text-foreground">
                                            /driver
                                        </span>
                                        .
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        {role === "waiter" || role === "cashier" ? (
                            <div className="space-y-4 rounded-2xl border border-hairline/80 bg-surface-ivory/40 p-4 dark:bg-card/40">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-lg border border-hairline bg-card text-foreground">
                                            {role === "waiter" ? (
                                                <UtensilsCrossed className="size-4" />
                                            ) : (
                                                <Clock3 className="size-4" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-semibold text-foreground">
                                                {role === "waiter"
                                                    ? "Weekly Schedule & Floor Tables"
                                                    : "Shift Schedule Window"}
                                            </h4>
                                            <p className="text-[11px] text-slate-gray">
                                                {role === "waiter"
                                                    ? "Select a day, choose its shift, then assign floor tables."
                                                    : "Select a day and choose its shift."}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewShift(v => !v)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    >
                                        <Plus className="size-3" />
                                        {showNewShift
                                            ? tCommon("close")
                                            : t("newShift")}
                                    </button>
                                </div>

                                {/* Quick Preset Buttons */}
                                {shifts.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 pb-1">
                                        <span className="text-[11px] font-medium text-slate-gray">
                                            Quick set:
                                        </span>
                                        {morningShift ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleApplyPreset(
                                                        [
                                                            "Mon",
                                                            "Tue",
                                                            "Wed",
                                                            "Thu",
                                                            "Fri",
                                                            "Sat",
                                                        ],
                                                        morningShift.id,
                                                    )
                                                }
                                                className="inline-flex items-center gap-1 rounded-md border border-hairline bg-card px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                                            >
                                                <Sunrise className="size-3 text-amber-500" />
                                                Mon–Sat {morningShift.name}
                                            </button>
                                        ) : null}
                                        {morningShift ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleApplyPreset(
                                                        [
                                                            "Mon",
                                                            "Tue",
                                                            "Wed",
                                                            "Thu",
                                                            "Fri",
                                                        ],
                                                        morningShift.id,
                                                    )
                                                }
                                                className="inline-flex items-center gap-1 rounded-md border border-hairline bg-card px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                                            >
                                                <Sun className="size-3 text-amber-500" />
                                                Mon–Fri {morningShift.name}
                                            </button>
                                        ) : null}
                                        {eveningShift ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleApplyPreset(
                                                        [
                                                            "Mon",
                                                            "Tue",
                                                            "Wed",
                                                            "Thu",
                                                            "Fri",
                                                            "Sat",
                                                        ],
                                                        eveningShift.id,
                                                    )
                                                }
                                                className="inline-flex items-center gap-1 rounded-md border border-hairline bg-card px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                                            >
                                                <Sunset className="size-3 text-indigo-400" />
                                                Mon–Sat {eveningShift.name}
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleApplyPreset([], "")
                                            }
                                            className="inline-flex items-center gap-1 rounded-md border border-hairline bg-card px-2 py-0.5 text-[11px] font-medium text-slate-gray hover:text-foreground transition-colors cursor-pointer"
                                        >
                                            <Ban className="size-3 text-slate-gray" />
                                            All Off
                                        </button>
                                    </div>
                                ) : null}

                                {/* New Shift Creation Form */}
                                {showNewShift ? (
                                    <div className="space-y-2.5 rounded-xl border border-dashed border-hairline bg-card/60 p-3.5">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[12px] font-semibold text-foreground">
                                                {t("createShiftTitle")}
                                            </p>
                                            <span className="text-[11px] text-slate-gray">
                                                {t("createShiftHint")}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="sr-only">
                                                {t("shiftNameSr")}
                                            </label>
                                            <Input
                                                placeholder={t(
                                                    "shiftNamePlaceholder",
                                                )}
                                                className="h-9 text-[13px] bg-white dark:bg-card"
                                                value={shiftForm.watch("name")}
                                                onChange={e =>
                                                    shiftForm.setValue(
                                                        "name",
                                                        e.target.value,
                                                        {
                                                            shouldValidate: true,
                                                        },
                                                    )
                                                }
                                            />
                                            {shiftForm.formState.errors.name ? (
                                                <p className="mt-1 text-[11px] text-red-500">
                                                    {
                                                        shiftForm.formState
                                                            .errors.name.message
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[11px] font-medium text-slate-gray">
                                                    {t("startTime")}
                                                </label>
                                                <Input
                                                    type="time"
                                                    className="h-9 text-[13px] bg-white dark:bg-card"
                                                    value={shiftForm.watch(
                                                        "startLocalTime",
                                                    )}
                                                    onChange={e =>
                                                        shiftForm.setValue(
                                                            "startLocalTime",
                                                            e.target.value,
                                                            {
                                                                shouldValidate: true,
                                                            },
                                                        )
                                                    }
                                                />
                                                {shiftForm.formState.errors
                                                    .startLocalTime ? (
                                                    <p className="mt-1 text-[11px] text-red-500">
                                                        {
                                                            shiftForm.formState
                                                                .errors
                                                                .startLocalTime
                                                                .message
                                                        }
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-medium text-slate-gray">
                                                    {t("endTime")}
                                                </label>
                                                <Input
                                                    type="time"
                                                    className="h-9 text-[13px] bg-white dark:bg-card"
                                                    value={shiftForm.watch(
                                                        "endLocalTime",
                                                    )}
                                                    onChange={e =>
                                                        shiftForm.setValue(
                                                            "endLocalTime",
                                                            e.target.value,
                                                            {
                                                                shouldValidate: true,
                                                            },
                                                        )
                                                    }
                                                />
                                                {shiftForm.formState.errors
                                                    .endLocalTime ? (
                                                    <p className="mt-1 text-[11px] text-red-500">
                                                        {
                                                            shiftForm.formState
                                                                .errors
                                                                .endLocalTime
                                                                .message
                                                        }
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-[12px]"
                                                onClick={() =>
                                                    setShowNewShift(false)
                                                }
                                            >
                                                {tCommon("cancel")}
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-8 text-[12px]"
                                                disabled={creatingShift}
                                                onClick={shiftForm.handleSubmit(
                                                    values =>
                                                        void onCreateShift(
                                                            values,
                                                        ),
                                                )}
                                            >
                                                {creatingShift
                                                    ? t("saving")
                                                    : t("saveShift")}
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Step 1: 7-Day Weekday Selector */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                            1. Select Day
                                        </span>
                                        <span className="text-[11px] text-slate-gray">
                                            {scheduledWorkingDaysCount} day
                                            {scheduledWorkingDaysCount === 1
                                                ? ""
                                                : "s"}{" "}
                                            scheduled
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1.5">
                                        {WEEKDAYS.map(day => {
                                            const isDaySelected =
                                                coverageDayCode === day;
                                            const shiftId =
                                                dayShiftByDay?.[day];
                                            const assignedShift = shifts.find(
                                                s => s.id === shiftId,
                                            );
                                            const count = shiftId
                                                ? (
                                                      tablesByShiftDay[
                                                          shiftId
                                                      ]?.[day] || []
                                                  ).length
                                                : 0;

                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() =>
                                                        handleSelectDay(day)
                                                    }
                                                    className={cn(
                                                        "flex flex-col items-center justify-center rounded-xl border py-2 px-1 text-center transition-all cursor-pointer",
                                                        isDaySelected
                                                            ? "border-zinc-300 bg-zinc-900 text-white dark:border-zinc-500 dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs ring-1 ring-black/10 dark:ring-white/10"
                                                            : "border-hairline bg-card hover:bg-muted text-muted-foreground",
                                                    )}
                                                >
                                                    <span className="text-[12px] font-bold leading-tight">
                                                        {day}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "mt-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none",
                                                            isDaySelected
                                                                ? "bg-white/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950"
                                                                : shiftId
                                                                  ? "bg-muted text-foreground"
                                                                  : "text-slate-400 dark:text-slate-500",
                                                        )}
                                                    >
                                                        {!shiftId
                                                            ? "Off"
                                                            : role === "waiter"
                                                              ? `${count} tbls`
                                                              : assignedShift?.name?.slice(
                                                                    0,
                                                                    4,
                                                                ) || "Set"}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step 2: Shift Selector for Current Day */}
                                <div className="space-y-1.5 rounded-xl border border-hairline bg-card/60 p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                            2. Shift for {coverageDayCode}
                                        </span>
                                        <span className="text-[11px] text-slate-gray">
                                            {dayShiftByDay?.[coverageDayCode]
                                                ? "Shift active on this day"
                                                : "Scheduled Day Off"}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {shifts.map(shift => {
                                            const isCurrentShift =
                                                (dayShiftByDay?.[
                                                    coverageDayCode
                                                ] || "") === shift.id;
                                            const count = (
                                                tablesByShiftDay[shift.id]?.[
                                                    coverageDayCode
                                                ] || []
                                            ).length;
                                            const isMorning =
                                                shift.startLocalTime
                                                    ? parseInt(
                                                          shift.startLocalTime.split(
                                                              ":",
                                                          )[0],
                                                          10,
                                                      ) < 14
                                                    : false;

                                            return (
                                                <button
                                                    key={shift.id}
                                                    type="button"
                                                    onClick={() =>
                                                        handleSelectShiftForDay(
                                                            shift.id,
                                                        )
                                                    }
                                                    className={cn(
                                                        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                                                        isCurrentShift
                                                            ? "border-zinc-300 bg-zinc-900 text-white dark:border-zinc-500 dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs"
                                                            : "border-hairline bg-card hover:bg-muted text-muted-foreground",
                                                    )}
                                                >
                                                    {isMorning ? (
                                                        <Sunrise
                                                            className={cn(
                                                                "size-3.5",
                                                                isCurrentShift
                                                                    ? "text-amber-300"
                                                                    : "text-amber-500",
                                                            )}
                                                        />
                                                    ) : (
                                                        <Moon
                                                            className={cn(
                                                                "size-3.5",
                                                                isCurrentShift
                                                                    ? "text-indigo-200"
                                                                    : "text-indigo-400",
                                                            )}
                                                        />
                                                    )}
                                                    <span>
                                                        {shift.name} (
                                                        {format12HourTime(
                                                            shift.startLocalTime,
                                                        )}
                                                        –
                                                        {format12HourTime(
                                                            shift.endLocalTime,
                                                        )}
                                                        )
                                                    </span>
                                                    {role === "waiter" &&
                                                    isCurrentShift ? (
                                                        <span
                                                            className={cn(
                                                                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                                                                isCurrentShift
                                                                    ? "bg-white/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950"
                                                                    : "bg-muted text-foreground",
                                                            )}
                                                        >
                                                            {count} tbls
                                                        </span>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => handleSetDayOff()}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                                                !dayShiftByDay?.[
                                                    coverageDayCode
                                                ]
                                                    ? "border-zinc-300 bg-zinc-900 text-white dark:border-zinc-500 dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs"
                                                    : "border-hairline bg-card hover:bg-muted text-muted-foreground",
                                            )}
                                        >
                                            <Ban className="size-3.5 text-slate-gray" />
                                            <span>Day Off</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Step 3: Table Assignment (Waiter only) */}
                                {role === "waiter" ? (
                                    !dayShiftByDay?.[coverageDayCode] ? (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-hairline/80 bg-card/40 py-8 px-4 text-center">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                                                <CalendarOff className="size-5" />
                                            </div>
                                            <p className="text-[13px] font-semibold text-foreground">
                                                {coverageDayCode} is a Scheduled
                                                Day Off
                                            </p>
                                            <p className="text-[11px] text-slate-gray max-w-xs mt-1">
                                                Select a shift above (e.g.
                                                Morning or Evening) to assign
                                                tables for {coverageDayCode}.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 rounded-xl border border-hairline bg-card/60 p-3.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                                    3. Table Assignment ·{" "}
                                                    {coverageDayCode}{" "}
                                                    {selectedShift?.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleCopyDayToAllDays
                                                        }
                                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:text-foreground/80 hover:underline cursor-pointer"
                                                        title={`Copy ${coverageDayCode} tables to all working days`}
                                                    >
                                                        <Copy className="size-3" />
                                                        Copy {coverageDayCode}{" "}
                                                        to all
                                                    </button>
                                                    <span className="text-slate-300 dark:text-slate-600">
                                                        ·
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleClearDayTables
                                                        }
                                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-gray hover:text-destructive cursor-pointer"
                                                        title={`Clear tables for ${coverageDayCode}`}
                                                    >
                                                        <RotateCcw className="size-3" />
                                                        Clear {coverageDayCode}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Clean Neutral & Emerald Stats Pill Row */}
                                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                <span className="rounded-full border border-hairline bg-card px-2.5 py-0.5 text-slate-gray">
                                                    {t("statsTables", {
                                                        count: assignmentStats.total,
                                                    })}
                                                </span>
                                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                                    {t("statsFree", {
                                                        count: assignmentStats.free,
                                                    })}
                                                </span>
                                                <span className="rounded-full border border-hairline bg-card px-2.5 py-0.5 text-slate-gray">
                                                    {t("statsAssigned", {
                                                        count: assignmentStats.assigned,
                                                    })}
                                                </span>
                                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {assignedTableIds.length}{" "}
                                                    for{" "}
                                                    {nameValue
                                                        ?.trim()
                                                        .split(" ")[0] ||
                                                        "this waiter"}
                                                </span>
                                            </div>

                                            {floorLoading ? (
                                                <div className="flex items-center gap-2 py-2 text-[12px] text-slate-gray">
                                                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                                                    <span>
                                                        {t("loadingFloor")}
                                                    </span>
                                                </div>
                                            ) : null}
                                            {floorError ? (
                                                <p className="py-1 text-[12px] text-destructive">
                                                    {t("floorLoadError")}
                                                </p>
                                            ) : null}

                                            {shiftFloor ? (
                                                <div className="space-y-3 pt-1">
                                                    {shiftFloor.locations.map(
                                                        location => (
                                                            <div
                                                                key={
                                                                    location.id
                                                                }
                                                            >
                                                                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-gray uppercase">
                                                                    <MapPin className="size-3.5" />
                                                                    {
                                                                        location.name
                                                                    }
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                                    {location.tables.map(
                                                                        table => {
                                                                            const selected =
                                                                                assignedTableIds.includes(
                                                                                    table.tableId,
                                                                                );
                                                                            const ownerId =
                                                                                table.assignedWaiterMembershipId;
                                                                            const ownerName =
                                                                                table.assignedWaiterName;
                                                                            const ownedByOther =
                                                                                Boolean(
                                                                                    ownerId &&
                                                                                        ownerId !==
                                                                                            editingMembershipId &&
                                                                                        !selected,
                                                                                );
                                                                            const ownedBySelf =
                                                                                Boolean(
                                                                                    ownerId &&
                                                                                        editingMembershipId &&
                                                                                        ownerId ===
                                                                                            editingMembershipId,
                                                                                );

                                                                            return (
                                                                                <DiningTableVisualCard
                                                                                    key={
                                                                                        table.tableId
                                                                                    }
                                                                                    tableId={
                                                                                        table.tableId
                                                                                    }
                                                                                    displayName={
                                                                                        table.displayName
                                                                                    }
                                                                                    displayNumber={
                                                                                        table.displayNumber
                                                                                    }
                                                                                    selected={
                                                                                        selected
                                                                                    }
                                                                                    ownedByOther={
                                                                                        ownedByOther
                                                                                    }
                                                                                    ownedBySelf={
                                                                                        ownedBySelf
                                                                                    }
                                                                                    ownerName={
                                                                                        ownerName
                                                                                    }
                                                                                    currentWaiterName={
                                                                                        nameValue
                                                                                    }
                                                                                    onToggle={() =>
                                                                                        handleToggleTable(
                                                                                            table.tableId,
                                                                                            ownerId,
                                                                                            ownerName,
                                                                                        )
                                                                                    }
                                                                                    labels={{
                                                                                        mine:
                                                                                            "Assigned to " +
                                                                                            (nameValue
                                                                                                ?.trim()
                                                                                                .split(
                                                                                                    " ",
                                                                                                )[0] ||
                                                                                                "Waiter"),
                                                                                        free: "Available",
                                                                                        assigned:
                                                                                            name =>
                                                                                                "Taken by " +
                                                                                                name.split(
                                                                                                    " ",
                                                                                                )[0],
                                                                                        thisWaiter:
                                                                                            nameValue?.trim() ||
                                                                                            "Waiter",
                                                                                    }}
                                                                                />
                                                                            );
                                                                        },
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}

                                                    <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-slate-gray">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <span className="size-2.5 rounded-sm border border-hairline bg-card" />
                                                            {t("legendFree")}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <span className="size-2.5 rounded-sm bg-indigo-500" />
                                                            {t("legendTaken")}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <span className="size-2.5 rounded-sm bg-emerald-500" />
                                                            {t(
                                                                "legendSelected",
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    )
                                ) : null}

                                {/* Weekly Hours Summary */}
                                {scheduledWorkingDaysCount > 0 ? (
                                    <div className="flex items-center justify-between rounded-xl border border-hairline/80 bg-card/60 px-3 py-2 text-[12px]">
                                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                                            <Clock className="size-3.5 text-muted-foreground" />
                                            <span>Weekly Schedule</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-gray">
                                            <span className="font-semibold text-foreground">
                                                {scheduledWorkingDaysCount}{" "}
                                                working days
                                            </span>
                                            <span>•</span>
                                            <span className="font-semibold text-foreground">
                                                ~
                                                {Math.round(
                                                    totalWeeklyScheduledHours,
                                                )}{" "}
                                                scheduled hours
                                            </span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="space-y-4 pt-2">
                            <h3 className="text-[12px] font-semibold tracking-wider text-slate-gray uppercase">
                                {t("scheduleAndAccount")}
                            </h3>

                            {role !== "waiter" && role !== "cashier" ? (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <FormLabel>
                                                {t("scheduledWorkingDays")}
                                            </FormLabel>
                                            <p className="text-[11px] text-slate-gray">
                                                Optional weekly pattern — pick a
                                                shift per day, or leave Off.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 1-Click Quick Shift Presets */}
                                    {shifts.length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                            <span className="text-[11px] font-medium text-slate-gray">
                                                Presets:
                                            </span>
                                            {morningShift ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleApplyPreset(
                                                            [
                                                                "Mon",
                                                                "Tue",
                                                                "Wed",
                                                                "Thu",
                                                                "Fri",
                                                                "Sat",
                                                            ],
                                                            morningShift.id,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface-ivory px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <Sunrise className="size-3 text-amber-500" />
                                                    Mon–Sat {morningShift.name}
                                                </button>
                                            ) : null}
                                            {morningShift ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleApplyPreset(
                                                            [
                                                                "Mon",
                                                                "Tue",
                                                                "Wed",
                                                                "Thu",
                                                                "Fri",
                                                            ],
                                                            morningShift.id,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface-ivory px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <Sun className="size-3 text-amber-500" />
                                                    Mon–Fri {morningShift.name}
                                                </button>
                                            ) : null}
                                            {eveningShift ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleApplyPreset(
                                                            [
                                                                "Mon",
                                                                "Tue",
                                                                "Wed",
                                                                "Thu",
                                                                "Fri",
                                                                "Sat",
                                                            ],
                                                            eveningShift.id,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface-ivory px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <Sunset className="size-3 text-indigo-400" />
                                                    Mon–Sat {eveningShift.name}
                                                </button>
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleApplyPreset([], "")
                                                }
                                                className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface-ivory px-2 py-0.5 text-[11px] font-medium text-slate-gray hover:text-foreground transition-colors"
                                            >
                                                <Ban className="size-3 text-slate-gray" />
                                                All Off
                                            </button>
                                        </div>
                                    ) : null}

                                    <FormField
                                        control={form.control}
                                        name="dayShiftByDay"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="space-y-1.5">
                                                    {WEEKDAYS.map(day => {
                                                        const selectedShiftIdForDay =
                                                            field.value?.[
                                                                day
                                                            ] || "";
                                                        const assignedShift =
                                                            shifts.find(
                                                                s =>
                                                                    s.id ===
                                                                    selectedShiftIdForDay,
                                                            );
                                                        const isMorning =
                                                            assignedShift?.startLocalTime
                                                                ? parseInt(
                                                                      assignedShift.startLocalTime.split(
                                                                          ":",
                                                                      )[0],
                                                                      10,
                                                                  ) < 14
                                                                : false;

                                                        return (
                                                            <div
                                                                key={day}
                                                                className="flex items-center gap-2 rounded-[10px] border border-hairline/60 bg-card/60 p-1.5 transition-colors"
                                                            >
                                                                <div className="flex w-16 shrink-0 items-center gap-1.5 pl-1">
                                                                    {selectedShiftIdForDay ? (
                                                                        isMorning ? (
                                                                            <Sunrise className="size-3.5 shrink-0 text-amber-500" />
                                                                        ) : (
                                                                            <Moon className="size-3.5 shrink-0 text-indigo-400" />
                                                                        )
                                                                    ) : (
                                                                        <Ban className="size-3.5 shrink-0 text-slate-gray/40" />
                                                                    )}
                                                                    <span className="text-[12px] font-semibold text-foreground">
                                                                        {t(
                                                                            DAY_LABEL_KEYS[
                                                                                day
                                                                            ],
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <select
                                                                    value={
                                                                        selectedShiftIdForDay
                                                                    }
                                                                    onChange={e =>
                                                                        field.onChange(
                                                                            {
                                                                                ...field.value,
                                                                                [day]: e
                                                                                    .target
                                                                                    .value,
                                                                            },
                                                                        )
                                                                    }
                                                                    className="h-8 flex-1 rounded-[8px] border border-input bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                                                                >
                                                                    <option value="">
                                                                        Off
                                                                    </option>
                                                                    {shifts.map(
                                                                        shift => (
                                                                            <option
                                                                                key={
                                                                                    shift.id
                                                                                }
                                                                                value={
                                                                                    shift.id
                                                                                }
                                                                            >
                                                                                {formatShiftOptionLabel(
                                                                                    shift,
                                                                                )}
                                                                            </option>
                                                                        ),
                                                                    )}
                                                                </select>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Weekly Scheduled Hours Summary */}
                                    {scheduledWorkingDaysCount > 0 ? (
                                        <div className="flex items-center justify-between rounded-xl border border-hairline/80 bg-surface-ivory/70 px-3 py-2 text-[12px] dark:bg-card">
                                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                <Clock className="size-3.5 text-muted-foreground" />
                                                <span>Weekly Schedule</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-slate-gray">
                                                <span className="font-semibold text-foreground">
                                                    {scheduledWorkingDaysCount}{" "}
                                                    working days
                                                </span>
                                                <span>•</span>
                                                <span className="font-semibold text-foreground">
                                                    ~
                                                    {Math.round(
                                                        totalWeeklyScheduledHours,
                                                    )}{" "}
                                                    scheduled hours
                                                </span>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <Controller
                                control={form.control}
                                name="active"
                                render={({ field }) => (
                                    <div className="flex items-center justify-between rounded-[14px] border border-hairline bg-surface-ivory/40 p-4">
                                        <div>
                                            <p className="text-[14px] font-medium">
                                                {t("accountActive")}
                                            </p>
                                            <p className="text-[12px] text-slate-gray">
                                                {t("accountActiveDesc")}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                field.onChange(!field.value)
                                            }
                                            className={cn(
                                                "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer",
                                                field.value
                                                    ? "bg-emerald-600"
                                                    : "bg-zinc-300 dark:bg-zinc-700",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm transition",
                                                    field.value
                                                        ? "translate-x-5"
                                                        : "translate-x-0",
                                                )}
                                            />
                                        </button>
                                    </div>
                                )}
                            />
                        </div>
                    </form>
                </Form>

                <div className="flex shrink-0 items-center justify-between border-t border-hairline bg-white p-4 dark:bg-card">
                    {isEditMode ? (
                        <button
                            type="button"
                            onClick={() => setConfirmDeleteOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                            <Trash2 className="size-4" />
                            {t("remove")}
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => dispatch(closeAddEditStaff())}
                            className="rounded-full text-[13px]"
                        >
                            {tCommon("cancel")}
                        </Button>
                        <Button
                            type="submit"
                            form="staff-form"
                            disabled={saving || form.formState.isSubmitting}
                            className="rounded-full px-5 text-[13px] font-semibold"
                        >
                            {saving
                                ? t("saving")
                                : isEditMode
                                  ? t("saveChanges")
                                  : t("registerStaff")}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* REMOVE / DELETE CONFIRMATION MODAL */}
            {confirmDeleteOpen && editingStaff && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-in fade-in">
                    <div
                        className="fixed inset-0"
                        onClick={() => !saving && setConfirmDeleteOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-[20px] border border-hairline bg-white dark:bg-card p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="size-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                <Trash2 className="size-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-[16px] text-foreground">
                                    {t("deleteStaffTitle")}
                                </h3>
                                <p className="text-[12px] text-slate-gray mt-0.5">
                                    {editingStaff.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setConfirmDeleteOpen(false)}
                                className="size-7 rounded-full flex items-center justify-center text-slate-gray hover:bg-secondary"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="text-[13px] text-slate-gray leading-relaxed mb-6">
                            {t("deleteStaffConfirmMsg", {
                                name: editingStaff.name,
                            })}
                        </p>

                        <div className="flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={saving}
                                onClick={() => setConfirmDeleteOpen(false)}
                                className="h-9 rounded-xl text-[13px]"
                            >
                                {tCommon("cancel")}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={saving}
                                onClick={() => void handleDelete()}
                                className="h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold gap-1.5 shadow-sm"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>{t("deleting")}</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="size-3.5" />
                                        <span>{t("deleteStaffButton")}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
