const fs = require("fs");
const filePath =
    "c:/Users/Mekdim/Desktop/resturant/fanaye-resturant/src/domains/identity/application/nav.ts";
let code = fs.readFileSync(filePath, "utf8");

code = code.replace(
    /\{\s*\{\s*href:\s*"\/owner\/inventory\/materials"/,
    '{\n                                    href: "/owner/inventory/materials"',
);
code = code.replace(
    /\{\s*\{\s*href:\s*"\/manager\/inventory\/materials"/,
    '{\n                                    href: "/manager/inventory/materials"',
);
code = code.replace(
    /\{\s*\{\s*href:\s*"\/store\/inventory\/materials"/,
    '{\n                                    href: "/store/inventory/materials"',
);

fs.writeFileSync(filePath, code, "utf8");
console.log("Successfully fixed nav.ts");
