export type ModifierGroupKind = "included" | "extra" | "choice";

export interface ModifierOption {
    id: string;
    name: string;
    ticketLabel: string;
    priceDelta: number;
}

export interface ModifierGroup {
    id: string;
    name: string;
    kind: ModifierGroupKind;
    min: number;
    max: number;
    options: ModifierOption[];
}

export interface SelectedModifier {
    groupId: string;
    optionId: string;
    name: string;
    priceDelta: number;
}

export function modifiersKey(modifiers: SelectedModifier[]): string {
    return [...modifiers]
        .map(entry => `${entry.groupId}:${entry.optionId}`)
        .sort()
        .join("|");
}

export function formatModifiers(modifiers: SelectedModifier[]): string {
    return modifiers.map(entry => entry.name).join(" · ");
}

export function classifyModifiers(modifiers: SelectedModifier[]): {
    held: SelectedModifier[];
    extras: SelectedModifier[];
} {
    const held: SelectedModifier[] = [];
    const extras: SelectedModifier[] = [];
    for (const entry of modifiers) {
        if (/^no\s/i.test(entry.name)) {
            held.push(entry);
        } else {
            extras.push(entry);
        }
    }
    return { held, extras };
}

export function isModifierOn(
    modifiers: SelectedModifier[],
    groupId: string,
    optionId: string,
): boolean {
    return modifiers.some(
        entry => entry.groupId === groupId && entry.optionId === optionId,
    );
}

export function toggleModifier(
    group: ModifierGroup,
    option: ModifierOption,
    current: SelectedModifier[],
): SelectedModifier[] {
    const selected = isModifierOn(current, group.id, option.id);
    const snapshot: SelectedModifier = {
        groupId: group.id,
        optionId: option.id,
        name: option.ticketLabel,
        priceDelta: option.priceDelta,
    };

    if (group.kind === "choice") {
        const withoutGroup = current.filter(
            entry => entry.groupId !== group.id,
        );
        if (selected) {
            return withoutGroup;
        }
        return [...withoutGroup, snapshot];
    }

    if (selected) {
        return current.filter(
            entry =>
                !(
                    entry.groupId === group.id &&
                    entry.optionId === option.id
                ),
        );
    }
    return [...current, snapshot];
}

export function optionChecked(
    group: ModifierGroup,
    option: ModifierOption,
    current: SelectedModifier[],
): boolean {
    const on = isModifierOn(current, group.id, option.id);
    if (group.kind === "included") {
        return !on;
    }
    return on;
}

export function modifiersComplete(
    groups: ModifierGroup[],
    selected: SelectedModifier[],
): boolean {
    return groups.every(group => {
        const count = selected.filter(
            entry => entry.groupId === group.id,
        ).length;
        if (group.kind === "choice") {
            return count >= group.min && count <= group.max;
        }
        return count <= group.max;
    });
}
