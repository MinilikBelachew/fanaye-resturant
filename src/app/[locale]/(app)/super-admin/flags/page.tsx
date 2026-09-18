import { redirect } from "@/i18n/navigation";

export default async function FlagsRedirectPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect({ href: "/super-admin", locale });
}
