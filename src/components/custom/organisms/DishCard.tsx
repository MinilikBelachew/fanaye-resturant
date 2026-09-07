import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

export default function DishCard({
    name,
    caption,
    image,
    price,
    sold,
    featured = false,
}: {
    name: string;
    caption: string;
    image: string;
    price?: number;
    sold?: number;
    featured?: boolean;
}) {
    return (
        <article
            className={cn(
                "overflow-hidden rounded-[16px] border border-hairline bg-card shadow-subtle",
                featured && "md:col-span-2",
            )}
        >
            <div
                className={cn(
                    "relative overflow-hidden",
                    featured ? "h-[240px] md:h-[280px]" : "h-[160px]",
                )}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={image}
                    alt={name}
                    className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 p-4 text-white">
                    <p className="text-[12px] tracking-[0.06em] uppercase opacity-80">
                        {caption}
                    </p>
                    <h3 className="text-[22px] font-semibold">{name}</h3>
                    <p className="mt-1 text-[13px] opacity-90">
                        {price != null ? formatEtb(price) : null}
                        {sold != null ? ` · ${sold} sold today` : null}
                    </p>
                </div>
            </div>
        </article>
    );
}
