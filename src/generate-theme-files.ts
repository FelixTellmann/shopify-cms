import chalk from "chalk";
import fs from "fs";
import path from "path";
import { sectionToLiquid_WithLocalization } from "./section-to-liquid-with-localization";
import { toKebabCase } from "./../utils/to-kebab-case";
import { toSnakeCase } from "./../utils/to-snake-case";
import { writeCompareFile } from "./generate-sections";
import { getAllFiles, getSectionSchemas, getSourcePaths } from "./index";

export const generateThemeFiles = (folder, sectionsSchemas, sectionLocaleCount) => {
  const { snippets, layouts, sections } = getSourcePaths();
  const translations: any = {};

  for (const key in sectionsSchemas) {
    const section = sectionsSchemas[key];
    const sectionName = `${toKebabCase(key)}.liquid`;
    const sectionPath = path.join(process.cwd(), folder, "sections", sectionName);

    const headerSections = process.env.SHOPIFY_CMS_GLOBAL_HEADER_SECTIONS?.split(",") ?? [];
    const footerSections = process.env.SHOPIFY_CMS_GLOBAL_FOOTER_SECTIONS?.split(",") ?? [];
    const globalSections = [...headerSections, ...footerSections];

    const translationArray = [];

    if (!globalSections.includes(toKebabCase(key))) {
      translationArray.push(`{% include "_section-content", type: "${toKebabCase(key)}" %}`);
    }

    if (globalSections.includes(toKebabCase(key))) {
      translationArray.push(`{% include "_section-global-content", type: "${toKebabCase(key)}" %}`);
    }

    if (process.env.SHOPIFY_SECTIONS_BEFORE_RENDER) {
      translationArray.push(process.env.SHOPIFY_SECTIONS_BEFORE_RENDER);
    }

    const sectionExists = fs.existsSync(
      path.join(process.cwd(), "sections", toKebabCase(key), `${toKebabCase(key)}.tsx`)
    );

    if (process.env.SHOPIFY_SECTIONS_AFTER_RENDER) {
      translationArray.push(process.env.SHOPIFY_SECTIONS_AFTER_RENDER);
    }
    translationArray.push(sectionToLiquid_WithLocalization(section, key, sectionLocaleCount));
    writeCompareFile(sectionPath, translationArray.join("\n"));
  }

  for (let i = 0; i < snippets.length; i++) {
    const snippet = snippets[i];
    const snippetName = snippet.split(/[\\/]/gi).at(-1);

    const snippetPath = path.join(process.cwd(), folder, "snippets", snippetName);

    const returnArr = [];

    const rawContent = fs.readFileSync(snippet, {
      encoding: "utf-8",
    });

    if (rawContent) {
      const translatedContent = rawContent.replace(
        /<t(\s+[^>]*)*>((.|\r|\n)*?)<\/t>/gi,
        (str, group1, group2) => {
          const group = toSnakeCase(snippet.split(/[\\/]/gi).at(-1).split(".").at(0)).trim();
          const content = toSnakeCase(group2?.split(" ")?.slice(0, 2)?.join("_") ?? "").trim();
          const backupContent = toSnakeCase(group2).trim();
          const id = toSnakeCase(group1?.replace(/id="(.*)"/gi, "$1") ?? "").trim();

          if (!(group in translations)) {
            translations[group] = {};
          }

          if (id && !(id in translations[group])) {
            translations[group][id] = group2;
            return `{{ "${group}.${id}" | t }}`;
          }

          if (!(content in translations[group])) {
            translations[group][content] = group2;
            return `{{ "${group}.${content}" | t }}`;
          }

          if (translations[group][content] !== group2) {
            if (!(backupContent in translations[group])) {
              translations[group][backupContent] = group2;
              return `{{ "${group}.${backupContent}" | t }}`;
            }
            if (translations[group][backupContent] !== group2) {
              translations[group][`${content}_2`] = group2;
              return `{{ "${group}.${content}_2" | t }}`;
            }
          }
          if (translations[group][content] === group2) {
            return `{{ "${group}.${content}" | t }}`;
          }

          return group2;
        }
      );
      returnArr.push(translatedContent);
    }

    writeCompareFile(snippetPath, returnArr.join("\n"));
  }

  for (let i = 0; i < layouts.length; i++) {
    const layout = layouts[i];
    const layoutName = layout.split(/[\\/]/gi).at(-1);
    const layoutPath = path.join(process.cwd(), folder, "layout", layoutName);

    const returnArr = [];

    const rawContent = fs.readFileSync(layout, {
      encoding: "utf-8",
    });

    if (rawContent) {
      const translatedContent = rawContent.replace(
        /<t(\s+[^>]*)*>((.|\r|\n)*?)<\/t>/gi,
        (str, group1, group2) => {
          const group = toSnakeCase(layout.split(/[\\/]/gi).at(-1).split(".").at(0)).trim();
          const content = toSnakeCase(group2?.split(" ")?.slice(0, 2)?.join("_") ?? "").trim();
          const backupContent = toSnakeCase(group2).trim();
          const id = toSnakeCase(group1?.replace(/id="(.*)"/gi, "$1") ?? "").trim();

          if (!(group in translations)) {
            translations[group] = {};
          }

          if (id && !(id in translations[group])) {
            translations[group][id] = group2;
            return `{{ "${group}.${id}" | t }}`;
          }

          if (!(content in translations[group])) {
            translations[group][content] = group2;
            return `{{ "${group}.${content}" | t }}`;
          }

          if (translations[group][content] !== group2) {
            if (!(backupContent in translations[group])) {
              translations[group][backupContent] = group2;
              return `{{ "${group}.${backupContent}" | t }}`;
            }
            if (translations[group][backupContent] !== group2) {
              translations[group][`${content}_2`] = group2;
              return `{{ "${group}.${content}_2" | t }}`;
            }
          }
          if (translations[group][content] === group2) {
            return `{{ "${group}.${content}" | t }}`;
          }

          return group2;
        }
      );
      returnArr.push(translatedContent);
    }

    writeCompareFile(layoutPath, returnArr.join("\n"));
  }

  const translationsPath = path.join(process.cwd(), folder, "locales", "en.default.json");
  writeCompareFile(translationsPath, JSON.stringify(translations, undefined, 2));

  const target = getAllFiles(folder);

  if (process.env.SHOPIFY_CMS_DELETE) {
    for (let i = 0; i < target.length; i++) {
      if (/sections[\\/][^\\/.]*\.tsx$/gi.test(target[i])) {
        const fileName = `${target[i].split(/[\\/]/gi).at(-1).split(".")[0]}.liquid`;
        const targetFile = source.find((sourcePath) =>
          sourcePath.split(/[\\/]/gi).at(-1).includes(fileName)
        );
        if (!targetFile) {
          console.log(
            `[${chalk.gray(new Date().toLocaleTimeString())}]: ${chalk.redBright(
              `Deleted: ${target[i]}`
            )}`
          );
          fs.unlinkSync(path.join(process.cwd(), target[i].replace(/\.(ts|tsx)$/gi, ".liquid")));
        }
      }

      if (/snippets[\\/][^\\/]*\.liquid$/gi.test(target[i])) {
        const fileName = target[i].split(/[\\/]/gi).at(-1);
        const targetFile = snippets.find((sourcePath) =>
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
        const targetFile = layouts.find((sourcePath) =>
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
    }
  }
};
