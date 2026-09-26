"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    useCreateBranchMutation,
    useListBranchesQuery,
    type CreateBranchBody,
} from "@/context/services/branchesApi";
import { toast } from "@/lib/toast";
import { X } from "lucide-react";

export default function AddBranchSheet({
    open,
    onClose,
    tenantId,
}: {
    open: boolean;
    onClose: () => void;
    tenantId?: string;
}) {
    const t = useTranslations("owner");
    const { data } = useListBranchesQuery(tenantId ? { tenantId } : undefined, {
        skip: !open,
    });
    const [createBranch, { isLoading }] = useCreateBranchMutation();
    const [name, setName] = useState("");
    const [displayCode, setDisplayCode] = useState("");
    const [tableCount, setTableCount] = useState("8");
    const [copyFromBranchId, setCopyFromBranchId] = useState("");
    const [managerName, setManagerName] = useState("");
    const [managerEmail, setManagerEmail] = useState("");
    const [managerPhone, setManagerPhone] = useState("");
    const [managerPassword, setManagerPassword] = useState("");

    if (!open) return null;

    function reset() {
        setName("");
        setDisplayCode("");
        setTableCount("8");
        setCopyFromBranchId("");
        setManagerName("");
        setManagerEmail("");
        setManagerPhone("");
        setManagerPassword("");
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const body: CreateBranchBody = {
            name: name.trim(),
            ...(displayCode.trim() ? { displayCode: displayCode.trim() } : {}),
            tableCount: Number(tableCount) || 8,
            ...(copyFromBranchId ? { copyFromBranchId } : {}),
            ...(tenantId ? { tenantId } : {}),
            manager: {
                name: managerName.trim(),
                password: managerPassword,
                ...(managerEmail.trim() ? { email: managerEmail.trim() } : {}),
                ...(managerPhone.trim() ? { phone: managerPhone.trim() } : {}),
            },
        };
        try {
            await createBranch(body).unwrap();
            toast.success(t("branchCreated"));
            reset();
            onClose();
        } catch (err) {
            toast.fromUnknown(err, t("branchCreateError"));
        }
    }

    const atLimit = data != null && data.activeCount >= data.maxBranches;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
            <button
                type="button"
                className="absolute inset-0 cursor-default"
                aria-label={t("closeBranchMenu")}
                onClick={onClose}
            />
            <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-hairline bg-card shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
                    <div>
                        <h2 className="text-[17px] font-semibold">
                            {t("addBranchTitle")}
                        </h2>
                        <p className="mt-1 text-[12px] text-slate-gray">
                            {t("addBranchDesc")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 text-slate-gray hover:bg-secondary"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="flex flex-1 flex-col overflow-y-auto px-5 py-4"
                >
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="branch-name">
                                {t("branchName")}
                            </Label>
                            <Input
                                id="branch-name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                minLength={2}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="branch-code">
                                {t("branchCode")}
                            </Label>
                            <Input
                                id="branch-code"
                                value={displayCode}
                                onChange={e => setDisplayCode(e.target.value)}
                                placeholder={t("branchCodeHint")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="table-count">
                                {t("tableCountSeed")}
                            </Label>
                            <Input
                                id="table-count"
                                type="number"
                                min={0}
                                max={60}
                                value={tableCount}
                                onChange={e => setTableCount(e.target.value)}
                            />
                        </div>
                        {(data?.data.length ?? 0) > 0 ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="copy-from">
                                    {t("copyFromBranch")}
                                </Label>
                                <select
                                    id="copy-from"
                                    value={copyFromBranchId}
                                    onChange={e =>
                                        setCopyFromBranchId(e.target.value)
                                    }
                                    className="h-10 w-full rounded-md border border-hairline bg-card px-3 text-[13px]"
                                >
                                    <option value="">
                                        {t("copyFromNone")}
                                    </option>
                                    {data?.data.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        <div className="border-t border-hairline pt-4">
                            <p className="mb-3 text-[12px] font-medium tracking-wide text-slate-gray uppercase">
                                {t("managerSection")}
                            </p>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="mgr-name">
                                        {t("managerName")}
                                    </Label>
                                    <Input
                                        id="mgr-name"
                                        value={managerName}
                                        onChange={e =>
                                            setManagerName(e.target.value)
                                        }
                                        required
                                        minLength={2}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="mgr-email">
                                        {t("managerEmail")}
                                    </Label>
                                    <Input
                                        id="mgr-email"
                                        type="email"
                                        value={managerEmail}
                                        onChange={e =>
                                            setManagerEmail(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="mgr-phone">
                                        {t("managerPhone")}
                                    </Label>
                                    <Input
                                        id="mgr-phone"
                                        value={managerPhone}
                                        onChange={e =>
                                            setManagerPhone(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="mgr-pass">
                                        {t("managerPassword")}
                                    </Label>
                                    <Input
                                        id="mgr-pass"
                                        type="password"
                                        value={managerPassword}
                                        onChange={e =>
                                            setManagerPassword(e.target.value)
                                        }
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex gap-2 border-t border-hairline pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            {t("closeBranchMenu")}
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isLoading || atLimit || !name.trim()}
                        >
                            {isLoading
                                ? t("creatingBranch")
                                : t("createBranch")}
                        </Button>
                    </div>
                </form>
            </aside>
        </div>
    );
}
