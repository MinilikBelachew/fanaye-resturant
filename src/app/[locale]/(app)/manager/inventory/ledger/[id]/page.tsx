import LedgerEntryDetail from "@/domains/inventory/ui/LedgerEntryDetail";

export default function ManagerLedgerEntryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return <LedgerEntryDetail params={params} backHref="/manager/inventory" />;
}
