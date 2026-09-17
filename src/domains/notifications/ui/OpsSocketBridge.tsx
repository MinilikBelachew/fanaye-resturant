"use client";

import { useOpsSocket } from "@/domains/notifications/application/useOpsSocket";

/** Mount once under authenticated app shell to keep a single Socket.IO connection. */
export default function OpsSocketBridge() {
    useOpsSocket();
    return null;
}
