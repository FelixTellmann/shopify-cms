import chalk from "chalk";
import fs from "fs";
import path from "path";
import { sectionToLiquid_WithLocalization } from "src/section-to-liquid-with-localization";
import { getAllFiles } from "./index";
import { writeCompareFile } from "./generate-sections";
import { toSnakeCase } from "./../utils/to-snake-case";
import { ShopifySection } from "types/shopify";
import { toKebabCase } from "./../utils/to-kebab-case";

export const generateThemeLayout = (layoutPath, folder: string) => {
  const sectionSnippets = getAllFiles("sections");
  const globalSnippets = getAllFiles(path.join("globals", "snippets"));
  /*sectionSnippets
    .filter((name) => /sections[\\/][^\\/]*[\\/][^.]*\.[^.]*\.liquid$/gi.test(name))
    .forEach((snippet) => {});*/

  const targetPath = path.join(process.cwd(), folder, "layout", layoutPath.split(/[\\/]/gi).at(-1));
  const layoutContent = fs.readFileSync(layoutPath, {
    encoding: "utf-8",
  });

  writeCompareFile(targetPath, layoutContent);
};
