"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, CircleUserRound } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { switchDemoStaff } from "@/context/slices/identitySlice";
import { resetDemoOps } from "@/context/slices/opsSlice";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import { homePathForRole } from "@/domains/identity/application/homePath";
import {
    DEMO_PASSWORD,
    DEMO_STAFF,
} from "@/domains/identity/infrastructure/demoStaff";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function RoleSwitcher({
    compact = false,
}: {
    compact?: boolean;
}) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const current = useAppSelector(selectCurrentStaff);
    const staffMembers = useAppSelector(
        state => state.identity.staffMembers ?? DEMO_STAFF,
    );
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 280 });
    const rootRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useLayoutEffect(() => {
        if (!open) return;

        function updateCoords() {
            const el = rootRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const width = compact
                ? 280
                : Math.min(Math.max(rect.width, 280), window.innerWidth - 16);
            const left = compact
                ? Math.min(
                      rect.right + 8,
                      window.innerWidth - width - 8,
                  )
                : Math.min(
                      Math.max(8, rect.left),
                      window.innerWidth - width - 8,
                  );
            setCoords({
                top: compact ? rect.top : rect.bottom + 8,
                left,
                width,
            });
        }

        updateCoords();
        window.addEventListener("resize", updateCoords);
        window.addEventListener("scroll", updateCoords, true);
        return () => {
            window.removeEventListener("resize", updateCoords);
            window.removeEventListener("scroll", updateCoords, true);
        };
    }, [open, compact]);

    useEffect(() => {
        function onClick(event: MouseEvent) {
            const target = event.target as Node;
            if (
                rootRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }
            setOpen(false);
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    if (!current) return null;

    const menu = open ? (
        <div
            ref={menuRef}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            className="fixed z-[80] rounded-[16px] border border-hairline bg-popover p-2 text-popover-foreground shadow-subtle"
        >
            <p className="px-3 py-2 text-[13px] font-medium text-slate-gray">
                Switch demo role
            </p>
            <ul className="sidebar-scroll max-h-[min(360px,60vh)]">
                {staffMembers.map(person => {
                    const active = person.id === current.id;
                    return (
                        <li key={person.id}>
                            <button
                                type="button"
                                onClick={() => {
                                    dispatch(switchDemoStaff(person.id));
                                    setOpen(false);
                                    router.push(homePathForRole(person.role));
                                }}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left hover:bg-accent",
                                    active && "bg-accent",
                                )}
                            >
                                <CircleUserRound className="size-5 shrink-0" />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[14px] font-medium">
                                        {ROLE_LABELS[person.role]}
                                    </span>
                                    <span className="block text-[13px] text-slate-gray">
                                        {person.name}
                                    </span>
                                </span>
                                {active ? (
                                    <Check className="size-4 text-brand" />
                                ) : null}
                            </button>
                        </li>
                    );
                })}
            </ul>
            <div className="mt-2 border-t border-hairline px-3 py-2">
                <p className="text-[12px] text-slate-gray">
                    Password for all demos: {DEMO_PASSWORD}
                </p>
                <button
                    type="button"
                    className="mt-1 text-[12px] font-medium text-brand"
                    onClick={() => {
                        dispatch(resetDemoOps());
                        setOpen(false);
                    }}
                >
                    Reset floor demo
                </button>
            </div>
        </div>
    ) : null;

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(value => !value)}
                title={
                    compact
                        ? `${current.name} · ${ROLE_LABELS[current.role]}`
                        : undefined
                }
                className={
                    compact
                        ? "flex size-10 items-center justify-center rounded-full border border-hairline hover:bg-secondary"
                        : "flex w-full items-center gap-3 rounded-[16px] p-2 text-left hover:bg-accent"
                }
            >
                {compact ? (
                    <CircleUserRound className="size-5" />
                ) : (
                    <>
                        <span className="flex size-10 items-center justify-center rounded-full border border-hairline bg-card">
                            <CircleUserRound className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-slate-gray">
                                {ROLE_LABELS[current.role]}
                            </span>
                            <span className="block truncate text-[15px] font-medium text-ink-charcoal">
                                {current.name}
                            </span>
                        </span>
                        <ChevronDown className="size-4 text-steel-gray" />
                    </>
                )}
            </button>
            {mounted && menu ? createPortal(menu, document.body) : null}
        </div>
    );
}
