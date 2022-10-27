import fs from "fs";
import path from "path";
import { toSnakeCase } from "../utils/to-snake-case";
import { ShopifySection } from "../@types/shopify";
import { toKebabCase } from "./to-kebab-case";

export const sectionToLiquid_WithLocalization = ({ name, ...section }, key) => {
  const sectionName = toSnakeCase(name);

  let paragraphCount = 1;
  let headerCount = 1;

  const localizedSection = {
    name: `t:sections.${sectionName}.name`,
    ...section,
    settings: section?.settings?.map((setting) => {
      const settingsBase = `t:sections.${sectionName}.settings`;
      if (setting.type === "paragraph") {
        return {
          ...setting,
          content:
            "content" in setting
              ? `${settingsBase}.paragraph__${paragraphCount++}.content`
              : undefined,
        };
      }
      if (setting.type === "header") {
        return {
          ...setting,
          content:
            "content" in setting ? `${settingsBase}.header__${headerCount++}.content` : undefined,
        };
      }
      return {
        ...setting,
        label: "label" in setting ? `${settingsBase}.${setting.id}.label` : undefined,
        info: "info" in setting ? `${settingsBase}.${setting.id}.info` : undefined,
        placeholder:
          "placeholder" in setting ? `${settingsBase}.${setting.id}.placeholder` : undefined,
        options:
          "options" in setting
            ? setting.options.map((option, index) => ({
                ...option,
                label: `${settingsBase}.${setting.id}.options__${index + 1}.label`,
              }))
            : undefined,
      };
    }),
    blocks: section.blocks?.map(({ name, ...block }) => {
      let paragraphCount = 1;
      let headerCount = 1;

      if (block.type === "@app") return { name, ...block };

      return {
        name: `t:sections.${sectionName}.blocks.${block.id}.name`,
        ...block,
        settings: block?.settings?.map((setting) => {
          const settingsBase = `t:sections.${sectionName}.blocks.${block.id}.settings`;

          if (setting.type === "paragraph") {
            return {
              ...setting,
              content:
                "content" in setting
                  ? `${settingsBase}.paragraph__${paragraphCount++}.content`
                  : undefined,
            };
          }
          if (setting.type === "header") {
            return {
              ...setting,
              content:
                "content" in setting
                  ? `${settingsBase}.header__${headerCount++}.content`
                  : undefined,
            };
          }
          return {
            ...setting,
            label: "label" in setting ? `${settingsBase}.${setting.id}.label` : undefined,
            info: "info" in setting ? `${settingsBase}.${setting.id}.info` : undefined,
            placeholder:
              "placeholder" in setting ? `${settingsBase}.${setting.id}.placeholder` : undefined,
            options:
              "options" in setting
                ? setting.options.map((option, index) => ({
                    ...option,
                    label: `${settingsBase}.${setting.id}.options__${index + 1}.label`,
                  }))
                : undefined,
          };
        }),
      };
    }),
    presets: section.presets?.map(({ name, ...preset }) => {
      return {
        name: `t:sections.${sectionName}.presets.${toSnakeCase(name)}.name`,
        ...preset,
      };
    }),
  };

  return `
{% render "section_${toKebabCase(key)}" %}
  
{% schema %}
${JSON.stringify(localizedSection, undefined, 2)}
{% endschema %} 
`;
};

export const generateThemeSections = (sections: { [p: string]: ShopifySection }, folder) => {
  for (const key in sections) {
    const section = sections[key];
    const snippetName = `section_${toKebabCase(key)}.liquid`;
    const sectionName = `${toKebabCase(key)}.liquid`;
    const content = sectionToLiquid_WithLocalization(section, key);

    if (!fs.existsSync(path.join(process.cwd(), folder, "snippets", snippetName))) {
      fs.writeFileSync(path.join(process.cwd(), folder, "snippets", snippetName), `<div></div>`);
    }

    if (!fs.existsSync(path.join(process.cwd(), folder, "sections", sectionName))) {
      fs.writeFileSync(path.join(process.cwd(), folder, "sections", sectionName), content);
    }

    const contentVerification = fs.readFileSync(
      path.join(process.cwd(), folder, "sections", sectionName),
      { encoding: "utf-8" }
    );

    if (contentVerification !== content) {
      fs.writeFileSync(path.join(process.cwd(), folder, "sections", sectionName), content);
    }
  }
};
