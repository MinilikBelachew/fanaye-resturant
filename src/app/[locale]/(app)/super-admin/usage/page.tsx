import { redirect } from "@/i18n/navigation";

export default async function UsageRedirectPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect({ href: "/super-admin/live-ops", locale });
}
