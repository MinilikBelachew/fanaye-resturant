"use client";

import { useEffect, useRef, useState } from "react";
import {
    CircleUserRound,
    LogOut,
    Monitor,
    Moon,
    Settings,
    Sun,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme, type ThemeMode } from "@/components/theme/ThemeProvider";
import { performSignOut } from "@/domains/identity/application/signOut";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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
        </div>
    );
}
