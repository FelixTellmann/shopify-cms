import chalk from "chalk";
import fs from "fs";
import path from "path";
import { sectionToLiquid_WithLocalization } from "src/section-to-liquid-with-localization";
import { getAllFiles } from "./index";
import { writeCompareFile } from "./generate-sections";
import { toSnakeCase } from "./../utils/to-snake-case";
import { ShopifySection } from "types/shopify";
import { toKebabCase } from "./../utils/to-kebab-case";

export const generateThemeSnippet = (snippetPath, folder: string) => {
  const targetPath = path.join(
    process.cwd(),
    folder,
    "snippets",
    snippetPath.split(/[\\/]/gi).at(-1)
  );
  const snippetContent = fs.readFileSync(snippetPath, {
    encoding: "utf-8",
  });

  writeCompareFile(targetPath, snippetContent);
};
