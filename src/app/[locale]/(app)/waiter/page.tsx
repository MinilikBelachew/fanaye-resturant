import { redirect } from "@/i18n/navigation";

export default async function WaiterIndexPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect({ href: "/waiter/tables", locale });
}
