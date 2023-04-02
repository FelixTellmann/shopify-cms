import { ShopifySection } from "types/shopify";
import { toSnakeCase } from "./../utils/to-snake-case";

export const sectionToLiquid_WithLocalization = (
  { name, disabled_block_files, generate_block_files, ...section }: ShopifySection,
  key,
  sectionLocaleCount: { [T: string]: string[] }
) => {
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
              ? sectionLocaleCount[toSnakeCase(setting.content)]?.length > 1
                ? `t:sections.all.${toSnakeCase(setting.content)}`
                : `${settingsBase}.paragraph__${paragraphCount++}.content`
              : undefined,
        };
      }
      if (setting.type === "header") {
        return {
          ...setting,
          content:
            "content" in setting
              ? sectionLocaleCount[toSnakeCase(setting.content)]?.length > 1
                ? `t:sections.all.${toSnakeCase(setting.content)}`
                : `${settingsBase}.header__${headerCount++}.content`
              : undefined,
        };
      }
      return {
        ...setting,
        label:
          "label" in setting
            ? sectionLocaleCount[toSnakeCase(setting.label)]?.length > 1
              ? `t:sections.all.${toSnakeCase(setting.label)}`
              : `${settingsBase}.${setting.id}.label`
            : undefined,
        info:
          "info" in setting
            ? sectionLocaleCount[toSnakeCase(setting.info)]?.length > 1
              ? `t:sections.all.${toSnakeCase(setting.info)}`
              : `${settingsBase}.${setting.id}.info`
            : undefined,
        placeholder:
          "placeholder" in setting && typeof setting.placeholder === "string"
            ? sectionLocaleCount[toSnakeCase(setting.placeholder)]?.length > 1
              ? `t:sections.all.${toSnakeCase(setting.placeholder)}`
              : `${settingsBase}.${setting.id}.placeholder`
            : undefined,
        options:
          "options" in setting
            ? setting.options.map((option, index) => ({
                ...option,
                label:
                  sectionLocaleCount[toSnakeCase(option.label)]?.length > 1
                    ? `t:sections.all.${toSnakeCase(option.label)}`
                    : `${settingsBase}.${setting.id}.options__${index + 1}.label`,
              }))
            : undefined,
      };
    }),
    blocks: section.blocks?.map(({ name, ...block }) => {
      let paragraphCount = 1;
      let headerCount = 1;

      if (block.type === "@app") return { name, ...block };

      return {
        name: `t:sections.${sectionName}.blocks.${toSnakeCase(name)}.name`,
        ...block,
        settings: block?.settings?.map((setting) => {
          const settingsBase = `t:sections.${sectionName}.blocks.${toSnakeCase(name)}.settings`;

          if (setting.type === "paragraph") {
            return {
              ...setting,
              content:
                "content" in setting
                  ? sectionLocaleCount[toSnakeCase(setting.content)]?.length > 1
                    ? `t:sections.all.${toSnakeCase(setting.content)}`
                    : `${settingsBase}.paragraph__${paragraphCount++}.content`
                  : undefined,
            };
          }
          if (setting.type === "header") {
            return {
              ...setting,
              content:
                "content" in setting
                  ? sectionLocaleCount[toSnakeCase(setting.content)]?.length > 1
                    ? `t:sections.all.${toSnakeCase(setting.content)}`
                    : `${settingsBase}.header__${headerCount++}.content`
                  : undefined,
            };
          }
          return {
            ...setting,
            label:
              "label" in setting
                ? sectionLocaleCount[toSnakeCase(setting.label)]?.length > 1
                  ? `t:sections.all.${toSnakeCase(setting.label)}`
                  : `${settingsBase}.${setting.id}.label`
                : undefined,
            info:
              "info" in setting
                ? sectionLocaleCount[toSnakeCase(setting.info)]?.length > 1
                  ? `t:sections.all.${toSnakeCase(setting.info)}`
                  : `${settingsBase}.${setting.id}.info`
                : undefined,
            placeholder:
              "placeholder" in setting && typeof setting.placeholder === "string"
                ? sectionLocaleCount[toSnakeCase(setting.placeholder)]?.length > 1
                  ? `t:sections.all.${toSnakeCase(setting.placeholder)}`
                  : `${settingsBase}.${setting.id}.placeholder`
                : undefined,
            options:
              "options" in setting
                ? setting.options.map((option, index) => ({
                    ...option,
                    label:
                      sectionLocaleCount[toSnakeCase(option.label)]?.length > 1
                        ? `t:sections.all.${toSnakeCase(option.label)}`
                        : `${settingsBase}.${setting.id}.options__${index + 1}.label`,
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

  return `{% schema %}
${JSON.stringify(localizedSection, undefined, 2)}
{% endschema %}
`;
};
