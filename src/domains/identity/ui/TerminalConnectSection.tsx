"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
    Wifi,
    QrCode,
    Copy,
    Check,
    ExternalLink,
    Smartphone,
    UtensilsCrossed,
    Coffee,
    Receipt,
    Wine,
    Cake,
    Info,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";

interface StationLink {
    title: string;
    path: string;
    description: string;
    icon: React.ElementType;
    badge: string;
    badgeColor: string;
}

const STATIONS: StationLink[] = [
    {
        title: "Waiters & Floor POS",
        path: "/waiter",
        description:
            "Mobile ordering, table floor plan, split bills, and order status.",
        icon: Smartphone,
        badge: "Floor Staff",
        badgeColor: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    },
    {
        title: "Kitchen Display (KDS)",
        path: "/kitchen",
        description:
            "Live kitchen tickets, order queue, prep timers, and order ready beeps.",
        icon: UtensilsCrossed,
        badge: "Chef Station",
        badgeColor: "bg-red-500/10 text-red-600 border-red-500/20",
    },
    {
        title: "Cashier Register",
        path: "/cashier",
        description:
            "Bill settlements, cash drawers, thermal receipt printing, and daily reconciliation.",
        icon: Receipt,
        badge: "Cashier",
        badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    {
        title: "Barista & Coffee",
        path: "/barista",
        description:
            "Dedicated station for espresso, buna, tea, and specialty beverages.",
        icon: Coffee,
        badge: "Buna Station",
        badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    {
        title: "Bar & Drinks",
        path: "/soft-drinks",
        description:
            "Beverage station for soft drinks, beers, wines, and bottled water.",
        icon: Wine,
        badge: "Bar Station",
        badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    {
        title: "Bakery & Desserts",
        path: "/cakes",
        description: "Live dispatch for cakes, pastries, and dessert orders.",
        icon: Cake,
        badge: "Bakery",
        badgeColor: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    },
];

export default function TerminalConnectSection() {
    const [origin, setOrigin] = useState<string>("");
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [copiedPath, setCopiedPath] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const currentOrigin = window.location.origin;
            setOrigin(currentOrigin);

            // Generate high-resolution QR code for the main floor app
            QRCode.toDataURL(currentOrigin, {
                width: 260,
                margin: 2,
                color: {
                    dark: "#18181B",
                    light: "#FFFFFF",
                },
            })
                .then(setQrCodeUrl)
                .catch(() => {});
        }
    }, []);

    const copyToClipboard = (text: string, path: string) => {
        if (typeof navigator !== "undefined") {
            navigator.clipboard.writeText(text);
            setCopiedPath(path);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopiedPath(null), 2500);
        }
    };

    const isLocalhost =
        origin.includes("localhost") || origin.includes("127.0.0.1");

    return (
        <div className="space-y-6">
            {/* Top Server IP Banner */}
            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Wifi className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Local Restaurant Network (Wi-Fi)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Staff tablets and phones connect to this
                                    address over local Wi-Fi without internet.
                                </CardDescription>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className="w-fit px-3 py-1 text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1.5"
                        >
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Server Live
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/60">
                        <div className="flex-1 font-mono text-sm sm:text-base font-semibold text-foreground truncate">
                            {origin || "http://localhost:3000"}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-9 gap-1.5 text-xs font-medium"
                                onClick={() => copyToClipboard(origin, "main")}
                            >
                                {copiedPath === "main" ? (
                                    <>
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5" />
                                        Copy Address
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {isLocalhost && (
                        <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">
                                    Connecting from staff phones or tablets?
                                </p>
                                <p className="text-muted-foreground mt-0.5">
                                    You are viewing from the main PC. On waiter
                                    phones, connect them to your restaurant
                                    Wi-Fi (or PC Mobile Hotspot) and enter your
                                    PC's IP address (e.g.{" "}
                                    <code>http://192.168.137.1:3000</code>).
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Main QR Code & Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <Card className="md:col-span-5 border-border bg-card shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                            <QrCode className="h-4 w-4" />
                            Scan to Connect Staff Phone
                        </div>
                        <CardDescription className="text-xs">
                            Point any smartphone camera at this QR code to open
                            the restaurant app immediately.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-4">
                        <div className="p-3 bg-white rounded-2xl shadow-inner border border-border/80">
                            {qrCodeUrl ? (
                                <img
                                    src={qrCodeUrl}
                                    alt="Staff QR Code"
                                    className="w-48 h-48 rounded-xl object-contain"
                                />
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center bg-muted text-muted-foreground text-xs">
                                    Generating QR...
                                </div>
                            )}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground text-center max-w-[220px]">
                            Works on Android and iPhone without downloading from
                            App Store.
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-7 border-border bg-card shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                            3-Step Quick Setup Guide
                        </CardTitle>
                        <CardDescription className="text-xs">
                            How waiters and kitchen staff connect in under 30
                            seconds.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                1
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-foreground">
                                    Connect to Restaurant Wi-Fi
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Turn on Wi-Fi on the waiter phone or kitchen
                                    tablet, and select your restaurant network
                                    (or the PC Mobile Hotspot). No internet
                                    connection is needed.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                2
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-foreground">
                                    Scan QR Code or Open Link
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Scan the QR code on the left, or open
                                    Chrome/Safari and enter{" "}
                                    <code>
                                        {origin || "http://192.168.137.1:3000"}
                                    </code>
                                    .
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                3
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-foreground">
                                    Enter Staff PIN
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    The waiter or chef enters their 4-digit PIN.
                                    The system automatically loads their
                                    assigned station (Floor Map or Kitchen
                                    Display).
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Direct Station Links Grid */}
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                    Dedicated Station URLs (Kitchen, Bar, Cashier)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {STATIONS.map(station => {
                        const Icon = station.icon;
                        const fullUrl = `${origin}${station.path}`;
                        const isCopied = copiedPath === station.path;

                        return (
                            <Card
                                key={station.path}
                                className="border-border/80 bg-card/60 hover:bg-card transition-colors flex flex-col justify-between shadow-none hover:shadow-sm"
                            >
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-medium">
                                                    {station.title}
                                                </CardTitle>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 py-0 mt-0.5 font-normal ${station.badgeColor}`}
                                                >
                                                    {station.badge}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <CardDescription className="text-xs mt-2 line-clamp-2">
                                        {station.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                                        <code className="text-[11px] font-mono text-muted-foreground truncate">
                                            {station.path}
                                        </code>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                title="Copy Link"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        fullUrl,
                                                        station.path,
                                                    )
                                                }
                                            >
                                                {isCopied ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                title="Open Station in New Tab"
                                                onClick={() =>
                                                    window.open(
                                                        fullUrl,
                                                        "_blank",
                                                    )
                                                }
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
