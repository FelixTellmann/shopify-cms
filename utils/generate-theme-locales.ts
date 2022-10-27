import chalk from "chalk";
import fs from "fs";
import produce from "immer";
import path from "path";
import { ShopifySection, ShopifySettings } from "types/shopify";
import { toSnakeCase } from "../utils/to-snake-case";

const generateSettings = (settings) => {
  if (!settings) return undefined;
  let settingsLocale = {};
  let paragraphCount = 1;
  let headerCount = 1;
  settings?.forEach((setting) => {
    settingsLocale = produce(settingsLocale, (current) => {
      if (setting.type === "paragraph") {
        current[`paragraph__${paragraphCount++}`] = {
          content: setting?.content,
        };
        return;
      }
      if (setting.type === "header") {
        current[`header__${headerCount++}`] = {
          content: setting?.content,
        };
        return;
      }

      if (setting?.id) {
        if (setting.type === "select" || setting.type === "radio") {
          const options = setting.options.reduce(
            (acc, option, index) => {
              acc[`options__${index + 1}`] = {
                label: option.label,
              };
              return acc;
            },
            // @ts-ignore
            {}
          );

          current[setting.id] = {
            label: setting?.label,
            info: setting?.info,
            placeholder: settings?.placeholder,
            ...options,
          };
          return;
        }
        current[setting.id] = {
          label: setting?.label,
          info: setting?.info,
          placeholder: settings?.placeholder,
        };
      }
    });
  });
  return settingsLocale;
};

export const generateThemeLocales = (settingsFolder, folder) => {
  const files = fs.readdirSync(path.join(process.cwd(), settingsFolder));

  const sectionFiles = files.filter((name) => {
    if (!name.match(/\.(ts|tsx)$/)) return false;
    if (name.match(/^index\.ts.$/)) return false;
    if (name.match(/^_/)) return false;
    if (name.match("settings_schema")) return false;
    const isDirectory = fs.statSync(path.join(process.cwd(), settingsFolder, name)).isDirectory();
    if (isDirectory) return false;
    return true;
  });

  const sections: { [T: string]: ShopifySection } = sectionFiles.reduce(
    (acc, file) => {
      try {
        const fileName = path.join(process.cwd(), settingsFolder, file);

        const data = require(fileName);
        delete require.cache[fileName];
        return { ...acc, ...data };
      } catch (err) {
        console.log(chalk.redBright(err.message));
        return acc;
      }
    },
    {} as { [T: string]: ShopifySection }
  );

  const settingsFilename = files.find((name) => name.match("settings_schema"));
  let settings: { settingsSchema: ShopifySettings };

  try {
    const fileName = path.join(process.cwd(), settingsFolder, settingsFilename);
    settings = require(fileName);
    delete require.cache[fileName];
  } catch (err) {
    console.log(chalk.redBright(err.message));
  }

  let returnObject = {
    settings_schema: {},
    sections: {},
  };

  Object.values(sections).forEach((section) => {
    returnObject = produce(returnObject, (current) => {
      const blocks = section.blocks?.filter((block) => block.type !== "@app") ?? [];

      current.sections[toSnakeCase(section.name)] = {
        name: section.name,
        settings: generateSettings(section.settings),
        blocks: blocks.length
          ? blocks?.reduce(
              (acc, block) => {
                acc[block.type] = {
                  name: block.name,
                  settings: generateSettings(block.settings),
                };
                return acc;
              },
              {}
            )
          : undefined,
        presets: section.presets?.reduce(
          (acc, preset) => {
            acc[toSnakeCase(preset.name)] = {
              name: preset.name,
            };
            return acc;
          },
          {}
        ),
      };
    });
  });

  settings?.settingsSchema.forEach((settingsBlock) => {
    if ("theme_author" in settingsBlock) return;

    returnObject = produce(returnObject, (current) => {
      current.settings_schema[toSnakeCase(settingsBlock.name)] = {
        name: settingsBlock.name,
        settings: generateSettings(settingsBlock.settings),
      };
    });
  });

  fs.writeFileSync(
    path.join(process.cwd(), folder, "locales", "en.default.schema.json"),
    JSON.stringify(returnObject, null, 2)
  );
};
