import { compile } from "json-schema-to-typescript";
import path from "path";
import { MetaObjectDefinitionsQuery } from "shopify-api/codegen/operations";

import { shopifyGQL } from "./../shopify-api/shopify-gql-api";
import { writeCompareFile } from "./generate-sections";

const ownerTypes = [
  "ARTICLE",
  "BLOG",
  "COLLECTION",
  "PAGE",
  "PRODUCT",
  "PRODUCTVARIANT",
  "SHOP",
] as const;

const getType = async (
  type,
  validations: { name: string; type: string; value?: string }[] = [],
  metaObjects: MetaObjectDefinitionsQuery["metaobjectDefinitions"]["nodes"] = []
) => {
  const jsonSchema = validations.find((v) => v.type === "json");

  switch (type) {
    case "product_reference": {
      return `Omit<_Product_liquid, "metafields">`;
    }
    case "list.product_reference": {
      return `Omit<_Product_liquid, "metafields">[]`;
    }
    case "collection_reference": {
      return `Omit<_Collection_liquid, "metafields">`;
    }
    case "list.collection_reference": {
      return `Omit<_Collection_liquid, "metafields">[]`;
    }
    case "variant_reference": {
      return "_Variant_liquid_json";
    }
    case "list.variant_reference": {
      return "_Variant_liquid_json[]";
    }
    case "page_reference": {
      return "_Page_liquid_json";
    }

    case "file_reference": {
      return "_Metafield_liquid_file_reference_generic | _Metafield_liquid_file_reference_image";
    }
    case "list.file_reference": {
      return "(_Metafield_liquid_file_reference_generic | _Metafield_liquid_file_reference_image)[]";
    }
    case "color":
    case "date":
    case "date_time":
    case "single_line_text_field":
    case "multi_line_text_field":
    case "url": {
      return "string";
    }
    case "list.color":
    case "list.date":
    case "list.date_time":
    case "list.single_line_text_field":
    case "list.multi_line_text_field":
    case "list.page_reference": {
      return "string[]";
    }
    case "number_integer": {
      return "number";
    }
    case "list.number_integer": {
      return "number[]";
    }
    case "number_decimal": {
      return "number | string";
    }
    case "list.number_decimal": {
      return "(number | string)[]";
    }
    case "json": {
      if (jsonSchema?.value) {
        const types = await compile(JSON.parse(jsonSchema?.value), "__REPLACER", {
          bannerComment: "",
          additionalProperties: false,
        });

        const content = types.split(/__REPLACER\s*/)[1];

        return content
          .split("\n")
          .map((item, index) => (index === 0 ? item : `    ${item}`))
          .join("\n")
          .replace(/}(\n|\s)*$/gi, "}");
      }

      return "unknown";
    }
    case "volume":
    case "weight":
    case "dimension": {
      return "{ type: string; unit: string; value: number }";
    }
    case "rating": {
      return "{ rating: string; scale_max: string; scale_min: string }";
    }
    case "mixed_reference":
    case "list.mixed_reference": {
      const returnArr = [];
      for (let i = 0; i < validations?.length; i++) {
        const validation = validations[i];
        if (validation.name === "metaobject_definition_ids") {
          const metaobjectIds: string[] = JSON.parse(validation.value);
          const subReturnArr = [];

          for (let j = 0; j < metaobjectIds.length; j++) {
            const metaobject = metaObjects.find((object) => object.id === metaobjectIds[j]);
            if (metaobject) {
              for (let k = 0; k < metaobject.fieldDefinitions.length; k++) {
                const definition = metaobject.fieldDefinitions[k];
                subReturnArr.push(
                  `    ${definition.key}?: ${await getType(
                    definition.type.name,
                    definition.validations,
                    metaObjects
                  )};`
                );
              }
              subReturnArr.push();
            }
          }
          returnArr.push(`{\n  ${subReturnArr.join("\n  ")}\n    }`);
        }
      }
      return returnArr.join(" | ");
    }
  }
};

const getKeyType = (key: (typeof ownerTypes)[number]) => {
  switch (key) {
    case "ARTICLE":
      return "_Article_metafields";
    case "BLOG":
      return "_Blog_metafields";
    case "COLLECTION":
      return "_Collection_metafields";
    case "PAGE":
      return "_Page_metafields";
    case "PRODUCT":
      return "_Product_metafields";
    case "PRODUCTVARIANT":
      return "_Variant_metafields";
    case "SHOP":
      return "_Shop_metafields";
  }
};
const imports = `import { _Metafield_liquid, _Metafield_liquid_file_reference, _Metafield_liquid_list_file_reference, _Metafield_liquid_list_product_reference, _Metafield_liquid_list_variant_reference, _Metafield_liquid_page_reference, _Metafield_liquid_product_reference, _Metafield_liquid_variant_reference,_Metafield_liquid_file_reference_generic,  _Metafield_liquid_file_reference_image, _Product_liquid, _Variant_liquid_json, _Collection_liquid } from "./shopify";\n`;

export async function createMetafieldTypes(gql: ReturnType<typeof shopifyGQL>) {
  const returnData: {
    data: {
      [T: string]: any;
      key: string;
      name: string;
      namespace: string;
      type: string;
      validations: { name: string; type: string; value?: string }[];
    }[];
    owner: (typeof ownerTypes)[number];
  }[] = [];

  const metaobjects = await gql.metaObjectDefinitions();
  for (let i = 0; i < ownerTypes.length; i++) {
    const owner = ownerTypes[i];

    const data = await gql.metafieldDefinitions({ ownerType: owner });

    returnData.push({
      owner,
      data: data?.metafieldDefinitions.nodes
        /* ?.filter(({ node }) => node.namespace === "data")*/
        .map((node, index, arr) => ({
          ...node,
          type: node.type.name,
        })),
    });
  }

  const metafieldTypesContent = [imports];

  for (let i = 0; i < returnData.length; i++) {
    const { owner, data } = returnData[i];

    if (data.length === 0) {
      metafieldTypesContent.push(
        `export type ${getKeyType(owner)} = { [T: string]: _Metafield_liquid };\n`
      );
    }
    if (data.length > 0) {
      metafieldTypesContent.push(`export type ${getKeyType(owner)} = {`);
      const namespaces = data.reduce<{ [key: string]: (typeof data)[number][] }>((acc, row) => {
        acc[row.namespace] = [...(acc[row.namespace] || []), row];
        return acc;
      }, {});

      for (const namespace in namespaces) {
        const data = namespaces[namespace];
        metafieldTypesContent.push(
          `  ${/^[a-z_][a-z0-9_]*$/gi.test(namespace) ? namespace : `"${namespace}"`}?: {`
        );

        for (let index = 0; index < data.length; index++) {
          const { key, type, validations } = data[index];
          metafieldTypesContent.push(
            `    ${/^[a-z_][a-z0-9_]*$/gi.test(key) ? key : `"${key}"`}?: ${await getType(
              type,
              validations,
              metaobjects?.metaobjectDefinitions?.nodes
            )};`
          );
        }

        metafieldTypesContent.push(`  };`);
      }

      metafieldTypesContent.push("};\n");
    }
  }

  const metafieldPath = path.join(process.cwd(), "@types", "metafields.ts");
  const metafieldContent = metafieldTypesContent.join("\n");

  writeCompareFile(metafieldPath, metafieldContent);
}
