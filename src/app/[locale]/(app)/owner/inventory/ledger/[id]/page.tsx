import LedgerEntryDetail from "@/domains/inventory/ui/LedgerEntryDetail";

export default function OwnerLedgerEntryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return <LedgerEntryDetail params={params} backHref="/owner/inventory" />;
}
