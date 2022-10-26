import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { generateSections } from "./utils/generate-sections";
import { getSections } from "./utils/get-sections";
import { getSettings } from "./utils/get-settings";
import { generateSettings } from "./utils/generate-settings";
import { createMetafieldTypes } from "./utils/create-metafield-types";
import { ShopifySection, ShopifySettings } from "./@types/shopify";
import { initBackup } from "./utils/init-backup";
import { initConfig } from "./utils/init-config";
import { copyFiles } from "./utils/init-copy-files";
import { initFolders } from "./utils/init-folders";
import { initShopifyApi } from "./utils/init-shopify-api";
import { initTheme } from "./utils/init-theme";
import { updateTheme } from "./utils/updateTheme";

const watch = require("node-watch");

require("dotenv").config();

const program = new Command();

program
  .version(require("./package.json").version)
  .option("-b, --backup", "Create a backup of all shopify template & config files")
  .option("-c, --config", "Configure your theme")
  .option("-d, --download", "Download settings")
  .option("-t, --types", "Create types only")
  .parse(process.argv);

const { SHOPIFY_SETTINGS_FOLDER, SHOPIFY_THEME_FOLDER } = process.env;

export const init = async () => {
  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(
      `Shopify CMS Started`
    )}`
  );
  initFolders();

  const config = await initConfig(!!program.opts().config);
  copyFiles(config);

  const { gql } = initShopifyApi();
  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(`Checking Theme`)}`
  );

  console.log(
    `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.magentaBright(`Theme Checked`)}`
  );

  await createMetafieldTypes(gql);
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
          const filename = path.join(process.cwd(), SHOPIFY_SETTINGS_FOLDER, settingsFilename);
          const settings = require(filename);
          delete require.cache[filename];

          await generateSettings(Object.values(settings)[0] as ShopifySettings);
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
