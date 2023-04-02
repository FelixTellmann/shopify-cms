import fs from "fs";
import path from "path";

export const initAppExtensionFolders = (folder: string) => {
  /*= =============== Root Folder ================ */
  if (!fs.existsSync(path.join(process.cwd(), "extensions"))) {
    fs.mkdirSync(path.join(process.cwd(), "extensions"));
  }

  if (!fs.existsSync(path.join(process.cwd(), "extensions", folder))) {
    fs.mkdirSync(path.join(process.cwd(), "extensions", folder));
  }

  /*= =============== Theme ================ */

  if (!fs.existsSync(path.join(process.cwd(), "extensions", folder, "assets"))) {
    fs.mkdirSync(path.join(process.cwd(), "extensions", folder, "assets"));
  }
  if (!fs.existsSync(path.join(process.cwd(), "extensions", folder, "locales"))) {
    fs.mkdirSync(path.join(process.cwd(), "extensions", folder, "locales"));
  }
  if (!fs.existsSync(path.join(process.cwd(), "extensions", folder, "blocks"))) {
    fs.mkdirSync(path.join(process.cwd(), "extensions", folder, "blocks"));
  }
  if (!fs.existsSync(path.join(process.cwd(), "extensions", folder, "snippets"))) {
    fs.mkdirSync(path.join(process.cwd(), "extensions", folder, "snippets"));
  }
};
