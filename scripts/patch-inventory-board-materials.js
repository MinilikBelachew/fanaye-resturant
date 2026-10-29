const fs = require("fs");
const path = require("path");

const filePath = path.resolve(
    "c:/Users/Mekdim/Desktop/resturant/fanaye-resturant/src/domains/inventory/ui/InventoryBoard.tsx",
);
let code = fs.readFileSync(filePath, "utf8");

// 1. Add import
if (!code.includes("import InventoryMaterialsPanel")) {
    code = code.replace(
        'import InventoryProductionPanel from "@/domains/inventory/ui/InventoryProductionPanel";',
        'import InventoryProductionPanel from "@/domains/inventory/ui/InventoryProductionPanel";\nimport InventoryMaterialsPanel from "@/domains/inventory/ui/InventoryMaterialsPanel";',
    );
}

// 2. Add Tab
if (!code.includes('| "materials"')) {
    code = code.replace(
        '| "ingredients"\n    | "ledger"',
        '| "ingredients"\n    | "materials"\n    | "ledger"',
    );
}

// 3. Update export default function
if (code.includes("export default function InventoryBoard() {")) {
    code = code.replace(
        "export default function InventoryBoard() {",
        "export default function InventoryBoard({ initialTab }: { initialTab?: Tab } = {}) {",
    );
}

// 4. Initial state of tab
if (code.includes('const [tab, setTab] = useState<Tab>("stock");')) {
    code = code.replace(
        'const [tab, setTab] = useState<Tab>("stock");',
        'const [tab, setTab] = useState<Tab>(initialTab || "stock");\n\n    useEffect(() => {\n        if (initialTab) {\n            setTab(initialTab);\n        }\n    }, [initialTab]);',
    );
}

// 5. Add materials to tabs list
if (!code.includes('id: "materials"')) {
    code = code.replace(
        '{ id: "ingredients", label: t("tabs.ingredients") },',
        `{ id: "ingredients", label: t("tabs.ingredients") },
            {
                id: "materials",
                label: "Materials",
                icon: Boxes,
                iconColor: "text-amber-600 dark:text-amber-400",
            },`,
    );
}

// 6. Add materials to stock_items category tabs
if (!code.includes('"ingredients",\n                    "materials",')) {
    code = code.replace(
        '"ingredients",\n                    "ledger",',
        '"ingredients",\n                    "materials",\n                    "ledger",',
    );
}

// 7. Route category
if (!code.includes('pathname.includes("/inventory/materials")')) {
    code = code.replace(
        'if (pathname.includes("/inventory/transfers")) return "branch_supply";',
        'if (pathname.includes("/inventory/materials")) return "stock_items";\n        if (pathname.includes("/inventory/transfers")) return "branch_supply";',
    );
}

// 8. Render panel
if (
    !code.includes('{tab === "materials" ? <InventoryMaterialsPanel /> : null}')
) {
    code = code.replace(
        '{tab === "categories" ? <InventoryCategoriesPanel /> : null}',
        '{tab === "materials" ? <InventoryMaterialsPanel /> : null}\n            {tab === "categories" ? <InventoryCategoriesPanel /> : null}',
    );
}

// 9. Pagination exclude
if (!code.includes('tab !== "materials" &&')) {
    code = code.replace(
        'tab !== "categories" &&',
        'tab !== "materials" &&\n                tab !== "categories" &&',
    );
}

fs.writeFileSync(filePath, code, "utf8");
console.log(
    "Successfully patched InventoryBoard.tsx with Materials tab and panel",
);
