import chalk from "chalk";
import fs from "fs";
import path from "path";
import { PROJECT_ROOT } from "./project-root";

export const initFolders = () => {
  /*= =============== Root Folder ================ */
  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings"))) {
    fs.mkdirSync(path.join(process.cwd(), ".shopify-typed-settings"));
  }

  /*= =============== Config ================ */
  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "config.json"))) {
    fs.writeFileSync(
      path.join(process.cwd(), ".shopify-typed-settings", "config.json"),
      JSON.stringify({})
    );
  }

  /*= =============== Types ================ */
  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "types"))) {
    fs.mkdirSync(path.join(process.cwd(), ".shopify-typed-settings", "types"));
  }

  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "types", "shopify.ts"))) {
    fs.writeFileSync(
      path.join(process.cwd(), ".shopify-typed-settings", "types", "shopify.ts"),
      fs.readFileSync(path.join(PROJECT_ROOT, "./@types/shopify.ts"), { encoding: "utf-8" })
    );
  }

  if (fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "types", "shopify.ts"))) {
    const masterFile = fs.readFileSync(path.join(PROJECT_ROOT, "./@types/shopify.ts"), {
      encoding: "utf-8",
    });
    const currentFile = fs.readFileSync(
      path.join(process.cwd(), ".shopify-typed-settings", "types", "shopify.ts"),
      { encoding: "utf-8" }
    );
    if (masterFile !== currentFile) {
      console.log(chalk.green("updated shopify.ts"));
      fs.writeFileSync(
        path.join(process.cwd(), ".shopify-typed-settings", "types", "shopify.ts"),
        masterFile
      );
    }
  }

  /*= =============== Backup ================ */
  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "backup"))) {
    fs.mkdirSync(path.join(process.cwd(), ".shopify-typed-settings", "backup"));
  }

  /*= =============== Theme ================ */
  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "theme"))) {
    fs.mkdirSync(path.join(process.cwd(), ".shopify-typed-settings", "theme"));
  }

  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "theme", "config"))) {
    fs.mkdirSync(path.join(process.cwd(), ".shopify-typed-settings", "theme", "config"));
  }
  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "theme", "layout"))) {
    fs.mkdirSync(path.join(process.cwd(), ".shopify-typed-settings", "theme", "layout"));
  }
  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "theme", "sections"))) {
    fs.mkdirSync(path.join(process.cwd(), ".shopify-typed-settings", "theme", "sections"));
  }
  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "theme", "snippets"))) {
    fs.mkdirSync(path.join(process.cwd(), ".shopify-typed-settings", "theme", "snippets"));
  }
  if (!fs.existsSync(path.join(process.cwd(), ".shopify-typed-settings", "theme", "templates"))) {
    fs.mkdirSync(path.join(process.cwd(), ".shopify-typed-settings", "theme", "templates"));
  }

  /*= =============== React hooks ================ */
  const hooks = {
    root: path.join(process.cwd(), ".shopify-typed-settings", "hooks"),
    shopifyCms: {
      target: path.join(".shopify-typed-settings", "hooks", "shopify-typed-settings.tsx"),
      src: path.join(PROJECT_ROOT, "./react-hooks/shopify-typed-settings.tsx"),
    },
    shopifyNextCms: {
      target: path.join(".shopify-typed-settings", "hooks", "shopify-next-cms.tsx"),
      src: path.join(PROJECT_ROOT, "./react-hooks/shopify-next-cms.tsx"),
    },
    shopifyCmsZustand: {
      target: path.join(".shopify-typed-settings", "hooks", "shopify-typed-settings-zustand.tsx"),
      src: path.join(PROJECT_ROOT, "./react-hooks/shopify-typed-settings-zustand.tsx"),
    },
  };

  if (!fs.existsSync(hooks.root)) {
    fs.mkdirSync(hooks.root);
  }

  if (!fs.existsSync(hooks.shopifyCms.target)) {
    fs.writeFileSync(
      hooks.shopifyCms.target,
      fs.readFileSync(hooks.shopifyCms.src, { encoding: "utf-8" })
    );
  }

  if (fs.existsSync(hooks.shopifyCms.target)) {
    const masterFile = fs.readFileSync(hooks.shopifyCms.src, { encoding: "utf-8" });
    const currentFile = fs.readFileSync(hooks.shopifyCms.target, { encoding: "utf-8" });

    if (masterFile !== currentFile) {
      console.log(chalk.green("updated shopify-typed-settings.tsx"));
      fs.writeFileSync(hooks.shopifyCms.target, masterFile);
    }
  }

  if (!fs.existsSync(hooks.shopifyNextCms.target)) {
    fs.writeFileSync(
      hooks.shopifyNextCms.target,
      fs.readFileSync(hooks.shopifyNextCms.src, { encoding: "utf-8" })
    );
  }

  if (fs.existsSync(hooks.shopifyNextCms.target)) {
    const masterFile = fs.readFileSync(hooks.shopifyNextCms.src, { encoding: "utf-8" });
    const currentFile = fs.readFileSync(hooks.shopifyNextCms.target, { encoding: "utf-8" });

    if (masterFile !== currentFile) {
      console.log(chalk.green("updated shopify-typed-settings.tsx"));
      fs.writeFileSync(hooks.shopifyNextCms.target, masterFile);
    }
  }

  if (!fs.existsSync(hooks.shopifyCmsZustand.target)) {
    fs.writeFileSync(
      hooks.shopifyCmsZustand.target,
      fs.readFileSync(hooks.shopifyCmsZustand.src, { encoding: "utf-8" })
    );
  }

  if (fs.existsSync(hooks.shopifyCmsZustand.target)) {
    const masterFile = fs.readFileSync(hooks.shopifyCmsZustand.src, { encoding: "utf-8" });
    const currentFile = fs.readFileSync(hooks.shopifyCmsZustand.target, { encoding: "utf-8" });

    if (masterFile !== currentFile) {
      console.log(chalk.green("updated shopify-typed-settings.tsx"));
      fs.writeFileSync(hooks.shopifyCmsZustand.target, masterFile);
    }
  }
};
