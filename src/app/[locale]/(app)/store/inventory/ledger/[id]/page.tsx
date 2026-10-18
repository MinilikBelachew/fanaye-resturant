import LedgerEntryDetail from "@/domains/inventory/ui/LedgerEntryDetail";

export default function StoreLedgerEntryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return <LedgerEntryDetail params={params} backHref="/store/inventory" />;
}
