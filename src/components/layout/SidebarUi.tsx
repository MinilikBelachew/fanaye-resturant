"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

type SidebarUiValue = {
    collapsed: boolean;
    toggle: () => void;
};

const SidebarUiContext = createContext<SidebarUiValue | null>(null);

export function SidebarUiProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const toggle = useCallback(() => {
        setCollapsed(value => !value);
    }, []);
    const value = useMemo(
        () => ({ collapsed, toggle }),
        [collapsed, toggle],
    );
    return (
        <SidebarUiContext.Provider value={value}>
            {children}
        </SidebarUiContext.Provider>
    );
}

export function useSidebarUi() {
    const context = useContext(SidebarUiContext);
    if (!context) {
        throw new Error("useSidebarUi must be used within SidebarUiProvider");
    }
    return context;
}
