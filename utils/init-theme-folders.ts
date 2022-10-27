import chalk from "chalk";
import fs from "fs";
import path from "path";
import { PROJECT_ROOT } from "./project-root";

export const initThemeFolders = (folder: string) => {
  /*= =============== Root Folder ================ */
  if (!fs.existsSync(path.join(process.cwd(), folder))) {
    fs.mkdirSync(path.join(process.cwd(), folder));
  }

  /*= =============== Theme ================ */

  if (!fs.existsSync(path.join(process.cwd(), folder, "locales"))) {
    fs.mkdirSync(path.join(process.cwd(), folder, "locales"));
  }
  if (!fs.existsSync(path.join(process.cwd(), folder, "config"))) {
    fs.mkdirSync(path.join(process.cwd(), folder, "config"));
  }
  if (!fs.existsSync(path.join(process.cwd(), folder, "layout"))) {
    fs.mkdirSync(path.join(process.cwd(), folder, "layout"));
  }
  if (!fs.existsSync(path.join(process.cwd(), folder, "sections"))) {
    fs.mkdirSync(path.join(process.cwd(), folder, "sections"));
  }
  if (!fs.existsSync(path.join(process.cwd(), folder, "snippets"))) {
    fs.mkdirSync(path.join(process.cwd(), folder, "snippets"));
  }
  if (!fs.existsSync(path.join(process.cwd(), folder, "templates"))) {
    fs.mkdirSync(path.join(process.cwd(), folder, "templates"));
  }
};
