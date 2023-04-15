import chalk from "chalk";
import fs from "fs";
import path from "path";
import { sectionToLiquid_WithLocalization } from "src/section-to-liquid-with-localization";
import { toPascalCase } from "../utils/to-pascal-case";
import { ShopifySection, ShopifySettingsInput } from "types/shopify";
import { capitalize } from "./../utils/capitalize";
import { toKebabCase } from "./../utils/to-kebab-case";

export const sectionToLiquid = ({ disabled_block_files, ...section }, key) => {
  return `
${process.env.SHOPIFY_SECTIONS_BEFORE_RENDER}
{% render "s.${toKebabCase(key)}" %}
${process.env.SHOPIFY_SECTIONS_AFTER_RENDER}
{% schema %}
${JSON.stringify(section, undefined, 2)}
{% endschema %} 
`;
};

export const getSettingsType = (setting: ShopifySettingsInput) => {
  switch (setting.type) {
    case "article":
      return "?: _Article_liquid | string";
    case "checkbox":
      return ": boolean";
    case "number":
      return "?: number";
    case "radio":
      return `: ${setting.options.map(({ value }) => `"${value}"`).join(" | ")}`;
    case "range":
      return ": number";
    case "select":
      return `: ${setting.options.map(({ value }) => `"${value}"`).join(" | ")}`;
    case "text":
      return "?: string";
    case "textarea":
      return "?: string";
    case "blog":
      return "?: _Blog_liquid | string";
    case "collection":
      return "?: _Collection_liquid | string";
    case "collection_list":
      return "?: _Collection_liquid[]";
    case "color":
      return "?: _Color_liquid";
    case "color_background":
      return "?: string";
    case "font_picker":
      return ": _Font_liquid | _Font_options";
    case "html":
      return "?: string";
    case "image_picker":
      return "?: _Image_liquid";
    case "link_list":
      return "?: _Linklist_liquid";
    case "liquid":
      return "?: string";
    case "page":
      return "?: _Page_liquid | string";
    case "product":
      return "?: _Product_liquid | string";
    case "product_list":
      return "?: _Product_liquid[]";
    case "richtext":
      return "?: `<${_BlockTag}${string}</${_BlockTag}>`";
    case "inline_richtext":
      return "?: string";
    case "url":
      return "?: string";
    case "video_url":
      return "?:  `${string}youtube${string}` | `${string}vimeo${string}`";
    case "font":
      return "?: string";
  }
};

export const getImports = (sections: { [T: string]: ShopifySection }) => {
  const localTypes = [];

  const analyseSetting = (setting) => {
    if (setting.type === "richtext") {
      if (localTypes.includes("_BlockTag")) return;
      localTypes.push("_BlockTag");
    }
    if (setting.type === "article") {
      if (localTypes.includes("_Article_liquid")) return;
      localTypes.push("_Article_liquid");
    }
    if (setting.type === "blog") {
      if (localTypes.includes("_Blog_liquid")) return;
      localTypes.push("_Blog_liquid");
    }
    if (setting.type === "collection") {
      if (localTypes.includes("_Collection_liquid")) return;
      localTypes.push("_Collection_liquid");
    }
    if (setting.type === "collection_list") {
      if (localTypes.includes("_Collection_liquid")) return;
      localTypes.push("_Collection_liquid");
    }
    if (setting.type === "color") {
      if (localTypes.includes("_Color_liquid")) return;
      localTypes.push("_Color_liquid");
    }
    if (setting.type === "image_picker") {
      if (localTypes.includes("_Image_liquid")) return;
      localTypes.push("_Image_liquid");
    }
    if (setting.type === "font_picker") {
      if (localTypes.includes("_Font_liquid")) return;
      localTypes.push("_Font_liquid");
    }
    if (setting.type === "font_picker") {
      if (localTypes.includes("_Font_options")) return;
      localTypes.push("_Font_options");
    }
    if (setting.type === "link_list") {
      if (localTypes.includes("_Linklist_liquid")) return;
      localTypes.push("_Linklist_liquid");
    }
    if (setting.type === "page") {
      if (localTypes.includes("_Page_liquid")) return;
      localTypes.push("_Page_liquid");
    }
    if (setting.type === "product") {
      if (localTypes.includes("_Product_liquid")) return;
      localTypes.push("_Product_liquid");
    }
    if (setting.type === "product_list") {
      if (localTypes.includes("_Product_liquid")) return;
      localTypes.push("_Product_liquid");
    }
  };

  for (const key in sections) {
    const section = sections[key];

    section.settings?.forEach(analyseSetting, localTypes);
    section.blocks?.forEach((block) => {
      block?.settings?.forEach(analyseSetting, localTypes);
    });
  }

  if (localTypes.length) {
    return `import { ${localTypes.join(", ")} } from "./shopify";\n\n`;
  }
  return ``;
};

export const sectionToTypes = (section, key) => {
  const filename = toKebabCase(section.name);
  const arr = [];
  const settings: ShopifySettingsInput[] = section.settings
    ?.filter((s) => s.type !== "header" && s.type !== "paragraph")
    .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));

  arr.push(`export type ${capitalize(key)}Section = {`);
  if (section.blocks?.length) {
    arr.push(`  blocks: ${capitalize(key)}Blocks[];`);
  }
  arr.push(`  global: boolean;`);
  arr.push(`  id: string;`);
  if (settings?.length) {
    arr.push(`  settings: {`);
    arr.push(
      settings
        .map(
          (setting) =>
            `    /** Input type: ${setting.type} */\n    ` +
            `${/[^\w_]/gi.test(setting.id) ? `"${setting.id}"` : `${setting.id}`}${getSettingsType(
              setting
            )};`
        )
        .sort((a, b) => {
          const aX = a.split("\n")[1];
          const bX = b.split("\n")[1];
          if (aX.includes("?") && !bX.includes("?")) {
            return 1;
          } else if (!aX.includes("?") && bX.includes("?")) {
            return -1;
          } else if (aX > bX) {
            return 1;
          } else if (aX < bX) {
            return -1;
          } else {
            return 0;
          }
        })
        .join("\n")
    );
    arr.push(`  };`);
  }
  arr.push(`  type: "${filename}";`);
  arr.push(`};`);

  if (section.blocks?.length) {
    section.blocks?.forEach((block) => {
      const blockSettings: ShopifySettingsInput[] = block?.settings
        ?.filter((s) => s.type !== "header" && s.type !== "paragraph")
        .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));

      arr.push("");
      arr.push(
        `export type ${capitalize(key)}Blocks${toPascalCase(block.type.replace("@", ""))} = {`
      );
      arr.push("  id: string;");

      if (blockSettings?.length) {
        arr.push(`  settings: {`);
        arr.push(
          blockSettings
            .map(
              (setting) =>
                `    /** Input type: ${setting.type} */\n    ` +
                `${
                  /[^\w_]/gi.test(setting.id) ? `"${setting.id}"` : `${setting.id}`
                }${getSettingsType(setting)};`
            )
            .sort((a, b) => {
              const aX = a.split("\n")[1];
              const bX = b.split("\n")[1];
              if (aX.includes("?") && !bX.includes("?")) {
                return 1;
              } else if (!aX.includes("?") && bX.includes("?")) {
                return -1;
              } else if (aX > bX) {
                return 1;
              } else if (aX < bX) {
                return -1;
              } else {
                return 0;
              }
            })
            .join("\n")
        );
        arr.push(`  };`);
      }

      arr.push(`  type: "${block.type}";`);
      arr.push(`};`);
    });
  }

  if (section.blocks?.length && section.blocks?.length === 1) {
    arr.push("");
    arr.push(
      `export type ${capitalize(key)}Blocks = ${capitalize(key)}Blocks${toPascalCase(
        section.blocks[0].type.replace("@", "")
      )};`
    );
  }

  if (section.blocks?.length && section.blocks?.length > 1) {
    arr.push("");
    arr.push(`export type ${capitalize(key)}Blocks =`);

    section.blocks?.forEach((block, i) => {
      if (section.blocks?.length - 1 === i) {
        arr.push(`  | ${capitalize(key)}Blocks${toPascalCase(block.type.replace("@", ""))};`);
      } else {
        arr.push(`  | ${capitalize(key)}Blocks${toPascalCase(block.type.replace("@", ""))}`);
      }
    });
  }
  arr.push("");
  return arr.join("\n");
};

export const generateSectionsTypes = (sections: { [T: string]: ShopifySection }) => {
  const sectionTypesPath = path.join(process.cwd(), "@types", "sections.ts");

  const imports = getImports(sections);
  let sectionUnionType = "export type Sections =";
  let typeContent = "";
  for (const key in sections) {
    const section = sections[key] as ShopifySection;

    typeContent += `${sectionToTypes(section, key)}\n`;
    sectionUnionType += `\n  | ${capitalize(key)}Section`;
  }

  if (!typeContent) return;

  const finalContent = `${imports + typeContent + sectionUnionType};\n`;

  writeCompareFile(sectionTypesPath, finalContent);
};

export const writeCompareFile = (path: string, content: string) => {
  const ignoreSNIPPETS = process.env.SHOPIFY_CMS_IGNORE_SNIPPETS?.split(",");
  const ignoreLAYOUTS = process.env.SHOPIFY_CMS_IGNORE_LAYOUTS?.split(",");
  const ignoreSECTIONS = process.env.SHOPIFY_CMS_IGNORE_SECTIONS?.split(",");
  const ignoreASSETS = process.env.SHOPIFY_CMS_IGNORE_ASSETS?.split(",");

  if (/[/\\]snippets[/\\]/gi.test(path) && ignoreSNIPPETS?.includes(path.split(/[/\\]/)?.at(-1))) {
    console.log(
      `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.greenBright(
        `Ignored: ${path.replace(process.cwd(), "")}`
      )}`
    );
    return;
  }

  if (/[/\\]layout[/\\]/gi.test(path) && ignoreLAYOUTS?.includes(path.split(/[/\\]/)?.at(-1))) {
    console.log(
      `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.greenBright(
        `Ignored: ${path.replace(process.cwd(), "")}`
      )}`
    );
    return;
  }

  if (/[/\\]sections[/\\]/gi.test(path) && ignoreSECTIONS?.includes(path.split(/[/\\]/)?.at(-1))) {
    console.log(
      `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.greenBright(
        `Ignored: ${path.replace(process.cwd(), "")}`
      )}`
    );
    return;
  }

  if (/[/\\]assets[/\\]/gi.test(path) && ignoreASSETS?.includes(path.split(/[/\\]/)?.at(-1))) {
    console.log(
      `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.greenBright(
        `Ignored: ${path.replace(process.cwd(), "")}`
      )}`
    );
    return;
  }

  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, content);
    console.log(
      `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.blueBright(
        `Created: ${path.replace(process.cwd(), "")}`
      )}`
    );
    return;
  }

  const contentVerification = fs.readFileSync(path, {
    encoding: "utf-8",
  });

  if (contentVerification !== content) {
    console.log(
      `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.blueBright(
        `Updated: ${path.replace(process.cwd(), "")}`
      )}`
    );
    fs.writeFileSync(path, content);
  }
};

export const RESERVED_VARIABLES = [
  "additional_checkout_buttons",
  "all_country_option_tags",
  "all_products",
  "articles",
  "blogs",
  "canonical_url",
  "collections",
  "content_for_additional_checkout_buttons",
  "content_for_header",
  "content_for_index",
  "content_for_layout",
  "country_option_tags",
  "current_page",
  "customer",
  "handle",
  "images",
  "linklists",
  "page_description",
  "page_image",
  "page_title",
  "pages",
  "powered_by_link",
  "settings",
  "collection",
  "canonical_url ",
  "product",
  "shop",
  "page",
  "blog",
  "request",
  "scripts",
  "paginate",
  "checkout",
  "location",
  "current_tags",
  "block",
  "blocks",
  "currency",
  "date",
  "gift_card",
  "routes",
  "sitemap",
  "theme",
  "shop_locale",
  "template",
  "search",
  "recommendations",
  "group",
];

export const createSectionsAndBlocks = (sections: { [T: string]: ShopifySection }) => {
  for (const key in sections) {
    const section = sections[key];

    const sectionPath = path.join(
      process.cwd(),
      "sections",
      toKebabCase(key),
      `${toKebabCase(key)}.tsx`
    );

    if (!fs.existsSync(sectionPath)) {
      console.log(
        `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.blueBright(
          `Created: ${sectionPath.replace(process.cwd(), "")}`
        )}`
      );

      const content = [];
      const name = capitalize(key);
      content.push(`import { FC } from "react";`);
      content.push(`import { ${name}Section } from "types/sections";`);
      content.push(``);
      content.push(
        `export const ${name}: FC<${name}Section> = ({ id, type${
          section.blocks?.length ? `, blocks` : ""
        }${section.settings?.length ? `, settings` : ""} }) => {`
      );
      content.push(`  return <section id={\`section_\${id}\`}>${name} Section</section>;`);
      content.push(`};`);
      content.push(``);

      fs.writeFileSync(sectionPath, content.join("\n"));
    }

    if (section.disabled_block_files) {
      continue;
    }
    section.blocks?.forEach((block) => {
      if (block.type === "@app") return;
      if (
        Array.isArray(section.generate_block_files) &&
        !section.generate_block_files.includes(block.type)
      ) {
        return;
      }

      const blockPath = path.join(
        process.cwd(),
        "sections",
        toKebabCase(key),
        `${toKebabCase(key)}.${block.type}.tsx`
      );

      if (!fs.existsSync(blockPath)) {
        console.log(
          `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.blueBright(
            `Created: ${blockPath.replace(process.cwd(), "")}`
          )}`
        );

        const content = [];
        const name = capitalize(key);
        content.push(`import { FC } from "react";`);
        content.push(`import { ${name}Blocks${capitalize(block.type)} } from "types/sections";`);
        content.push(``);
        content.push(
          `export const ${name}Block${capitalize(block.type)}: FC<${capitalize(
            key
          )}Blocks${capitalize(block.type)}> = ({ id, type${
            block.settings?.length ? `, settings` : ""
          } }) => {`
        );
        content.push(
          `  return <div id={\`block--\${id}\`}>${name} Block - ${capitalize(block.type)}</div>;`
        );
        content.push(`};`);
        content.push(``);

        fs.writeFileSync(blockPath, block?.settings ? content.join("\n") : "");
      }
    });
  }
};
