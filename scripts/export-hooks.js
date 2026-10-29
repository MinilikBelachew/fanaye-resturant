const fs = require("fs");
const filePath =
    "c:/Users/Mekdim/Desktop/resturant/fanaye-resturant/src/context/services/inventoryApi.ts";
let code = fs.readFileSync(filePath, "utf8");

const hooks = `    useListInventoryMaterialsQuery,
    useCreateInventoryMaterialMutation,
    useUpdateInventoryMaterialMutation,
    useDeleteInventoryMaterialMutation,
    useUpsertMaterialBalanceMutation,
`;

if (!code.includes("useListInventoryMaterialsQuery")) {
    code = code.replace(
        /useMarkDriverArrivedMutation,?\r?\n\}\s*=\s*inventoryApi;/,
        "useMarkDriverArrivedMutation,\r\n" + hooks + "} = inventoryApi;",
    );
    fs.writeFileSync(filePath, code, "utf8");
    console.log("Successfully added hooks to inventoryApi.ts");
} else {
    console.log("Already present");
}
