const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svg = fs.readFileSync(
    path.join("public", "media", "logos", "logo_07_golden_cloche.svg"),
);
const outDir = path.join("public", "icons");
fs.mkdirSync(outDir, { recursive: true });

async function main() {
    await sharp(svg)
        .resize(192, 192)
        .png()
        .toFile(path.join(outDir, "icon-192.png"));
    await sharp(svg)
        .resize(512, 512)
        .png()
        .toFile(path.join(outDir, "icon-512.png"));
    await sharp(svg)
        .resize(180, 180)
        .png()
        .toFile(path.join(outDir, "apple-touch-icon.png"));
    console.log("PWA icons generated");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
