import { Button } from "@/components/ui/button";

export default function ComingSoon({
    title,
    body,
}: {
    title: string;
    body: string;
}) {
    return (
        <section className="max-w-2xl">
            <h1 className="text-[32px] font-semibold tracking-tight">
                {title}
            </h1>
            <p className="mt-2 text-[16px] leading-[1.56] text-slate-gray">
                {body}
            </p>
            <Button className="mt-6" disabled>
                Coming in a later demo slice
            </Button>
        </section>
    );
}
