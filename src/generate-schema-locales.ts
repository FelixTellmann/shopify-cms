import chalk from "chalk";
import fs from "fs";
import produce from "immer";
import path from "path";
import { writeCompareFile } from "./generate-sections";
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
            placeholder: setting?.placeholder,
            ...options,
          };
          return;
        }
        current[setting.id] = {
          label: setting?.label,
          info: setting?.info,
          placeholder: setting?.placeholder,
        };
      }
    });
  });
  return settingsLocale;
};

export const generateSectionSettings = (
  settings,
  sectionLocaleCount: { [T: string]: string[] }
) => {
  if (!settings) return undefined;
  let settingsLocale = {};
  let paragraphCount = 1;
  let headerCount = 1;

  settings?.forEach((setting) => {
    settingsLocale = produce(settingsLocale, (current) => {
      if (setting.type === "paragraph") {
        const key = toSnakeCase(setting.content);
        if (sectionLocaleCount[key]?.length > 1) {
          return;
        }
        current[`paragraph__${paragraphCount++}`] = {
          content: setting?.content,
        };
        return;
      }
      if (setting.type === "header") {
        const key = toSnakeCase(setting.content);
        if (sectionLocaleCount[key]?.length > 1) {
          return;
        }
        current[`header__${headerCount++}`] = {
          content: setting?.content,
        };
        return;
      }

      if (setting?.id) {
        if (setting.type === "select" || setting.type === "radio") {
          const options = setting.options.reduce(
            (acc, option, index) => {
              const key = toSnakeCase(option.label);
              if (sectionLocaleCount[key]?.length > 1) {
                return acc;
              }
              acc[`options__${index + 1}`] = {
                label: option.label,
              };
              return acc;
            },
            // @ts-ignore
            {}
          );

          current[setting.id] = {
            label:
              sectionLocaleCount[toSnakeCase(setting?.label)]?.length > 1
                ? undefined
                : setting?.label,
            info:
              sectionLocaleCount[toSnakeCase(setting?.info)]?.length > 1
                ? undefined
                : setting?.info,
            placeholder:
              sectionLocaleCount[toSnakeCase(setting?.placeholder)]?.length > 1
                ? undefined
                : setting?.placeholder,
            ...options,
          };
          return;
        }
        current[setting.id] = {
          label:
            sectionLocaleCount[toSnakeCase(setting?.label)]?.length > 1
              ? undefined
              : setting?.label,
          info:
            sectionLocaleCount[toSnakeCase(setting?.info)]?.length > 1 ? undefined : setting?.info,
          placeholder:
            sectionLocaleCount[toSnakeCase(setting?.placeholder)]?.length > 1
              ? undefined
              : setting?.placeholder,
        };
      }
    });
  });
  return settingsLocale;
};

export const generateSchemaLocales = (
  sections: { [T: string]: ShopifySection },
  settings: { settingsSchema: ShopifySettings },
  folder: string,
  sectionLocaleCount: { [T: string]: string[] }
) => {
  let returnObject = {
    settings_schema: {},
    sections: {
      all: {},
    },
  };

  returnObject = produce(returnObject, (current) => {
    Object.entries(sectionLocaleCount).forEach(([key, value]) => {
      if (value.length > 1) {
        current.sections["all"][key] = value[0];
      }
    });
  });

  Object.values(sections).forEach((section) => {
    returnObject = produce(returnObject, (current) => {
      const blocks = section.blocks?.filter((block) => block.type !== "@app") ?? [];

      current.sections[toSnakeCase(section.name)] = {
        name: section.name,
        settings: generateSectionSettings(section.settings, sectionLocaleCount),
        blocks: blocks.length
          ? blocks?.reduce(
              (acc, block) => {
                acc[toSnakeCase(block.name)] = {
                  name: block.name,
                  settings: generateSectionSettings(block.settings, sectionLocaleCount),
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

  const schemaPath = path.join(process.cwd(), folder, "locales", "en.default.schema.json");

  writeCompareFile(schemaPath, JSON.stringify(returnObject, null, 2));
};
