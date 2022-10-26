import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { createMetafieldTypes } from "./utils/create-metafield-types";
import { ShopifySection, ShopifySettings } from "./@types/shopify";
import { generateSections } from "./utils/generate-sections";
import { generateSettings } from "./utils/generate-settings";
import { copyFiles } from "./utils/init-copy-files";
import { initFolders } from "./utils/init-folders";

const watch = require("node-watch");

require("dotenv").config();

const program = new Command();

program.version(require("./package.json").version).parse(process.argv);

const { SHOPIFY_SETTINGS_FOLDER, SHOPIFY_THEME_FOLDER } = process.env;

export const init = async () => {
  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(
      `Shopify CMS Started`
    )}`
  );
  initFolders();
  createMetafieldTypes();
  copyFiles();

  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(`Checking Theme`)}`
  );

  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(`Theme Checked`)}`
  );

  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(`Metafields Checked`)}`
  );

  if (!SHOPIFY_SETTINGS_FOLDER) return;

  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(
      `Watching for changes in /${SHOPIFY_SETTINGS_FOLDER}/`
    )}`
  );

  if (fs.existsSync(path.join(process.cwd(), SHOPIFY_SETTINGS_FOLDER))) {
    watch(
      path.join(process.cwd(), SHOPIFY_SETTINGS_FOLDER),
      { recursive: true },
      async (evt, name) => {
        if (!name.match(/\.(ts|tsx)$/)) return;
        if (name.match(/^index\.ts.$/)) return;
        if (name.match(/^_/)) return;

        const files = fs.readdirSync(path.join(process.cwd(), SHOPIFY_SETTINGS_FOLDER));
        const startTime = Date.now();

        console.log(
          `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.cyan(
            `File modified: ${name}`
          )}`
        );

        const sections: { [T: string]: ShopifySection } = files
          .filter((name) => {
            if (!name.match(/\.(ts|tsx)$/)) return false;
            if (name.match(/^index\.ts.$/)) return false;
            if (name.match(/^_/)) return false;
            if (name.match("settings_schema")) return false;
            const isDirectory = fs
              .statSync(path.join(process.cwd(), SHOPIFY_SETTINGS_FOLDER, name))
              .isDirectory();
            if (isDirectory) return false;
            return true;
          })
          .reduce(
            (acc, file) => {
              try {
                const filename = path.join(process.cwd(), SHOPIFY_SETTINGS_FOLDER, file);
                const data = require(filename);
                delete require.cache[filename];
                return { ...acc, ...data };
              } catch (err) {
                console.log(chalk.redBright(err.message));
                return acc;
              }
            },
            {} as { [T: string]: ShopifySection }
          );

        await generateSections(sections);

        const settingsFilename = files.find((name) => name.match("settings_schema"));

        if (settingsFilename) {
          try {
            const filename = path.join(process.cwd(), SHOPIFY_SETTINGS_FOLDER, settingsFilename);
            const settings = require(filename);
            delete require.cache[filename];
            await generateSettings(Object.values(settings)[0] as ShopifySettings);
          } catch (err) {
            console.log(chalk.redBright(err.message));
          }
        }

        console.log(
          `[${chalk.gray(new Date().toLocaleTimeString())}]: [${chalk.magentaBright(
            `${Date.now() - startTime}ms`
          )}] ${chalk.cyan(`File modified: ${name}`)}`
        );
      }
    );
  }
};
