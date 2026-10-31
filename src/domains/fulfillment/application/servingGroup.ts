export type ServingGroupType = "separate" | "tray1" | "tray2" | "tray3";

export interface ParsedServingGroup {
    rawTray: string | null;
    trayLabel: string | null;
    isSharedTray: boolean;
    cleanInstruction: string;
}

export function parseServingGroup(instruction?: string | null): ParsedServingGroup {
    if (!instruction) {
        return {
            rawTray: null,
            trayLabel: null,
            isSharedTray: false,
            cleanInstruction: "",
        };
    }
    const match = instruction.match(/^\[(Tray\s*\d+|Shared(?:\s*Tray)?)\]/i);
    if (match) {
        const raw = match[1];
        const numMatch = raw.match(/\d+/);
        const trayLabel = numMatch ? `Tray ${numMatch[0]}` : "Shared Tray";
        const clean = instruction.slice(match[0].length).trim();
        return {
            rawTray: raw,
            trayLabel,
            isSharedTray: true,
            cleanInstruction: clean,
        };
    }
    return {
        rawTray: null,
        trayLabel: null,
        isSharedTray: false,
        cleanInstruction: instruction.trim(),
    };
}

export function formatInstructionWithTray(
    group: ServingGroupType,
    userInstruction?: string,
): string {
    const clean = (userInstruction || "").trim();
    if (group === "tray1") {
        return clean ? `[Tray 1] ${clean}` : "[Tray 1]";
    }
    if (group === "tray2") {
        return clean ? `[Tray 2] ${clean}` : "[Tray 2]";
    }
    if (group === "tray3") {
        return clean ? `[Tray 3] ${clean}` : "[Tray 3]";
    }
    return clean;
}

