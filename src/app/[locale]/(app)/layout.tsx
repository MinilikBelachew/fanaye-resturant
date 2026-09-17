import AppShell from "@/components/layout/AppShell";
import OpsSocketBridge from "@/domains/notifications/ui/OpsSocketBridge";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <OpsSocketBridge />
            <AppShell>{children}</AppShell>
        </>
    );
}
