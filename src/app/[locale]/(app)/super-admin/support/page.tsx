import { redirect } from "@/i18n/navigation";

export default async function SupportRedirectPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect({ href: "/super-admin/staff", locale });
}
