import chalk from "chalk";
import { Command } from "commander";
import decache from "decache";
import fs from "fs";
import path from "path";
import { initShopifyApi } from "../utils/init-shopify-api";
import { toSnakeCase } from "../utils/to-snake-case";
import { generateThemeLayout } from "./generate-theme-layout";
import { generateThemeSnippet } from "./generate-theme-snippets";
import { ShopifySection, ShopifySettings } from "types/shopify";
import { createMetafieldTypes } from "./create-metafield-types";
import { generateSectionsTypes, updateSectionsSettings, writeCompareFile } from "./generate-sections";
import { generateSettings } from "./generate-settings";
import { generateSchemaLocales } from "./generate-schema-locales";
import { generateThemeFiles } from "./generate-theme-files";
import { generateThemeSettings } from "./generate-theme-settings";

import { copyFiles } from "./init-copy-files";
import { initShopifyTypes } from "./init-shopify-types";
import { initThemeFolders } from "./init-theme-folders";

const watch = require("node-watch");

require("dotenv").config();

const program = new Command();

program.version(require(path.join("./../", "package.json")).version).parse(process.argv);

const { SHOPIFY_THEME_FOLDER } = process.env;

export const init = async () => {
  const root = process.cwd();
  const sectionsFolder = path.join(root, "sections");
  const globalsFolder = path.join(root, "globals");

  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(
      `Shopify CMS Started`
    )}`
  );
  initShopifyTypes();

  if (!SHOPIFY_THEME_FOLDER) return;

  initThemeFolders(SHOPIFY_THEME_FOLDER);

  const { api, gql } = initShopifyApi();

  await createMetafieldTypes(gql);

  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(`Checking Theme`)}`
  );

  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(
      `Watching for changes`
    )}`
  );

  if (fs.existsSync(sectionsFolder) && fs.existsSync(globalsFolder)) {
    watch([sectionsFolder, globalsFolder], { recursive: true }, async (evt, name) => {
      const startTime = Date.now();

      if (isSettingUpdate(name)) {
        Object.keys(require.cache).forEach((path) => {
          if (path.includes(sectionsFolder) || path.includes(globalsFolder)) {
            decache(path);
            delete require.cache[path];
          }
        });

        const sections = getSectionSchemas();
        const settings = getSettingsSchemas();

        const sectionLocaleCount = getLocaleCount(sections);

        generateSectionsTypes(sections);
        updateSectionsSettings(sections);
        generateSchemaLocales(sections, settings, SHOPIFY_THEME_FOLDER, sectionLocaleCount);
        generateSettings(settings.settingsSchema);
        generateThemeSettings(settings.settingsSchema, SHOPIFY_THEME_FOLDER);
        generateThemeFiles(SHOPIFY_THEME_FOLDER, sections, sectionLocaleCount);
        console.log(
          `[${chalk.gray(new Date().toLocaleTimeString())}]: [${chalk.magentaBright(
            `${Date.now() - startTime}ms`
          )}] ${chalk.cyan(`File modified: ${name.replace(process.cwd(), "")}`)}`
        );
      }

      if (isSection(name) || isSnippet(name) || isLayout(name)) {
        Object.keys(require.cache).forEach((path) => {
          if (path.includes(sectionsFolder) || path.includes(globalsFolder)) {
            decache(path);
            delete require.cache[path];
          }
        });
        const sections = getSectionSchemas();
        const sectionLocaleCount = getLocaleCount(sections);

        generateThemeFiles(SHOPIFY_THEME_FOLDER, sections, sectionLocaleCount);
      }

      if (isAsset(name)) {
        const assetName = name.split(/[\\/]/gi).at(-1);
        const assetPath = path.join(process.cwd(), SHOPIFY_THEME_FOLDER, "assets", assetName);

        const rawContent = fs.readFileSync(name, {
          encoding: "utf-8",
        });

        // writeCompareFile(assetPath, rawContent);

        if (!fs.existsSync(assetPath)) {
          fs.writeFileSync(assetPath, rawContent);
          console.log(
            `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.blueBright(
              `Created: ${assetPath.replace(process.cwd(), "")}`
            )}`
          );
          return;
        }
      }
    });

    console.log("init Trigger");

    Object.keys(require.cache).forEach((path) => {
      if (path.includes(sectionsFolder) || path.includes(globalsFolder)) {
        decache(path);
        delete require.cache[path];
      }
    });

    const sections = getSectionSchemas();
    const settings = getSettingsSchemas();
    const sectionLocaleCount = getLocaleCount(sections);
    generateSectionsTypes(sections);
    updateSectionsSettings(sections);
    generateSchemaLocales(sections, settings, SHOPIFY_THEME_FOLDER, sectionLocaleCount);
    generateSettings(settings.settingsSchema);
    generateThemeSettings(settings.settingsSchema, SHOPIFY_THEME_FOLDER);
    generateThemeFiles(SHOPIFY_THEME_FOLDER, sections, sectionLocaleCount);

    const { assets } = getSourcePaths();

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const assetName = asset.split(/[\\/]/gi).at(-1);
      const assetPath = path.join(process.cwd(), SHOPIFY_THEME_FOLDER, "assets", assetName);

      const rawContent = fs.readFileSync(asset, {
        encoding: "utf-8",
      });

      // writeCompareFile(assetPath, rawContent);
      if (!fs.existsSync(assetPath)) {
        fs.writeFileSync(assetPath, rawContent);
        console.log(
          `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.blueBright(
            `Created: ${assetPath.replace(process.cwd(), "")}`
          )}`
        );
        return;
      }
    }
  }
};

export function getLocaleCount(sections: { [p: string]: ShopifySection }) {
  const entries = {};

  Object.values(sections).forEach((section) => {
    const blocks = section.blocks?.filter((block) => block.type !== "@app") ?? [];
    section?.settings?.forEach((setting) => {
      if (setting.type === "paragraph" || setting.type === "header") {
        if (setting.content.split(" ").length > 4) {
          return;
        }
        const [key, value] = [toSnakeCase(setting.content), setting.content];
        if (entries[key]) {
          entries[key].push(value);
        } else {
          entries[key] = [value];
        }
        return;
      }

      if (setting?.id) {
        if (setting.type === "select" || setting.type === "radio") {
          setting.options.forEach((option, index) => {
            const [key, value] = [toSnakeCase(option.label), option.label];
            if (entries[key]) {
              entries[key].push(value);
            } else {
              entries[key] = [value];
            }
          });
        }
        if (setting.label) {
          const [key, value] = [toSnakeCase(setting.label), setting.label];
          if (entries[key]) {
            entries[key].push(value);
          } else {
            entries[key] = [value];
          }
        }

        if (setting.info) {
          if (setting.info.split(" ").length <= 4) {
            const [key, value] = [toSnakeCase(setting.info), setting.info];
            if (entries[key]) {
              entries[key].push(value);
            } else {
              entries[key] = [value];
            }
          }
        }
        if ("placeholder" in setting && typeof setting.placeholder === "string") {
          const [key, value] = [toSnakeCase(setting.placeholder), setting.placeholder];
          if (entries[key]) {
            entries[key].push(value);
          } else {
            entries[key] = [value];
          }
        }
      }
    });
    blocks.forEach((block) => {
      block?.settings?.forEach((setting) => {
        if (setting.type === "paragraph" || setting.type === "header") {
          if (setting.content.split(" ").length > 4) {
            return;
          }
          const [key, value] = [toSnakeCase(setting.content), setting.content];
          if (entries[key]) {
            entries[key].push(value);
          } else {
            entries[key] = [value];
          }
          return;
        }

        if (setting?.id) {
          if (setting.type === "select" || setting.type === "radio") {
            setting.options.forEach((option, index) => {
              const [key, value] = [toSnakeCase(option.label), option.label];
              if (entries[key]) {
                entries[key].push(value);
              } else {
                entries[key] = [value];
              }
            });
          }
          if (setting.label) {
            const [key, value] = [toSnakeCase(setting.label), setting.label];
            if (entries[key]) {
              entries[key].push(value);
            } else {
              entries[key] = [value];
            }
          }

          if (setting.info) {
            if (setting.info.split(" ").length <= 4) {
              const [key, value] = [toSnakeCase(setting.info), setting.info];
              if (entries[key]) {
                entries[key].push(value);
              } else {
                entries[key] = [value];
              }
            }
          }
          if ("placeholder" in setting && typeof setting.placeholder === "string") {
            const [key, value] = [toSnakeCase(setting.placeholder), setting.placeholder];
            if (entries[key]) {
              entries[key].push(value);
            } else {
              entries[key] = [value];
            }
          }
        }
      });
    });
  });

  return entries;
}

export const getSectionSchemas = () => {
  const allFiles = getAllFiles();

  const sections: { [T: string]: ShopifySection } = allFiles
    .filter((name) => {
      return /sections([\\/])[^\\/]*([\\/])[^\\/]*\.schema.ts$/gi.test(name);
    })
    .reduce(
      (acc, file, index, arr) => {
        try {
          const filename = path.join(process.cwd(), file);
          const data = require(filename);
          return { ...acc, ...data };
        } catch (err) {
          console.log(chalk.redBright(err.message));
          return acc;
        }
      },
      {} as { [T: string]: ShopifySection }
    );

  return sections;
};

export const getAllFiles = (basePath = "sections") => {
  return fs.readdirSync(path.join(process.cwd(), basePath)).reduce((files, file) => {
    const name = path.join(basePath, file);

    const isDirectory = fs.statSync(path.join(process.cwd(), name)).isDirectory();
    return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name];
  }, []);
};

export const getSettingsSchemas = () => {
  const filename = path.join(process.cwd(), "globals", "settings_schema.ts");
  return require(filename) as { settingsSchema: ShopifySettings };
};

export const getSourcePaths = () => {
  const sourceFiles = [...getAllFiles("sections"), ...getAllFiles("globals")];
  const snippets = [];
  const layouts = [];
  const sections = [];
  const assets = [];

  sourceFiles.forEach((filePath) => {
    if (isSnippet(filePath)) {
      snippets.push(filePath);
    }
    if (isLayout(filePath)) {
      layouts.push(filePath);
    }
    if (isSection(filePath)) {
      sections.push(filePath);
    }
    if (isAsset(filePath)) {
      assets.push(filePath);
    }
  });

  return { snippets, layouts, sections, assets };
};

export const generateLiquidFiles = (folder: string) => {
  const source = [...getAllFiles("sections"), ...getAllFiles("globals")];
  const target = getAllFiles(folder);

  for (let i = 0; i < source.length; i++) {
    if (isSnippet(source[i])) {
      console.log(source[i], "source[i]");
      const fileName = source[i].split(/[\\/]/gi).at(-1);
      const targetFile = target.find(
        (targetPath) =>
          targetPath.includes(`snippets\\${fileName}`) ||
          targetPath.includes(`snippets/${fileName}`)
      );

      if (!targetFile) {
        generateThemeSnippet(source[i], folder);
      }
    }
    if (isLayout(source[i])) {
      const fileName = source[i].split(/[\\/]/gi).at(-1);
      const targetFile = target.find(
        (targetPath) =>
          targetPath.includes(`layout\\${fileName}`) || targetPath.includes(`layout/${fileName}`)
      );

      if (!targetFile) {
        generateThemeLayout(source[i], folder);
      }
    }
  }

  if (process.env.SHOPIFY_CMS_DELETE) {
    for (let i = 0; i < target.length; i++) {
      if (
        /sections[\\/][^\\/]*\.liquid$/gi.test(target[i]) ||
        /snippets[\\/][^\\/]*\.liquid$/gi.test(target[i])
      ) {
        const fileName = target[i].split(/[\\/]/gi).at(-1);
        const targetFile = source.find((sourcePath) =>
          sourcePath.split(/[\\/]/gi).at(-1).includes(fileName)
        );
        if (!targetFile) {
          console.log(
            `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.redBright(
              `Deleted: ${target[i]}`
            )}`
          );
          fs.unlinkSync(path.join(process.cwd(), target[i]));
        }
      }
      if (/layout[\\/][^\\/]*\.liquid$/gi.test(target[i])) {
        const fileName = target[i].split(/[\\/]/gi).at(-1);
        const targetFile = source.find(
          (sourcePath) =>
            sourcePath.includes(`layout\\${fileName}`) || sourcePath.includes(`layout/${fileName}`)
        );
        if (!targetFile) {
          console.log(
            `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.redBright(
              `Deleted: ${target[i]}`
            )}`
          );
          fs.unlinkSync(path.join(process.cwd(), target[i]));
        }
      }
    }
  }
};

export const isSettingUpdate = (name) =>
  /sections[\\/][^\\/]*\\[^\\/]*\.schema.ts$/gi.test(name) ||
  /globals\\settings_schema\.ts$/gi.test(name) ||
  /globals\\settings[\\/][^\\/]*\.ts$/gi.test(name);

export const isSection = (name) => /sections[\\/][^\\/]*[\\/][^.]*\.liquid$/gi.test(name);

export const isAsset = (name) => /globals[\\/]assets[\\/][^\\/]*$/gi.test(name);

export const isSnippet = (name) =>
  /sections[\\/][^\\/]*[\\/][^.]*\.[^.]*\.liquid$/gi.test(name) ||
  /globals[\\/]snippets[\\/][^\\/]*\.liquid$/gi.test(name);

export const isLayout = (name) => /globals[\\/]layout[\\/][^\\/]*\.liquid$/gi.test(name);
