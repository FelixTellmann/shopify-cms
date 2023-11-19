import type { CodegenConfig } from "@graphql-codegen/cli";

require("dotenv").config();

const config: CodegenConfig = {
  schema: {
    [`${process.env.SHOPIFY_ADMIN_SHOP_GQL_URL}`]: {
      headers: {
        "X-Shopify-Access-Token": `${process.env.SHOPIFY_ADMIN_API_KEY}`
      }
    }
  },
  documents: "shopify-api/**/*.{ts,tsx}",
  generates: {
    "shopify-api/codegen/types.ts": {
      plugins: [
        {
          add: {
            content: "/* eslint-disable */"
          }
        },
        "typescript",
        // "typescript-validation-schema"
      ],
      config: {
        // skipGraphQLImport: true,
        onlyOperationTypes: true,
        skipTypeNameForRoot: true,
        skipTypename: true,
        enumsAsTypes: true,
        typesPrefix: "",
        useTypeImports: true,
        flattenGeneratedTypes: true,
        // schema: 'zod'
      }
    },
    "shopify-api/codegen/operations.ts": {
      preset: "import-types",
      presetConfig: {
        "typesPath": "./types"
      },
      plugins: [
        {
          add: {
            content: "/* eslint-disable */"
          }
        },
        "typescript-operations",

        // 'typescript-validation-schema',
      ],
      config: {
        // skipGraphQLImport: true,
        onlyOperationTypes: true,
        skipTypeNameForRoot: true,
        skipTypename: true,
        enumsAsTypes: true,
        typesPrefix: "",
        // useTypeImports: true,
        flattenGeneratedTypes: true,
        // schema: 'zod'
      }
    },
    "shopify-api/codegen/requests.ts": {
      preset: "import-types",
      presetConfig: {
        "typesPath": "./operations"
      },
      plugins: [
        {
          add: {
            content: "/* eslint-disable */"
          }
        },
        "typescript-generic-sdk",
        // "graphql-codegen-zod",

        // "typescript-graphql-request",
        // 'typescript-validation-schema',
      ],
      config: {
        // skipGraphQLImport: true,
        onlyOperationTypes: true,
        skipTypeNameForRoot: true,
        skipTypename: true,
        enumsAsTypes: true,
        typesPrefix: "",
        // useTypeImports: true,
        flattenGeneratedTypes: true,
        // schema: 'zod'
      }
    }

  }
};
export default config;
