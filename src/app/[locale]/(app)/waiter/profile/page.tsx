"use client";

import { CircleUserRound, LogOut, Shield } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { signOutDemo } from "@/context/slices/identitySlice";
import PageHeader from "@/components/custom/organisms/PageHeader";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import RoleSwitcher from "@/domains/identity/ui/RoleSwitcher";
import {
    DEMO_PASSWORD,
} from "@/domains/identity/infrastructure/demoStaff";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useRouter } from "@/i18n/navigation";

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-hairline py-3 last:border-b-0">
            <p className="text-[13px] text-slate-gray">{label}</p>
            <p className="text-right text-[14px] font-medium">{value}</p>
        </div>
    );
}

export default function WaiterProfilePage() {
    const staff = useAppSelector(selectCurrentStaff);
    const dispatch = useAppDispatch();
    const router = useRouter();

    if (!staff) return null;

    return (
        <section className="mx-auto w-full max-w-3xl space-y-6">
            <PageHeader
                eyebrow="Account"
                title="Profile"
                description="Your floor identity, demo role, and appearance."
            />

            <div className="overflow-hidden rounded-[20px] border border-hairline bg-card shadow-subtle">
                <div className="flex items-center gap-4 bg-gradient-to-t from-card to-secondary/70 px-5 py-6">
                    <span className="flex size-16 items-center justify-center rounded-full border border-hairline bg-card">
                        <CircleUserRound className="size-8 text-slate-gray" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[22px] font-semibold">
                            {staff.name}
                        </p>
                        <p className="mt-0.5 text-[14px] text-slate-gray">
                            {ROLE_LABELS[staff.role]}
                        </p>
                    </div>
                    <Badge variant={staff.active ? "success" : "secondary"}>
                        {staff.active ? "On shift" : "Inactive"}
                    </Badge>
                </div>
                <div className="px-5">
                    <InfoRow label="Role" value={ROLE_LABELS[staff.role]} />
                    <InfoRow label="Staff ID" value={staff.id} />
                    <InfoRow label="House" value="Fanaye · Bole" />
                    <InfoRow label="Demo PIN" value={DEMO_PASSWORD} />
                </div>
            </div>

            <div className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle">
                <p className="text-[13px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                    Switch demo role
                </p>
                <p className="mt-1 mb-3 text-[13px] text-slate-gray">
                    Jump to kitchen, cashier, or another seat without signing
                    in again.
                </p>
                <RoleSwitcher />
            </div>

            <div className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[13px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                            Appearance
                        </p>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            Light, dark, or match the device.
                        </p>
                    </div>
                    <div className="w-[180px]">
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-hairline bg-card p-5 shadow-subtle">
                <div className="flex items-start gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-slate-gray">
                        <Shield className="size-4" />
                    </span>
                    <div>
                        <p className="text-[15px] font-semibold">Session</p>
                        <p className="text-[13px] text-slate-gray">
                            Sign out of this demo seat.
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={() => {
                        dispatch(signOutDemo());
                        router.push("/sign-in");
                    }}
                >
                    <LogOut className="size-4" />
                    Sign out
                </Button>
            </div>
        </section>
    );
}
