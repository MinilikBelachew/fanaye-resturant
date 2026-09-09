const fs = require("fs");
const path =
    "c:/Users/bmini/Desktop/fanaye-resturant/fanaye-resturant-frontend/src/domains/site/puck/sitePuckConfig.tsx";
let s = fs.readFileSync(path, "utf8");
const keys = [
    "Menu",
    "About",
    "Gallery",
    "Carousel",
    "Features",
    "Testimonials",
    "CtaBanner",
    "Hours",
    "Contact",
    "Footer",
];

for (const componentKey of keys) {
    const marker = `        ${componentKey}: {`;
    const idx = s.indexOf(marker);
    console.log(componentKey, idx);
    if (idx < 0) continue;
    const fieldsIdx = s.indexOf("fields: {", idx);
    const after = s.slice(fieldsIdx, fieldsIdx + 60);
    if (after.includes("typographyFields")) {
        console.log("skip fields", componentKey);
        continue;
    }
    s =
        s.slice(0, fieldsIdx) +
        "fields: {\n                ...typographyFields()," +
        s.slice(fieldsIdx + "fields: {".length);
    console.log("ok fields", componentKey);
}

for (const componentKey of keys) {
    const marker = `        ${componentKey}: {`;
    const idx = s.indexOf(marker);
    if (idx < 0) continue;
    const defIdx = s.indexOf("defaultProps: {", idx);
    const after = s.slice(defIdx, defIdx + 60);
    if (after.includes("TYPOGRAPHY_DEFAULTS")) {
        console.log("skip defaults", componentKey);
        continue;
    }
    s =
        s.slice(0, defIdx) +
        "defaultProps: {\n                ...TYPOGRAPHY_DEFAULTS," +
        s.slice(defIdx + "defaultProps: {".length);
    console.log("ok defaults", componentKey);
}

fs.writeFileSync(path, s);
console.log("done");
