import DispatcherCallDetail from "@/domains/floor/ui/DispatcherCallDetail";

export default async function DispatcherCallPage({
    params,
}: {
    params: Promise<{ tableSessionId: string }>;
}) {
    const { tableSessionId } = await params;
    return <DispatcherCallDetail tableSessionId={tableSessionId} />;
}
