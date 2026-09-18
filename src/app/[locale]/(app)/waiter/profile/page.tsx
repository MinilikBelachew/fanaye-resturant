"use client";

import { CircleUserRound, LogOut, Shield } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import PageHeader from "@/components/custom/organisms/PageHeader";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import { performSignOut } from "@/domains/identity/application/signOut";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useRouter } from "@/i18n/navigation";

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-hairline py-3 last:border-b-0">
            <p className="text-[13px] text-slate-gray">{label}</p>
            <p className="text-right text-[14px] font-medium">{value}</p>
        </div>
    );
}

export default function WaiterProfilePage() {
    const staff = useAppSelector(selectCurrentStaff);
    const session = useAppSelector(state => state.identity.session);
    const dispatch = useAppDispatch();
    const router = useRouter();

    if (!staff) return null;

    return (
        <section className="mx-auto w-full max-w-3xl space-y-6">
            <PageHeader
                eyebrow="Account"
                title="Profile"
                description="Your floor identity, branch, and appearance."
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
                    <Badge
                        variant={
                            session?.shiftSessionId ? "success" : "secondary"
                        }
                    >
                        {session?.shiftSessionId ? "On shift" : "Off shift"}
                    </Badge>
                </div>
                <div className="px-5">
                    <InfoRow label="Role" value={ROLE_LABELS[staff.role]} />
                    <InfoRow label="Email" value={staff.email || "—"} />
                    <InfoRow label="Phone" value={staff.phone || "—"} />
                    <InfoRow
                        label="Branch"
                        value={session?.branchName || "This branch"}
                    />
                </div>
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
                            Sign out of this device.
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={async () => {
                        await performSignOut(dispatch);
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
