import chalk from "chalk";
import fs from "fs";
import produce from "immer";
import path from "path";
import { ShopifySection, ShopifySettings } from "types/shopify";
import { toSnakeCase } from "./../utils/to-snake-case";

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

export const generateSchemaLocales = (
  sections: { [T: string]: ShopifySection },
  settings: { settingsSchema: ShopifySettings },
  folder: string
) => {
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
          ? blocks?.reduce((acc, block) => {
              acc[toSnakeCase(block.name)] = {
                name: block.name,
                settings: generateSettings(block.settings),
              };
              return acc;
            }, {})
          : undefined,
        presets: section.presets?.reduce((acc, preset) => {
          acc[toSnakeCase(preset.name)] = {
            name: preset.name,
          };
          return acc;
        }, {}),
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
