import { print } from "graphql";
import { getSdk, Requester } from "./../shopify-api/codegen/requests";

const randomAccessToken = () => {
  const random = Math.floor(Math.random() * 10);
  return process.env[`SHOPIFY_API_ACCESS_TOKEN_HEADLESS_${random}`];
};

export const shopifyGQL = (
  shop = process.env.SHOPIFY_CMS_SHOP,
  access_token = randomAccessToken() || process.env.SHOPIFY_CMS_ACCESS_TOKEN
) => {
  const requester: Requester = async (query, variables, options = {}) => {
    const { headers, ...fetchOptions } = options as { [T: string]: any };

    return fetch(
      `https://${shop}/admin/api/${process.env.SHOPIFY_API_VERSION ?? "2024-01"}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Shopify-Access-Token": access_token,
          ...(headers ? { headers } : {}),
        },
        body: JSON.stringify({
          query: print(query),
          variables: variables,
        }),
        ...fetchOptions,
      }
    )
      .then((data) => data.json())
      .then((res: any) => {
        if ("data" in res) {
          if ("extensions" in res && "cost" in res.extensions) {
            // console.log(res.extensions.cost);
          }

          return withoutEdgesAndNodes(res.data);
        }
        return withoutEdgesAndNodes(res);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return getSdk(requester);
};

export default function withoutEdgesAndNodes(data: any) {
  let result = Array.isArray(data) ? [] : {};

  if (typeof data !== "object") return data;

  for (const key in data) {
    if (key === "edges") {
      result = withoutEdgesAndNodes(
        data.edges
          .map((edge: any) => edge.node)
          .filter((item: any) => JSON.stringify(item) !== "{}")
      );
    } else {
      result = Object.assign(result, {
        [key]: withoutEdgesAndNodes(data[key]),
      });
    }
  }

  if (data === null) {
    return data;
  }

  return result;
}
