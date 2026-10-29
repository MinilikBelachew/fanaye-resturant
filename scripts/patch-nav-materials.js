const fs = require("fs");
const path = require("path");

const filePath = path.resolve(
    "c:/Users/Mekdim/Desktop/resturant/fanaye-resturant/src/domains/identity/application/nav.ts",
);
let code = fs.readFileSync(filePath, "utf8");

const materialsItem = role => `                                {
                                    href: "/${role}/inventory/materials",
                                    label: "Materials",
                                    icon: UtensilsCrossed,
                                },`;

// Replace in owner
if (!code.includes('href: "/owner/inventory/materials"')) {
    code = code.replace(
        'href: "/owner/inventory/transfers",',
        `${materialsItem("owner")}\n                                {\n                                    href: "/owner/inventory/transfers",`,
    );
}

// Replace in manager
if (!code.includes('href: "/manager/inventory/materials"')) {
    code = code.replace(
        'href: "/manager/inventory/transfers",',
        `${materialsItem("manager")}\n                                {\n                                    href: "/manager/inventory/transfers",`,
    );
}

// Replace in store
if (!code.includes('href: "/store/inventory/materials"')) {
    code = code.replace(
        'href: "/store/inventory/transfers",',
        `${materialsItem("store")}\n                                {\n                                    href: "/store/inventory/transfers",`,
    );
}

fs.writeFileSync(filePath, code, "utf8");
console.log(
    "Successfully updated nav.ts with materials link for owner, manager, and store",
);
