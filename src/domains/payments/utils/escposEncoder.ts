export interface ReceiptPrintData {
    restaurantName?: string;
    branchName?: string;
    billNumber?: string;
    date?: string;
    table?: string;
    waiter?: string;
    cashier?: string;
    lines: Array<{
        quantity: number;
        itemName: string;
        total: string;
    }>;
    total: string;
    status?: string;
    qrData?: string;
    paperWidth?: "58mm" | "80mm";
}

export function encodeReceiptToEscPos(data: ReceiptPrintData): Uint8Array {
    const is80mm = data.paperWidth === "80mm";
    const maxCols = is80mm ? 42 : 32;
    const divider = "-".repeat(maxCols) + "\n";
    const doubleDivider = "=".repeat(maxCols) + "\n";

    const bytes: number[] = [];
    const encoder = new TextEncoder();

    function addAscii(text: string) {
        const encoded = encoder.encode(text);
        for (let i = 0; i < encoded.length; i++) {
            bytes.push(encoded[i]);
        }
    }

    function formatLine(left: string, right: string, width: number): string {
        const spaces = width - left.length - right.length;
        if (spaces > 0) {
            return left + " ".repeat(spaces) + right + "\n";
        }
        return `${left} ${right}\n`;
    }

    // 1. ESC @ (Initialize Printer)
    bytes.push(0x1b, 0x40);

    // 2. ESC a 1 (Center Header)
    bytes.push(0x1b, 0x61, 0x01);

    // 3. GS ! 0x11 (Double Width & Height Header)
    bytes.push(0x1d, 0x21, 0x11);
    const restName = (data.restaurantName || "RESTAURANT").toUpperCase();
    addAscii(`${restName}\n`);

    // 4. GS ! 0x00 (Normal Font)
    bytes.push(0x1d, 0x21, 0x00);
    if (data.branchName) {
        addAscii(`${data.branchName}\n`);
    }
    addAscii(doubleDivider);

    // 5. ESC a 0 (Left Align Metadata)
    bytes.push(0x1b, 0x61, 0x00);
    if (data.billNumber) addAscii(`Receipt #: ${data.billNumber}\n`);
    if (data.date) addAscii(`Date:     ${data.date}\n`);
    if (data.table) addAscii(`Table:    ${data.table}\n`);
    if (data.waiter) addAscii(`Server:   ${data.waiter}\n`);
    if (data.cashier) addAscii(`Cashier:  ${data.cashier}\n`);
    addAscii(divider);

    // 6. Column Headers
    addAscii(formatLine("QTY  ITEM", "TOTAL", maxCols));
    addAscii(divider);

    // 7. Item Lines
    for (const item of data.lines) {
        const qtyName = `${item.quantity}x ${item.itemName}`;
        const price = `${item.total} ETB`;
        if (qtyName.length + price.length + 1 <= maxCols) {
            addAscii(formatLine(qtyName, price, maxCols));
        } else {
            addAscii(`${qtyName}\n`);
            addAscii(formatLine("", price, maxCols));
        }
    }

    // 8. Totals
    addAscii(divider);
    // Double height total
    bytes.push(0x1d, 0x21, 0x01);
    addAscii(formatLine("TOTAL:", `${data.total} ETB`, maxCols));
    bytes.push(0x1d, 0x21, 0x00);
    if (data.status) {
        addAscii(formatLine("Status:", data.status, maxCols));
    }
    addAscii(doubleDivider);

    // 9. ESC a 1 (Center Footer & QR Code)
    bytes.push(0x1b, 0x61, 0x01);

    // Hardware ESC/POS QR Code
    if (data.qrData) {
        const qrBytes = encoder.encode(data.qrData);
        const len = qrBytes.length + 3;
        const pL = len % 256;
        const pH = Math.floor(len / 256);

        // QR Model 2
        bytes.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
        // QR Module Size: 5 dots
        bytes.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x05);
        // Error Correction: Level L (7%)
        bytes.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30);
        // Store Data
        bytes.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
        for (let i = 0; i < qrBytes.length; i++) {
            bytes.push(qrBytes[i]);
        }
        // Print QR Symbol
        bytes.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
        addAscii("Scan to verify receipt\n");
    }

    addAscii("THANK YOU FOR DINING WITH US!\n");
    addAscii("*** FOR INTERNAL USE ONLY ***\n");

    // 10. Feed 2 lines to reach tear-off line (ESC d 2)
    bytes.push(0x1b, 0x64, 0x02);

    return new Uint8Array(bytes);
}

