"use client";

import { useEffect, useRef, useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import {
    CircleUserRound,
    Eye,
    EyeOff,
    Lock,
    LogOut,
    Monitor,
    Moon,
    Settings,
    Sun,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useTheme, type ThemeMode } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { performSignOut } from "@/domains/identity/application/signOut";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { useUpdateMeMutation } from "@/context/services/authApi";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function validateStrongPassword(pass: string): string | null {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass))
        return "Must include at least one uppercase letter (A-Z).";
    if (!/[a-z]/.test(pass))
        return "Must include at least one lowercase letter (a-z).";
    if (!/[0-9]/.test(pass)) return "Must include at least one number (0-9).";
    return null;
}

const THEMES: {
    id: ThemeMode;
    labelKey: "light" | "dark" | "system";
    fallback: string;
    icon: typeof Sun;
}[] = [
    { id: "light", labelKey: "light", fallback: "Light", icon: Sun },
    { id: "dark", labelKey: "dark", fallback: "Dark", icon: Moon },
    { id: "system", labelKey: "system", fallback: "System", icon: Monitor },
];

export default function AccountMenu({
    compact = false,
}: {
    compact?: boolean;
}) {
    const staff = useAppSelector(selectCurrentStaff);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { mode, setMode } = useTheme();
    const [open, setOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [updateMe, { isLoading: isUpdatingPassword }] = useUpdateMeMutation();
    const rootRef = useRef<HTMLDivElement>(null);
    const tRoles = useTranslations("roles");
    const tTopBar = useTranslations("topbar");
    const tNav = useTranslations("appNav");

    useEffect(() => {
        function onClick(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    if (!staff) return null;

    const roleLabel = tRoles.has(staff.role)
        ? tRoles(staff.role)
        : ROLE_LABELS[staff.role];

    async function logOut() {
        if (signingOut) return;
        setSigningOut(true);
        setOpen(false);
        try {
            await performSignOut(dispatch);
            router.push("/sign-in");
        } finally {
            setSigningOut(false);
        }
    }

    async function handleChangePassword(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!oldPassword.trim()) {
            toast.error("Please enter your current password.");
            return;
        }
        const strongErr = validateStrongPassword(newPassword.trim());
        if (strongErr) {
            toast.error(strongErr);
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        try {
            await updateMe({
                oldPassword: oldPassword.trim(),
                password: newPassword.trim(),
            }).unwrap();

            toast.success("Password changed successfully!");
            setPasswordModalOpen(false);
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: unknown) {
            const errData = (
                err as {
                    data?: {
                        errors?: { oldPassword?: string };
                        message?: string;
                    };
                }
            )?.data;
            const message =
                errData?.errors?.oldPassword === "incorrectOldPassword"
                    ? "Current password is incorrect."
                    : errData?.message || "Failed to update password.";
            toast.error(message);
        }
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(value => !value)}
                className={
                    compact
                        ? "flex size-8 items-center justify-center rounded-md text-slate-gray hover:bg-secondary hover:text-foreground"
                        : "flex items-center gap-2 rounded-[48px] border border-hairline bg-card py-1 pr-3 pl-1 hover:bg-secondary"
                }
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label={compact ? tTopBar("account") : undefined}
            >
                {compact ? (
                    <CircleUserRound className="size-4" />
                ) : (
                    <>
                        <span className="flex size-8 items-center justify-center rounded-full bg-secondary">
                            <CircleUserRound className="size-4" />
                        </span>
                        <span className="hidden text-left sm:block">
                            <span className="block text-[13px] font-medium leading-tight">
                                {staff.name}
                            </span>
                            <span className="block text-[11px] text-slate-gray">
                                {roleLabel}
                            </span>
                        </span>
                    </>
                )}
            </button>
            {open ? (
                <div
                    role="menu"
                    className="absolute top-full right-0 z-50 mt-2 w-[260px] rounded-[16px] border border-hairline bg-popover p-2 text-popover-foreground shadow-subtle"
                >
                    <div className="px-3 py-2">
                        <p className="text-[14px] font-medium">{staff.name}</p>
                        <p className="text-[13px] text-slate-gray">
                            {roleLabel}
                        </p>
                    </div>
                    <div className="border-t border-hairline px-3 py-3">
                        <p className="mb-2 flex items-center gap-2 text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                            <Settings className="size-3.5" />
                            {tNav.has("settings")
                                ? tNav("settings")
                                : "Settings"}
                        </p>
                        <p className="mb-2 text-[13px] text-slate-gray">
                            {tTopBar.has("appearance")
                                ? tTopBar("appearance")
                                : "Appearance"}
                        </p>
                        <div
                            role="radiogroup"
                            aria-label={tTopBar("theme")}
                            className="grid grid-cols-3 gap-1 rounded-[12px] bg-secondary p-1"
                        >
                            {THEMES.map(option => {
                                const Icon = option.icon;
                                const active = mode === option.id;
                                const label = tTopBar.has(option.labelKey)
                                    ? tTopBar(option.labelKey)
                                    : option.fallback;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => setMode(option.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-1 rounded-[10px] py-2 text-[11px] font-medium",
                                            active
                                                ? "bg-card text-foreground shadow-subtle"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        <Icon className="size-4" />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {["owner", "manager", "store_manager"].includes(
                        staff.role,
                    ) ? (
                        <div className="border-t border-hairline p-1">
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setOpen(false);
                                    setPasswordModalOpen(true);
                                    setOldPassword("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
                            >
                                <Lock className="size-4 shrink-0 text-slate-gray" />
                                <span>Change Password</span>
                            </button>
                        </div>
                    ) : null}
                    <div className="border-t border-hairline p-1 pt-2">
                        <button
                            type="button"
                            role="menuitem"
                            disabled={signingOut}
                            onClick={() => void logOut()}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
                        >
                            <LogOut className="size-4 shrink-0" />
                            {signingOut
                                ? tTopBar("signingOut")
                                : tTopBar("logOut")}
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Change Password Modal */}
            {passwordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in">
                    <div
                        className="fixed inset-0"
                        onClick={() =>
                            !isUpdatingPassword && setPasswordModalOpen(false)
                        }
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-[20px] border border-hairline bg-white dark:bg-card p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-hairline">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                    <Lock className="size-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[15px] text-foreground">
                                        Change Password
                                    </h3>
                                    <p className="text-[11.5px] text-slate-gray">
                                        Update your login password
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={isUpdatingPassword}
                                onClick={() => setPasswordModalOpen(false)}
                                className="size-7 rounded-full flex items-center justify-center text-slate-gray hover:bg-secondary transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleChangePassword}
                            className="mt-4 space-y-4"
                        >
                            <div>
                                <label className="block text-[12px] font-medium text-foreground mb-1">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <Input
                                        type={
                                            showOldPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={oldPassword}
                                        onChange={e =>
                                            setOldPassword(e.target.value)
                                        }
                                        placeholder="Enter current password"
                                        className="h-9 pr-9 text-[13px]"
                                        autoComplete="current-password"
                                        disabled={isUpdatingPassword}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowOldPassword(!showOldPassword)
                                        }
                                        className="absolute right-2.5 top-2.5 text-slate-gray hover:text-foreground"
                                    >
                                        {showOldPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-foreground mb-0.5">
                                    New Password
                                </label>
                                <p className="text-[11px] text-slate-gray mb-1">
                                    At least 8 chars, 1 uppercase, 1 lowercase &
                                    1 number.
                                </p>
                                <div className="relative">
                                    <Input
                                        type={
                                            showNewPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={newPassword}
                                        onChange={e =>
                                            setNewPassword(e.target.value)
                                        }
                                        placeholder="Enter new strong password"
                                        className="h-9 pr-9 text-[13px]"
                                        autoComplete="new-password"
                                        disabled={isUpdatingPassword}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewPassword(!showNewPassword)
                                        }
                                        className="absolute right-2.5 top-2.5 text-slate-gray hover:text-foreground"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-foreground mb-1">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={confirmPassword}
                                        onChange={e =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        placeholder="Repeat new password"
                                        className="h-9 pr-9 text-[13px]"
                                        autoComplete="new-password"
                                        disabled={isUpdatingPassword}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword,
                                            )
                                        }
                                        className="absolute right-2.5 top-2.5 text-slate-gray hover:text-foreground"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isUpdatingPassword}
                                    onClick={() => setPasswordModalOpen(false)}
                                    className="h-9 rounded-xl text-[13px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        isUpdatingPassword ||
                                        !oldPassword ||
                                        newPassword.length < 8 ||
                                        newPassword !== confirmPassword
                                    }
                                    className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-[13px] font-semibold gap-1.5"
                                >
                                    {isUpdatingPassword ? (
                                        <>
                                            <RestorchSpinner className="size-3.5 " />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>Update Password</span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
