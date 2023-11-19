/* eslint-disable */
import * as Types from './operations';

import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

export const MetafieldDefinitionsDocument = gql`
    query metafieldDefinitions($ownerType: MetafieldOwnerType!) {
  metafieldDefinitions(first: 150, ownerType: $ownerType) {
    nodes {
      ownerType
      id
      namespace
      name
      validations {
        name
        type
        value
      }
      key
      type {
        name
        category
      }
    }
  }
}
    `;
export const MetaObjectDefinitionsDocument = gql`
    query metaObjectDefinitions {
  metaobjectDefinitions(first: 100) {
    nodes {
      id
      type
      name
      displayNameKey
      access {
        admin
      }
      fieldDefinitions {
        name
        key
        required
        validations {
          name
          type
          value
        }
        key
        type {
          name
          category
        }
      }
    }
  }
}
    `;
export type Requester<C = {}, E = unknown> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R> | AsyncIterable<R>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    metafieldDefinitions(variables: Types.MetafieldDefinitionsQueryVariables, options?: C): Promise<Types.MetafieldDefinitionsQuery> {
      return requester<Types.MetafieldDefinitionsQuery, Types.MetafieldDefinitionsQueryVariables>(MetafieldDefinitionsDocument, variables, options) as Promise<Types.MetafieldDefinitionsQuery>;
    },
    metaObjectDefinitions(variables?: Types.MetaObjectDefinitionsQueryVariables, options?: C): Promise<Types.MetaObjectDefinitionsQuery> {
      return requester<Types.MetaObjectDefinitionsQuery, Types.MetaObjectDefinitionsQueryVariables>(MetaObjectDefinitionsDocument, variables, options) as Promise<Types.MetaObjectDefinitionsQuery>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;