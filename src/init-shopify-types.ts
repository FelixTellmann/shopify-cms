import chalk from "chalk";
import fs from "fs";
import path from "path";
import { writeCompareFile } from "./generate-sections";
import { PROJECT_ROOT } from "./project-root";

export const initShopifyTypes = () => {
  /*= =============== Root Folder ================ */
  if (!fs.existsSync(path.join(process.cwd(), "@types"))) {
    fs.mkdirSync(path.join(process.cwd(), "@types"));
  }

  const shopifyPath = path.join(process.cwd(), "@types", "shopify.ts");
  const shopifyTypesContent = fs.readFileSync(path.join(PROJECT_ROOT, "@types", "shopify.ts"), {
    encoding: "utf-8",
  });

  const shopifySettingsPath = path.join(process.cwd(), "@types", "settings.ts");
  const shopifySettingsTypesContent = fs.readFileSync(
    path.join(PROJECT_ROOT, "@types", "settings.ts"),
    {
      encoding: "utf-8",
    }
  );

  if (!fs.existsSync(shopifySettingsPath)) {
    fs.writeFileSync(shopifySettingsPath, shopifySettingsTypesContent);
  }

  writeCompareFile(shopifyPath, shopifyTypesContent);
};
