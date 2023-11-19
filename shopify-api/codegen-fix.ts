// @ts-ignore
const fs = require("fs");
// @ts-ignore
const path = require("path");

// @ts-ignore
const flattenEdges = (str: string) => {
  let iteration = 0;
  while (str.includes("edges: ") && iteration < 10) {
    str = str.replace(/{ edges: Array<{ node:((.(?!edges))*?)}> }/gi, "($1)[]");
    iteration++;
    console.log(iteration);
  }
  str = str.replace(/ \| {}/gi, "");
  return str;
};
// shopify-api/codegen/operations.ts
// @ts-ignore
const fixCodegenOperations = () => {
  const operationsPath = path.join(process.cwd(), "shopify-api", "codegen", "operations.ts");
  const data = fs.readFileSync(operationsPath, {
    encoding: "utf-8",
  });

  fs.writeFileSync(operationsPath, flattenEdges(data));
};

fixCodegenOperations();
