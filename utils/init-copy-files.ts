import fs from "fs";
import path from "path";
import { getAllFiles } from "./get-all-files";
import { PROJECT_ROOT } from "./project-root";

export const copyFiles = () => {
  const files = getAllFiles("theme");
  const fileData = files.map((file) => ({
    key: file.replace("theme/", ""),
    content: fs.readFileSync(path.join(PROJECT_ROOT, file), { encoding: "utf-8" }),
  }));

  fileData.forEach(({ key, content }) => {
    fs.writeFileSync(path.join(process.cwd(), ".shopify-cms", "theme", key), content);
  });
};
