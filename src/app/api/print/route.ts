import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            bill,
            port = "COM9",
            paperWidth = "58mm",
            table,
            waiter,
            cashier,
            restaurantName,
            branchName,
        } = body;

        if (!bill) {
            return NextResponse.json({ error: "Missing bill payload" }, { status: 400 });
        }

        const lines = (bill.lines || []).map((l: { quantity: number; itemName: string; lineTotal: string }) => ({
            quantity: l.quantity,
            itemName: l.itemName,
            total: Number(l.lineTotal || 0).toLocaleString(),
        }));

        const printPayload = {
            paperWidth,
            restaurantName: restaurantName || bill.restaurantName || "RESTAURANT",
            branchName: branchName || bill.branchName || "Main Branch",
            billNumber: bill.billNumber || "N/A",
            date: bill.generatedAt
                ? new Date(bill.generatedAt).toLocaleString([], {
                      timeZone: "Africa/Addis_Ababa",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                  })
                : new Date().toLocaleString([], {
                      timeZone: "Africa/Addis_Ababa",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                  }),
            table: table || "",
            waiter: waiter || "",
            cashier: cashier || "",
            lines,
            total: Number(bill.total || bill.subtotal || 0).toLocaleString(),
            status: (bill.status || "PAID").toUpperCase(),
            qrData: bill.billId ? `receipt/${bill.billId}` : bill.billNumber || "RECEIPT",
        };

        const tempFile = path.join(os.tmpdir(), `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
        fs.writeFileSync(tempFile, JSON.stringify(printPayload), "utf8");

        const scriptPath = path.join(process.cwd(), "scripts", "print_pos.ps1");

        const result = await new Promise<{ success: boolean; output: string }>((resolve, reject) => {
            execFile(
                "powershell.exe",
                ["-ExecutionPolicy", "Bypass", "-File", scriptPath, "-Port", port, "-JsonFile", tempFile],
                { timeout: 8000 },
                (error, stdout, stderr) => {
                    try {
                        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    } catch {
                        // ignore cleanup error
                    }

                    if (error) {
                        return reject(new Error(stderr || error.message || "Failed to print to serial port"));
                    }
                    resolve({ success: true, output: stdout });
                },
            );
        });

        return NextResponse.json(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
