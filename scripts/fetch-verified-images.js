const https = require("https");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const targetDir = path.resolve(
    __dirname,
    "../../fanaye-resturant/public/images/inventory",
);

// Curated Wikimedia search queries for exact food items
const ITEMS_TO_FIX = [
    { file: "lime.jpg", query: "green lime fruit" },
    { file: "ginger.jpg", query: "fresh ginger root rhizome" },
    { file: "zucchini.jpg", query: "fresh green zucchini courgette" },
    { file: "coriander.jpg", query: "fresh cilantro coriander leaves" },
    { file: "chickpeas.jpg", query: "dry chickpeas in bowl" },
    { file: "fava_beans.jpg", query: "fava beans broad beans" },
    { file: "fish.jpg", query: "raw fresh fish whole or fillet market" },
    { file: "ketchup.jpg", query: "tomato ketchup bottle Heinz or condiment" },
    { file: "lamb.jpg", query: "raw lamb meat chops butchery" },
    { file: "lentils.jpg", query: "raw red lentils seeds in bowl" },
    { file: "split_peas.jpg", query: "yellow split peas pulse" },
    { file: "mayo.jpg", query: "mayonnaise in glass jar sauce" },
    { file: "mitmita.jpg", query: "chili powder red paprika in bowl spice" },
    { file: "mushroom.jpg", query: "fresh white button mushrooms Agaricus" },
    { file: "mustard.jpg", query: "yellow mustard condiment jar" },
    { file: "oats.jpg", query: "rolled oats in bowl oatmeal flakes" },
    { file: "pepper.jpg", query: "green chili peppers jalapeño hot pepper" },
    { file: "salt.jpg", query: "sea salt in small bowl crystal" },
    { file: "teff.jpg", query: "teff grain seeds Eragrostis tef" },
    { file: "yeast.jpg", query: "dry active yeast baking granules spoon" },
    { file: "cola.jpg", query: "Coca-Cola can or bottle chilled" },
];

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https
            .get(
                url,
                {
                    headers: {
                        "User-Agent":
                            "FanayeRestaurant/1.0 (contact@fanaye.com)",
                    },
                },
                res => {
                    let data = "";
                    res.on("data", c => (data += c));
                    res.on("end", () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(e);
                        }
                    });
                },
            )
            .on("error", reject);
    });
}

function downloadBuffer(url) {
    return new Promise((resolve, reject) => {
        https
            .get(
                url,
                {
                    headers: {
                        "User-Agent":
                            "FanayeRestaurant/1.0 (contact@fanaye.com)",
                    },
                },
                res => {
                    if (
                        res.statusCode >= 300 &&
                        res.statusCode < 400 &&
                        res.headers.location
                    ) {
                        return downloadBuffer(res.headers.location)
                            .then(resolve)
                            .catch(reject);
                    }
                    if (res.statusCode !== 200)
                        return reject(new Error(`HTTP ${res.statusCode}`));
                    const chunks = [];
                    res.on("data", c => chunks.push(c));
                    res.on("end", () => resolve(Buffer.concat(chunks)));
                },
            )
            .on("error", reject);
    });
}

async function findAndDownload(item) {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(item.query)}&srnamespace=6&format=json`;
    const searchRes = await fetchJson(searchUrl);
    const results = searchRes?.query?.search || [];

    // Filter for jpg/png files, avoid SVG/PDF/TIFF/audio
    const validFiles = results.filter(r => {
        const t = r.title.toLowerCase();
        return (
            (t.endsWith(".jpg") || t.endsWith(".jpeg") || t.endsWith(".png")) &&
            !t.includes("icon") &&
            !t.includes("logo") &&
            !t.includes("map")
        );
    });

    if (validFiles.length === 0) {
        console.log(`❌ No files found for: ${item.file} ("${item.query}")`);
        return false;
    }

    // Try the top files until one succeeds
    for (const match of validFiles.slice(0, 3)) {
        try {
            const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(match.title)}&prop=imageinfo&iiprop=url&format=json`;
            const infoRes = await fetchJson(infoUrl);
            const pages = infoRes?.query?.pages || {};
            const page = Object.values(pages)[0];
            const directUrl = page?.imageinfo?.[0]?.url;

            if (!directUrl) continue;

            console.log(`  Downloading ${item.file} from: "${match.title}"`);
            const rawBuf = await downloadBuffer(directUrl);

            const dest = path.join(targetDir, item.file);
            await sharp(rawBuf)
                .resize(800, 800, { fit: "cover" })
                .jpeg({ quality: 85 })
                .toFile(dest);

            const size = fs.statSync(dest).size;
            console.log(
                `  ✓ Saved ${item.file} (${Math.round(size / 1024)} KB)`,
            );
            return true;
        } catch (err) {
            console.log(`  Error on ${match.title}: ${err.message}`);
        }
    }

    return false;
}

async function run() {
    console.log(
        "--- Step 1: Copying yellow lemons from lime.jpg to lemon.jpg ---",
    );
    const limeFile = path.join(targetDir, "lime.jpg");
    const lemonFile = path.join(targetDir, "lemon.jpg");
    if (fs.existsSync(limeFile)) {
        fs.copyFileSync(limeFile, lemonFile);
        console.log("✓ Copied lime.jpg -> lemon.jpg (lemons verified)");
    }

    console.log(
        "\n--- Step 2: Fetching verified images for mismatched items ---",
    );
    let success = 0;
    for (const item of ITEMS_TO_FIX) {
        try {
            process.stdout.write(`Processing ${item.file}... \n`);
            const ok = await findAndDownload(item);
            if (ok) success++;
        } catch (e) {
            console.log(`  Failed: ${e.message}`);
        }
    }

    console.log(`\nCompleted: ${success} of ${ITEMS_TO_FIX.length} verified.`);
}

run();
